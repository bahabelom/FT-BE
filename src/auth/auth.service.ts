import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserPayloadDto } from './dto/user-payload.dto';
import { JwtPayloadDto } from './dto/jwt-payload.dto';
import { UserWithRole } from '../common/types/user-with-role.type';
import { OAuth2UserProfile } from '../common/types/oauth2.types';
import * as bcrypt from 'bcrypt';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

// We'll use database storage instead of in-memory blacklist

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private prisma: PrismaService,
    private jwtService: JwtService,
    @Inject('REFRESH_JWT_SERVICE') private refreshJwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<UserPayloadDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    }) as UserWithRole | null;

    if (user && await bcrypt.compare(password, user.password)) {
      const { password: _, ...result } = user;
      return {
        ...result,
        firstName: user.firstName,
        lastName: user.lastName,
      } as UserPayloadDto;
    }
    return null;
  }

  generateAccessToken(user: UserPayloadDto): string {
    const payload: JwtPayloadDto = { 
      email: user.email, 
      sub: user.id, 
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      type: 'access'
    };
    
    return this.jwtService.sign(payload);
  }

  generateRefreshToken(user: UserPayloadDto): string {
    const payload: Partial<JwtPayloadDto> = { 
      sub: user.id,
      type: 'refresh'
    };
    
    return this.refreshJwtService.sign(payload);
  }

  generateTokens(user: UserPayloadDto) {
    return {
      access_token: this.generateAccessToken(user),
      refresh_token: this.generateRefreshToken(user),
    };
  }

  async login(user: UserPayloadDto) {
    const tokens = this.generateTokens(user);
    
    // Hash and store the refresh token in database
    const hashedRefreshToken = await argon2.hash(tokens.refresh_token);
    
    
    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    }) as UserWithRole | null;
    
    if (!fullUser) {
      throw new UnauthorizedException('User not found');
    }
    
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });
    
    return {
      message: 'Login successful',
      ...tokens,
      expires_in: 3600, // 1 hour (in seconds)
      id: fullUser.id,
      email: fullUser.email,
      firstName: fullUser.firstName,
      lastName: fullUser.lastName,
      role: fullUser.role,
    };
  }

  async validateRefreshToken(userId: number): Promise<UserPayloadDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    }) as UserWithRole | null;

    if (!user?.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }

  async verifyRefreshToken(userId: number, refreshToken: string): Promise<UserPayloadDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    }) as UserWithRole | null;

    if (!user?.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!await argon2.verify(user.refreshToken, refreshToken)) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }

  async refreshToken(user: UserPayloadDto) {
    // Generate new tokens
    const tokens = this.generateTokens(user);

    // Hash and store the new refresh token
    const hashedRefreshToken = await argon2.hash(tokens.refresh_token);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    return {
      message: 'Token refreshed successfully',
      ...tokens,
      expires_in: 30, // 30 seconds
      id: user.id,
      email: user.email,
    };
  }

  async logout(userId: number) {
    // Clear the refresh token from database
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    
    return { message: 'Logged out successfully' };
  }

  /**
   * Find or create a user from OAuth2 profile
   */
  async findOrCreateOAuthUser(profile: OAuth2UserProfile): Promise<UserPayloadDto> {
    // Try to find existing user by email
    let user = await this.prisma.user.findUnique({
      where: { email: profile.email },
    }) as UserWithRole | null;

    if (user) {
      // User exists, return user payload
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      };
    }

    // User doesn't exist, create new user
    // Use firstName/lastName from profile if available, otherwise split name
    const nameStr = typeof profile.name === 'string' ? profile.name : '';
    const firstName = profile.firstName || (nameStr ? nameStr.trim().split(/\s+/)[0] : '') || profile.email.split('@')[0];
    const lastName = profile.lastName || (nameStr ? nameStr.trim().split(/\s+/).slice(1).join(' ') : '');

    // Generate a random secure password for OAuth users (they won't use it)
    const randomPassword = crypto.randomBytes(32).toString('hex');
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    // Create new user
    const newUser = await this.prisma.user.create({
      data: {
        email: profile.email,
        firstName,
        lastName,
        password: hashedPassword,
        role: 'user', // Default role for OAuth users
      },
    }) as UserWithRole;

    return {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
    };
  }

  /**
   * Handle OAuth2 login flow
   */
  async handleOAuthLogin(profile: OAuth2UserProfile): Promise<any> {
    // Find or create user from OAuth profile
    const user = await this.findOrCreateOAuthUser(profile);

    // Generate tokens and login (same as regular login)
    return this.login(user);
  }
}
