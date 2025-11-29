import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshJwtStrategy } from './strategies/refresh-jwt.strategy';
import { UsersModule } from '../users/users.module';
import jwtConfig from './config/jwt.config';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync(jwtConfig.asProvider()),
    JwtModule.registerAsync({
      ...jwtConfig.refreshAsProvider(),
      global: false,
    }),
    UsersModule,
  ],
  providers: [
    AuthService, 
    LocalStrategy, 
    JwtStrategy, 
    RefreshJwtStrategy,
    {
      provide: 'REFRESH_JWT_SERVICE',
      useFactory: (configService: ConfigService) => {
        return new JwtService({
          secret: configService.get('REFRESH_JWT_SECRET') || '1b2957f0ee68128004b125528643dd0f115de069d56c155b0b4d569bfe254e1e',
          signOptions: {
            expiresIn: configService.get('REFRESH_JWT_EXPIRES_IN') || '7d',
          },
        });
      },
      inject: [ConfigService],
    },
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}