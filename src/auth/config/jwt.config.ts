import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

export default {
  asProvider() {
    return {
      imports: [],
      useFactory: async (configService: ConfigService): Promise<JwtModuleOptions> => {
        return {
          secret: configService.get<string>('JWT_SECRET') || 'your-super-secret-jwt-key-change-this-in-production',
          signOptions: {
            expiresIn: (configService.get<string>('JWT_EXPIRES_IN') || '1h') as any,
          },
        };
      },
      inject: [ConfigService],
    };
  },
  
  refreshAsProvider() {
    return {
      imports: [],
      useFactory: async (configService: ConfigService): Promise<JwtModuleOptions> => {
        return {
          secret: configService.get<string>('REFRESH_JWT_SECRET') || '1b2957f0ee68128004b125528643dd0f115de069d56c155b0b4d569bfe254e1e',
          signOptions: {
            expiresIn: (configService.get<string>('REFRESH_JWT_EXPIRES_IN') || '7d') as any,
          },
        };
      },
      inject: [ConfigService],
    };
  },
};
