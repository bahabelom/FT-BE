import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OAuth2Provider } from '../../common/types/oauth2.types';

@Injectable()
export class GoogleOAuth2AuthGuard extends AuthGuard('google') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const result = (await super.canActivate(context)) as boolean;
    const request = context.switchToHttp().getRequest();
    
    // Log OAuth2 authentication attempt
    console.log(`🔐 [GOOGLE OAUTH2] Authentication attempt for user: ${request.user?.email || 'unknown'}`);
    
    return result;
  }
}

@Injectable()
export class GitHubOAuth2AuthGuard extends AuthGuard('github') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const result = (await super.canActivate(context)) as boolean;
    const request = context.switchToHttp().getRequest();
    
    // Log OAuth2 authentication attempt
    console.log(`🔐 [GITHUB OAUTH2] Authentication attempt for user: ${request.user?.email || 'unknown'}`);
    
    return result;
  }
}
