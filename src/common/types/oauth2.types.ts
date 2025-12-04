/**
 * OAuth2 Types for NestJS Application
 * Comprehensive type definitions for OAuth2 authentication flows
 */

/**
 * OAuth2 Provider Configuration
 */
export interface OAuth2ProviderConfig {
  clientId: string;
  clientSecret: string;
  callbackURL: string;
  scope?: string[];
}

/**
 * OAuth2 User Profile from Provider
 */
export interface OAuth2UserProfile {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
  provider: OAuth2Provider;
  providerId: string;
}

/**
 * Supported OAuth2 Providers
 */
export enum OAuth2Provider {
  GOOGLE = 'google',
  GITHUB = 'github',
  FACEBOOK = 'facebook',
  TWITTER = 'twitter',
  LINKEDIN = 'linkedin',
  DISCORD = 'discord',
}

/**
 * OAuth2 Strategy Options
 */
export interface OAuth2StrategyOptions {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
  scope?: string[];
  profileFields?: string[];
}

/**
 * OAuth2 Authentication Result
 */
export interface OAuth2AuthResult {
  user: OAuth2UserProfile;
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

/**
 * OAuth2 Token Response
 */
export interface OAuth2TokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

/**
 * OAuth2 User Info Response
 */
export interface OAuth2UserInfoResponse {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email?: boolean;
  locale?: string;
}

/**
 * OAuth2 Error Response
 */
export interface OAuth2ErrorResponse {
  error: string;
  error_description?: string;
  error_uri?: string;
}

/**
 * OAuth2 Callback Query Parameters
 */
export interface OAuth2CallbackQuery {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
}

/**
 * OAuth2 State Verification
 */
export interface OAuth2State {
  nonce: string;
  redirectUrl?: string;
  userId?: string;
  timestamp: number;
}

/**
 * OAuth2 Strategy Configuration
 */
export interface OAuth2StrategyConfig {
  provider: OAuth2Provider;
  clientId: string;
  clientSecret: string;
  callbackURL: string;
  scope?: string[];
  profileFields?: string[];
  enablePKCE?: boolean;
  state?: boolean;
}

/**
 * OAuth2 Account Linking
 */
export interface OAuth2AccountLink {
  userId: string;
  provider: OAuth2Provider;
  providerId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * OAuth2 Session Data
 */
export interface OAuth2Session {
  state?: string;
  nonce?: string;
  redirectUrl?: string;
  provider?: OAuth2Provider;
}

/**
 * OAuth2 Authorization URL Parameters
 */
export interface OAuth2AuthUrlParams {
  client_id: string;
  redirect_uri: string;
  response_type: 'code' | 'token';
  scope?: string;
  state?: string;
  nonce?: string;
  code_challenge?: string;
  code_challenge_method?: 'S256' | 'plain';
}

/**
 * OAuth2 Token Exchange Parameters
 */
export interface OAuth2TokenParams {
  grant_type: 'authorization_code' | 'refresh_token' | 'client_credentials';
  code?: string;
  redirect_uri?: string;
  client_id: string;
  client_secret: string;
  refresh_token?: string;
  code_verifier?: string;
}

/**
 * OAuth2 Provider Specific Types
 */

// Google OAuth2
export interface GoogleOAuth2Profile {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

// GitHub OAuth2
export interface GitHubOAuth2Profile {
  id: number;
  login: string;
  email: string;
  name: string;
  avatar_url: string;
  bio?: string;
  location?: string;
  company?: string;
}

// Facebook OAuth2
export interface FacebookOAuth2Profile {
  id: string;
  email: string;
  name: string;
  first_name: string;
  last_name: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

/**
 * OAuth2 Strategy Factory Options
 */
export interface OAuth2StrategyFactoryOptions {
  providers: OAuth2StrategyConfig[];
  defaultRedirectUrl?: string;
  failureRedirectUrl?: string;
  successRedirectUrl?: string;
}

/**
 * OAuth2 Guard Options
 */
export interface OAuth2GuardOptions {
  provider: OAuth2Provider;
  failureRedirect?: string;
  successRedirect?: string;
  scope?: string[];
}

/**
 * OAuth2 Decorator Options
 */
export interface OAuth2DecoratorOptions {
  provider: OAuth2Provider;
  scope?: string[];
  state?: boolean;
  failureRedirect?: string;
  successRedirect?: string;
}
