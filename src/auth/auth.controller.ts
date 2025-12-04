import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus, UnauthorizedException, Get, Res, Query } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RefreshJwtAuthGuard } from './guards/refresh-jwt-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleOAuth2AuthGuard, FacebookOAuth2AuthGuard } from './guards/oauth2-auth.guard';
import { Public } from '../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @Post('signup')
  async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    const { password, ...result } = user;
    return {
      success: true,
      data: {
        message: 'User registered successfully',
        user: result,
      },
    };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    const loginResult = await this.authService.login(req.user);
    return {
      success: true,
      data: loginResult,
    };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshJwtAuthGuard)
  @Post('refresh')
  async refresh(@Request() req) {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    const user = await this.authService.verifyRefreshToken(req.user.userId, token);
    return this.authService.refreshToken(user);
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Request() req) {
    return this.authService.logout(req.user.userId);
  }

  /**
   * Initiate Google OAuth flow
   */
  @Public()
  @Get('google')
  @UseGuards(GoogleOAuth2AuthGuard)
  async googleAuth() {
    // Guard initiates OAuth flow
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleOAuth2AuthGuard)
  async googleAuthCallback(@Request() req, @Res() res: Response, @Query('state') state?: string) {
    const profile = req.user;
    const loginResult = await this.authService.handleOAuthLogin(profile);
    
    const redirectUri = state ? decodeURIComponent(state) : null;
    
    if (redirectUri) {
      const params = new URLSearchParams({
        access_token: loginResult.access_token,
        refresh_token: loginResult.refresh_token,
        user: JSON.stringify({
          id: loginResult.id,
          email: loginResult.email,
          firstName: loginResult.firstName,
          lastName: loginResult.lastName,
          role: loginResult.role,
        }),
      });
      
      return res.redirect(`${redirectUri}?${params.toString()}`);
    }
    
    return res.json({
      success: true,
      data: loginResult,
    });
  }

  /**
   * Initiate Facebook OAuth flow
   */
  @Public()
  @Get('facebook')
  @UseGuards(FacebookOAuth2AuthGuard)
  async facebookAuth() {
    // Guard initiates OAuth flow
  }

  @Public()
  @Get('facebook/callback')
  @UseGuards(FacebookOAuth2AuthGuard)
  async facebookAuthCallback(@Request() req, @Res() res: Response, @Query('state') state?: string) {
    const profile = req.user;
    const loginResult = await this.authService.handleOAuthLogin(profile);
    
    const redirectUri = state ? decodeURIComponent(state) : null;
    
    if (redirectUri) {
      const params = new URLSearchParams({
        access_token: loginResult.access_token,
        refresh_token: loginResult.refresh_token,
        user: JSON.stringify({
          id: loginResult.id,
          email: loginResult.email,
          firstName: loginResult.firstName,
          lastName: loginResult.lastName,
          role: loginResult.role,
        }),
      });
      
      return res.redirect(`${redirectUri}?${params.toString()}`);
    }
    
    return res.json({
      success: true,
      data: loginResult,
    });
  }
}
