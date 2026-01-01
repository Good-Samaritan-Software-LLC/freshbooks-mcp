/**
 * FreshBooks OAuth Configuration Helper
 *
 * Loads OAuth configuration from environment variables with validation.
 */

import { OAuthConfig, TokenStore } from './types.js';
import { EncryptedFileTokenStore, EnvTokenStore } from './token-store.js';

/**
 * Load OAuth configuration from environment variables
 *
 * Required environment variables:
 * - FRESHBOOKS_CLIENT_ID
 * - FRESHBOOKS_CLIENT_SECRET
 * - FRESHBOOKS_REDIRECT_URI
 *
 * Optional:
 * - FRESHBOOKS_SCOPES (comma-separated)
 *
 * @throws Error if required environment variables are missing
 */
export function loadOAuthConfig(): OAuthConfig {
  const clientId = process.env.FRESHBOOKS_CLIENT_ID;
  const clientSecret = process.env.FRESHBOOKS_CLIENT_SECRET;
  const redirectUri = process.env.FRESHBOOKS_REDIRECT_URI;

  if (!clientId) {
    throw new Error(
      'FRESHBOOKS_CLIENT_ID environment variable is required. ' +
      'Get your client ID from FreshBooks Developer Portal.'
    );
  }

  if (!clientSecret) {
    throw new Error(
      'FRESHBOOKS_CLIENT_SECRET environment variable is required. ' +
      'Get your client secret from FreshBooks Developer Portal.'
    );
  }

  if (!redirectUri) {
    throw new Error(
      'FRESHBOOKS_REDIRECT_URI environment variable is required. ' +
      'Set to your OAuth redirect URI (e.g., http://localhost:3000/callback)'
    );
  }

  const scopesEnv = process.env.FRESHBOOKS_SCOPES;
  const scopes = scopesEnv ? scopesEnv.split(',').map(s => s.trim()) : undefined;

  const config: OAuthConfig = {
    clientId,
    clientSecret,
    redirectUri,
  };

  // Only add scopes if defined
  if (scopes) {
    config.scopes = scopes;
  }

  return config;
}

/**
 * Create appropriate token store based on environment
 *
 * Strategy:
 * 1. If FRESHBOOKS_ACCESS_TOKEN is set, use EnvTokenStore (CI/testing)
 * 2. Otherwise, use EncryptedFileTokenStore (production/development)
 *
 * Token file location:
 * - Uses FRESHBOOKS_TOKEN_FILE env var if set
 * - Otherwise defaults to './freshbooks-tokens.enc'
 *
 * Encryption password:
 * - Uses FRESHBOOKS_TOKEN_PASSWORD env var if set
 * - Otherwise uses machine-specific default
 */
export function createTokenStore(): TokenStore {
  // If access token is in environment, use EnvTokenStore
  if (process.env.FRESHBOOKS_ACCESS_TOKEN) {
    return new EnvTokenStore();
  }

  // Use encrypted file store
  const tokenFile = process.env.FRESHBOOKS_TOKEN_FILE || './freshbooks-tokens.enc';
  return new EncryptedFileTokenStore(tokenFile);
}

/**
 * Validate OAuth configuration
 *
 * Checks that configuration values are properly formatted.
 *
 * @param config OAuth configuration to validate
 * @throws Error if configuration is invalid
 */
export function validateOAuthConfig(config: OAuthConfig): void {
  // Validate client ID format (basic check)
  if (config.clientId.length < 10) {
    throw new Error('Client ID appears to be invalid (too short)');
  }

  // Validate client secret format (basic check)
  if (config.clientSecret.length < 10) {
    throw new Error('Client secret appears to be invalid (too short)');
  }

  // Validate redirect URI format
  try {
    const url = new URL(config.redirectUri);

    // Warn about insecure redirect URIs in production
    if (process.env.NODE_ENV === 'production' && url.protocol === 'http:') {
      console.warn(
        'Warning: Using insecure HTTP redirect URI in production. ' +
        'Consider using HTTPS for enhanced security.'
      );
    }
  } catch {
    throw new Error('Redirect URI must be a valid URL');
  }
}

/**
 * Initialize OAuth configuration with validation
 *
 * Convenience function that:
 * 1. Loads configuration from environment
 * 2. Validates configuration
 * 3. Returns validated config
 *
 * @returns Validated OAuth configuration
 */
export function initializeOAuthConfig(): OAuthConfig {
  const config = loadOAuthConfig();
  validateOAuthConfig(config);
  return config;
}
