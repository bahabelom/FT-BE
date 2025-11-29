import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserPayloadDto } from './dto/user-payload.dto';
import { JwtPayloadDto } from './dto/jwt-payload.dto';
import { UserWithRole } from '../common/types/user-with-role.type';
import * as bcrypt from 'bcrypt';
import * as argon2 from 'argon2';

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
      return result as UserPayloadDto;
    }
    return null;
  }

  generateAccessToken(user: UserPayloadDto): string {
    const payload: JwtPayloadDto = { 
      email: user.email, 
      sub: user.id, 
      name: user.name,
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
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });
    
    return {
      message: 'Login successful',
      ...tokens,
      expires_in: 30, // 30 seconds
      id: user.id,
      email: user.email,
      role: user.role ,
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
      name: user.name,
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
      name: user.name,
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
}
