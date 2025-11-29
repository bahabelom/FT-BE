import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { OAuth2Provider, OAuth2UserProfile, GitHubOAuth2Profile } from '../../common/types/oauth2.types';

@Injectable()
export class GitHubOAuth2Strategy extends PassportStrategy(Strategy, 'github') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>('GITHUB_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GITHUB_CALLBACK_URL') || '/auth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: GitHubOAuth2Profile,
    done: (err: any, user: any) => void,
  ): Promise<any> {
    const { id, login, email, name, avatar_url } = profile;
    
    const user: OAuth2UserProfile = {
      id: id.toString(),
      email: email || '',
      name: name || login,
      picture: avatar_url,
      provider: OAuth2Provider.GITHUB,
      providerId: id.toString(),
    };

    done(null, user);
  }
}
