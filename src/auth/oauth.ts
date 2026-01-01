/**
 * FreshBooks OAuth2 Implementation
 *
 * Handles the complete OAuth2 Authorization Code flow for FreshBooks API:
 * - Authorization URL generation
 * - Authorization code exchange
 * - Token refresh
 * - Token management
 * - Session status
 */

import { OAuthConfig, TokenData, AuthStatus, OAuthError, TokenStore } from './types.js';

/**
 * OAuth2 token response from FreshBooks
 */
interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

/**
 * OAuth2 error response from FreshBooks
 */
interface OAuthErrorResponse {
  error: string;
  error_description?: string;
}

/**
 * FreshBooks OAuth2 client
 *
 * Manages the complete OAuth2 flow for FreshBooks API authentication.
 * Handles authorization, token exchange, refresh, and revocation.
 */
export class FreshBooksOAuth {
  private config: OAuthConfig;
  private tokenStore: TokenStore;

  // FreshBooks OAuth2 endpoints
  private static readonly AUTH_URL = 'https://my.freshbooks.com/service/auth/oauth/authorize';
  private static readonly TOKEN_URL = 'https://api.freshbooks.com/auth/oauth/token';
  private static readonly REVOKE_URL = 'https://api.freshbooks.com/auth/oauth/revoke';

  // Token expiration buffer (refresh if expires in less than 5 minutes)
  private static readonly EXPIRY_BUFFER_SECONDS = 300;

  constructor(config: OAuthConfig, tokenStore: TokenStore) {
    this.config = config;
    this.tokenStore = tokenStore;
  }

