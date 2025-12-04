import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';
import { OAuth2Provider, OAuth2UserProfile } from '../../common/types/oauth2.types';

@Injectable()
export class FacebookOAuth2Strategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>('FACEBOOK_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('FACEBOOK_CLIENT_SECRET'),
      callbackURL: configService.get<string>('FACEBOOK_CALLBACK_URL') || '/auth/facebook/callback',
      scope: ['email', 'public_profile'],
      profileFields: ['id', 'email', 'name', 'first_name', 'last_name', 'picture.type(large)'],
    });
  }

  authenticate(req: any, options?: any) {
    const opts = { ...(options || {}) };
    
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
    done: (err: any, user: any) => void,
  ): Promise<any> {
    // passport-facebook profile structure:
    // profile.id, profile.displayName, profile.name.givenName, profile.name.familyName
    // profile.emails[0].value, profile.photos[0].value
    // Also may have: profile._json.first_name, profile._json.last_name, profile._json.email, profile._json.picture
    
    const id = profile.id || '';
    // Try multiple ways to get email
    const email = profile.emails?.[0]?.value || profile._json?.email || '';
    const displayName = profile.displayName || profile.name || '';
    const givenName = profile.name?.givenName || profile._json?.first_name || '';
    const familyName = profile.name?.familyName || profile._json?.last_name || '';
    const picture = profile.photos?.[0]?.value || profile._json?.picture?.data?.url || '';
    
    // Facebook might not provide email - generate a fallback if needed
    // Use Facebook ID as part of email if email is missing
    const finalEmail = email || `facebook_${id}@facebook.oauth`;
    
    // Ensure name is a string
    const name = typeof displayName === 'string' 
      ? displayName 
      : `${givenName || ''} ${familyName || ''}`.trim() || 'User';
    
    // Extract firstName and lastName
    const firstName = givenName || (typeof name === 'string' ? name.split(/\s+/)[0] : '') || 'User';
    const lastName = familyName || (typeof name === 'string' ? name.split(/\s+/).slice(1).join(' ') : '') || '';
    
    const user: OAuth2UserProfile = {
      id: id,
      email: finalEmail,
      name: name,
      firstName: firstName,
      lastName: lastName,
      picture: picture,
      provider: OAuth2Provider.FACEBOOK,
      providerId: id,
    };

    done(null, user);
  }
}

