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

  authenticate(req: any, options?: any) {
    const opts = { ...(options || {}) };
    opts.prompt = 'select_account';
    opts.accessType = 'offline';
    
    const redirectUri = req.query?.redirect_uri;
    if (redirectUri) {
      opts.state = encodeURIComponent(redirectUri);
    }
    
    return super.authenticate(req, opts);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {

    const id = profile.id || profile.sub || '';
    const email = profile.emails?.[0]?.value || profile.email || '';
    const displayName = profile.displayName || profile.name || '';
    const givenName = profile.name?.givenName || profile.given_name || '';
    const familyName = profile.name?.familyName || profile.family_name || '';
    const picture = profile.photos?.[0]?.value || profile.picture || '';
    
    // Ensure name is a string
    const name = typeof displayName === 'string' 
      ? displayName 
      : `${givenName || ''} ${familyName || ''}`.trim() || email.split('@')[0];
    
    // Extract firstName and lastName
    const firstName = givenName || (typeof name === 'string' ? name.split(/\s+/)[0] : '') || email.split('@')[0] || '';
    const lastName = familyName || (typeof name === 'string' ? name.split(/\s+/).slice(1).join(' ') : '') || '';
    
    const user: OAuth2UserProfile = {
      id: id,
      email: email,
      name: name,
      firstName: firstName,
      lastName: lastName,
      picture: picture,
      provider: OAuth2Provider.GOOGLE,
      providerId: id,
    };

    done(null, user);
  }
}
