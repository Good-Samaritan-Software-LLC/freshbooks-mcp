/**
 * FreshBooks OAuth2 Authentication Types
 *
 * Type definitions for OAuth configuration, token management, and authentication status.
 */

/**
 * OAuth2 configuration for FreshBooks API
 */
export interface OAuthConfig {
  /** OAuth2 client ID from FreshBooks app registration */
  clientId: string;

  /** OAuth2 client secret from FreshBooks app registration */
  clientSecret: string;

  /** OAuth2 redirect URI (must match registered URI) */
  redirectUri: string;

  /** OAuth2 scopes (optional, FreshBooks uses default scopes) */
  scopes?: string[];
}

/**
 * OAuth2 token data stored and managed by the token store
 */
export interface TokenData {
  /** Access token for API requests */
  accessToken: string;

  /** Refresh token for obtaining new access tokens */
  refreshToken: string;

  /** Unix timestamp when the access token expires */
  expiresAt: number;

  /** Token type (typically "Bearer") */
  tokenType: string;

  /** Active FreshBooks account ID (if selected) */
  accountId?: string;

  /** Active FreshBooks business ID (if selected) */
  businessId?: number;
}

/**
 * Authentication status information
 */
export interface AuthStatus {
  /** Whether currently authenticated with valid token */
  authenticated: boolean;

  /** Seconds until token expires (if authenticated) */
  expiresIn?: number;

  /** Active account ID (if authenticated) */
  accountId?: string;

  /** Active business ID (if authenticated) */
  businessId?: number;

  /** Reason for not being authenticated (if not authenticated) */
  reason?: 'no_token' | 'token_expired' | 'invalid_token';

  /** Whether a refresh token is available to restore session */
  canRefresh?: boolean;
}

/**
 * OAuth error codes
 */
export type OAuthErrorCode =
  | 'not_authenticated'
  | 'token_exchange_failed'
  | 'refresh_failed'
  | 'invalid_grant'
  | 'invalid_client'
  | 'invalid_request'
  | 'unauthorized_client'
  | 'unsupported_grant_type'
  | 'no_refresh_token'
  | 'session_expired';

/**
 * OAuth-specific error class
 */
export class OAuthError extends Error {
  constructor(
    public readonly code: OAuthErrorCode,
    message: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'OAuthError';
    Object.setPrototypeOf(this, OAuthError.prototype);
  }
}

/**
 * Token store interface for persisting OAuth tokens
 */
export interface TokenStore {
  /** Retrieve stored token data */
  get(): Promise<TokenData | null>;

  /** Save token data */
  save(token: TokenData): Promise<void>;

  /** Clear all stored tokens */
  clear(): Promise<void>;
}
