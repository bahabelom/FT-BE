import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { OAuth2Provider, OAuth2UserProfile, GoogleOAuth2Profile } from '../../common/types/oauth2.types';

@Injectable()
export class GoogleOAuth2Strategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || '/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: GoogleOAuth2Profile,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, email, given_name, family_name, picture } = profile;
    
    const user: OAuth2UserProfile = {
      id: id,
      email: email || '',
      name: name || `${given_name || ''} ${family_name || ''}`.trim(),
      picture: picture,
      provider: OAuth2Provider.GOOGLE,
      providerId: id,
    };

    done(null, user);
  }
}