  /**
   * Generate OAuth2 authorization URL
   *
   * User must visit this URL to authorize the application.
   * After authorization, FreshBooks redirects to the redirect_uri with an authorization code.
   *
   * @param state Optional state parameter for CSRF protection
   * @returns Authorization URL for user to visit
   */
  generateAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
    });

    // Add scopes if configured
    if (this.config.scopes?.length) {
      params.set('scope', this.config.scopes.join(' '));
    }

    // Add state parameter for CSRF protection
    if (state) {
      params.set('state', state);
    }

    return `${FreshBooksOAuth.AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access tokens
   *
   * After user authorizes the application, exchange the authorization code
   * for access and refresh tokens.
   *
   * @param code Authorization code from OAuth redirect
   * @returns Token data including access and refresh tokens
   * @throws OAuthError if exchange fails
   */
  async exchangeCode(code: string): Promise<TokenData> {
    try {
      const response = await fetch(FreshBooksOAuth.TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Version': 'alpha',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          redirect_uri: this.config.redirectUri,
        }),
      });

      if (!response.ok) {
        const error = await response.json() as OAuthErrorResponse;
        throw new OAuthError(
          this.mapErrorCode(error.error),
          error.error_description || 'Failed to exchange authorization code',
          error
        );
      }

      const data = await response.json() as TokenResponse;
      const tokenData = this.parseTokenResponse(data);

      // Save tokens to store
      await this.tokenStore.save(tokenData);

      return tokenData;
    } catch (error) {
      if (error instanceof OAuthError) {
        throw error;
      }
      throw new OAuthError(
        'token_exchange_failed',
        'Failed to exchange authorization code',
        error
      );
    }
  }

  /**
   * Refresh expired access token using refresh token
   *
   * @returns New token data with refreshed access token
   * @throws OAuthError if refresh fails or no refresh token available
   */
  async refreshAccessToken(): Promise<TokenData> {
    const current = await this.tokenStore.get();

    if (!current?.refreshToken) {
      throw new OAuthError(
        'no_refresh_token',
        'No refresh token available. Please re-authenticate.'
      );
    }

    try {
      const response = await fetch(FreshBooksOAuth.TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Version': 'alpha',
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: current.refreshToken,
        }),
      });

      if (!response.ok) {
        const error = await response.json() as OAuthErrorResponse;

        // If refresh token is invalid, clear all tokens
        await this.tokenStore.clear();

        throw new OAuthError(
          this.mapErrorCode(error.error),
          error.error_description || 'Failed to refresh access token',
          error
        );
      }

      const data = await response.json() as TokenResponse;
      const tokenData = this.parseTokenResponse(data);

      // Preserve account/business selection if set
      if (current.accountId) {
        tokenData.accountId = current.accountId;
      }
      if (current.businessId) {
        tokenData.businessId = current.businessId;
      }

      // Save new tokens
      await this.tokenStore.save(tokenData);

      return tokenData;
    } catch (error) {
      if (error instanceof OAuthError) {
        throw error;
      }
      throw new OAuthError(
        'refresh_failed',
        'Failed to refresh access token',
        error
      );
    }
  }

  /**
   * Get valid access token, automatically refreshing if needed
   *
   * This is the primary method for obtaining tokens for API requests.
   * Automatically handles token refresh if token is expired or about to expire.
   *
   * @returns Valid access token
   * @throws OAuthError if not authenticated or refresh fails
   */
  async getValidToken(): Promise<string> {
    const token = await this.tokenStore.get();

    if (!token) {
      throw new OAuthError(
        'not_authenticated',
        'No authentication found. Please authenticate first.'
      );
    }

    // Check if token is expired or about to expire
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = token.expiresAt - now;

    // Refresh if token expires within buffer period
    if (expiresIn < FreshBooksOAuth.EXPIRY_BUFFER_SECONDS) {
      const newToken = await this.refreshAccessToken();
      return newToken.accessToken;
    }

    return token.accessToken;
  }

  /**
   * Revoke current authentication tokens
   *
   * Revokes the access token with FreshBooks and clears local storage.
   * Best effort - continues to clear local storage even if revocation fails.
   */
  async revokeToken(): Promise<void> {
    const token = await this.tokenStore.get();

    if (token?.accessToken) {
      try {
        // Attempt to revoke token with FreshBooks
        await fetch(FreshBooksOAuth.REVOKE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token.accessToken}`,
          },
          body: JSON.stringify({
            token: token.accessToken,
          }),
        });
      } catch {
        // Best effort - continue to clear local storage even if revocation fails
      }
    }

    // Clear local token storage
    await this.tokenStore.clear();
  }

  /**
   * Get current authentication status
   *
   * @returns Authentication status including validity and expiration
   */
  async getStatus(): Promise<AuthStatus> {
    const token = await this.tokenStore.get();

    if (!token) {
      return {
        authenticated: false,
        reason: 'no_token',
      };
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresIn = token.expiresAt - now;

    if (expiresIn <= 0) {
      return {
        authenticated: false,
        reason: 'token_expired',
        canRefresh: !!token.refreshToken,
      };
    }

    const status: AuthStatus = {
      authenticated: true,
      expiresIn,
    };

    if (token.accountId) {
      status.accountId = token.accountId;
    }

    if (token.businessId !== undefined) {
      status.businessId = token.businessId;
    }

    return status;
  }

  /**
   * Update account and business selection in token data
   *
   * @param accountId FreshBooks account ID
   * @param businessId FreshBooks business ID
   */
  async setActiveAccount(accountId: string, businessId?: number): Promise<void> {
    const token = await this.tokenStore.get();

    if (!token) {
      throw new OAuthError(
        'not_authenticated',
        'No authentication found. Please authenticate first.'
      );
    }

    token.accountId = accountId;
    if (businessId !== undefined) {
      token.businessId = businessId;
    }

    await this.tokenStore.save(token);
  }

  /**
   * Parse OAuth token response into TokenData
   */
  private parseTokenResponse(data: TokenResponse): TokenData {
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
      tokenType: data.token_type || 'Bearer',
    };
  }

  /**
   * Map OAuth error codes to internal error codes
   */
  private mapErrorCode(errorCode: string): any {
    const errorMap: Record<string, any> = {
      'invalid_grant': 'invalid_grant',
      'invalid_client': 'invalid_client',
      'invalid_request': 'invalid_request',
      'unauthorized_client': 'unauthorized_client',
      'unsupported_grant_type': 'unsupported_grant_type',
    };

    return errorMap[errorCode] || 'token_exchange_failed';
  }
}
