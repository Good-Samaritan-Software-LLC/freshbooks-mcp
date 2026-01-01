/**
 * FreshBooks OAuth2 Authentication
 *
 * Complete OAuth2 authentication system for FreshBooks API.
 *
 * @example Basic Usage
 * ```typescript
 * import { FreshBooksOAuth, EncryptedFileTokenStore } from './auth';
 *
 * const tokenStore = new EncryptedFileTokenStore('./tokens.enc');
 * const oauth = new FreshBooksOAuth({
 *   clientId: 'your-client-id',
 *   clientSecret: 'your-client-secret',
 *   redirectUri: 'http://localhost:3000/callback',
 * }, tokenStore);
 *
 * // 1. Generate authorization URL
 * const url = oauth.generateAuthorizationUrl();
 * console.log('Visit:', url);
 *
 * // 2. After user authorizes, exchange code
 * await oauth.exchangeCode(authCode);
 *
 * // 3. Use valid token for API requests
 * const token = await oauth.getValidToken();
 * ```
 *
 * @example Environment-based Auth (CI/Testing)
 * ```typescript
 * import { FreshBooksOAuth, EnvTokenStore } from './auth';
 *
 * // Set environment variables:
 * // FRESHBOOKS_ACCESS_TOKEN=...
 * // FRESHBOOKS_REFRESH_TOKEN=...
 *
 * const tokenStore = new EnvTokenStore();
 * const oauth = new FreshBooksOAuth(config, tokenStore);
 *
 * const token = await oauth.getValidToken();
 * ```
 */

export { FreshBooksOAuth } from './oauth.js';
export {
  EncryptedFileTokenStore,
  EnvTokenStore,
  InMemoryTokenStore,
} from './token-store.js';
export type {
  OAuthConfig,
  TokenData,
  AuthStatus,
  TokenStore,
  OAuthErrorCode,
} from './types.js';
export { OAuthError } from './types.js';
export {
  loadOAuthConfig,
  createTokenStore,
  validateOAuthConfig,
  initializeOAuthConfig,
} from './config.js';
