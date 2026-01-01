# FreshBooks OAuth2 Authentication

Complete OAuth2 authentication system for the FreshBooks MCP server.

## Overview

This module implements the OAuth2 Authorization Code flow for FreshBooks API authentication, including:

- **Authorization URL generation** - Start the OAuth flow
- **Code exchange** - Convert authorization code to tokens
- **Automatic token refresh** - Seamless token renewal
- **Secure token storage** - Encrypted file-based persistence
- **Multi-environment support** - File-based, environment-based, or in-memory storage

## Quick Start

### 1. Configuration

Set up your OAuth configuration with credentials from FreshBooks:

```typescript
import { FreshBooksOAuth, EncryptedFileTokenStore } from './auth';

const config = {
  clientId: process.env.FRESHBOOKS_CLIENT_ID!,
  clientSecret: process.env.FRESHBOOKS_CLIENT_SECRET!,
  redirectUri: 'http://localhost:3000/callback',
  scopes: [], // FreshBooks uses default scopes
};

const tokenStore = new EncryptedFileTokenStore('./tokens.enc');
const oauth = new FreshBooksOAuth(config, tokenStore);
```

### 2. Authorization Flow

```typescript
// Step 1: Generate authorization URL
const authUrl = oauth.generateAuthorizationUrl();
console.log('Visit this URL to authorize:', authUrl);

// Step 2: User visits URL, authorizes, and is redirected with code
// Extract code from redirect URL: http://localhost:3000/callback?code=ABC123

// Step 3: Exchange authorization code for tokens
const tokens = await oauth.exchangeCode('ABC123');
console.log('Authentication successful!');
```

### 3. Using Tokens

```typescript
// Get valid token (auto-refreshes if needed)
const accessToken = await oauth.getValidToken();

// Use token for API requests
const response = await fetch('https://api.freshbooks.com/...', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});
```

### 4. Check Status

```typescript
const status = await oauth.getStatus();

if (status.authenticated) {
  console.log(`Token valid for ${status.expiresIn} seconds`);
  console.log(`Active account: ${status.accountId}`);
} else {
  console.log(`Not authenticated: ${status.reason}`);
  if (status.canRefresh) {
    console.log('Can refresh token');
  }
}
```

## Token Storage Options

### EncryptedFileTokenStore (Production)

Stores tokens in an encrypted file using AES-256-GCM:

```typescript
import { EncryptedFileTokenStore } from './auth';

const store = new EncryptedFileTokenStore('./tokens.enc');
```

**Security features:**
- AES-256-GCM encryption
- Machine-specific key derivation
- Optional password from `FRESHBOOKS_TOKEN_PASSWORD` env var
- File permissions set to 0600 (owner only)

**Key derivation:**
- Username + Platform + Hostname + Salt
- Makes tokens non-portable across machines
- Optional password adds additional layer

### EnvTokenStore (CI/Testing)

Reads tokens from environment variables:

```typescript
import { EnvTokenStore } from './auth';

// Set environment variables:
// FRESHBOOKS_ACCESS_TOKEN=...
// FRESHBOOKS_REFRESH_TOKEN=...
// FRESHBOOKS_TOKEN_EXPIRES=... (unix timestamp)
// FRESHBOOKS_ACCOUNT_ID=...
// FRESHBOOKS_BUSINESS_ID=...

const store = new EnvTokenStore();
```

**Note:** This store is read-only. Token updates cannot be persisted.

### InMemoryTokenStore (Testing)

Stores tokens in memory only (lost on process exit):

```typescript
import { InMemoryTokenStore } from './auth';

const store = new InMemoryTokenStore();
```

## API Reference

### FreshBooksOAuth

Main OAuth client for authentication operations.

#### Constructor

```typescript
new FreshBooksOAuth(config: OAuthConfig, tokenStore: TokenStore)
```

#### Methods

##### `generateAuthorizationUrl(state?: string): string`

Generate OAuth authorization URL for user to visit.

**Parameters:**
- `state` (optional) - CSRF protection token

**Returns:** Authorization URL

**Example:**
```typescript
const url = oauth.generateAuthorizationUrl('random-state-token');
// https://my.freshbooks.com/service/auth/oauth/authorize?...
```

##### `exchangeCode(code: string): Promise<TokenData>`

Exchange authorization code for access tokens.

**Parameters:**
- `code` - Authorization code from OAuth redirect

**Returns:** Token data including access and refresh tokens

**Throws:** `OAuthError` if exchange fails

**Example:**
```typescript
try {
  const tokens = await oauth.exchangeCode('ABC123');
  console.log('Authenticated successfully');
} catch (error) {
  if (error instanceof OAuthError) {
    console.error(`Auth failed: ${error.code} - ${error.message}`);
  }
}
```

##### `refreshAccessToken(): Promise<TokenData>`

Refresh expired access token using refresh token.

**Returns:** New token data with refreshed access token

**Throws:** `OAuthError` if no refresh token or refresh fails

**Example:**
```typescript
const newTokens = await oauth.refreshAccessToken();
```

##### `getValidToken(): Promise<string>`

Get valid access token, automatically refreshing if needed.

**Returns:** Valid access token string

**Throws:** `OAuthError` if not authenticated

**Auto-refresh behavior:**
- Refreshes if token expires in < 5 minutes
- Seamlessly handles token renewal
- Throws if refresh fails (requires re-authentication)

**Example:**
```typescript
const token = await oauth.getValidToken();
// Use token immediately - guaranteed valid
```

##### `revokeToken(): Promise<void>`

Revoke current authentication and clear stored tokens.

**Example:**
```typescript
await oauth.revokeToken();
console.log('Logged out');
```

##### `getStatus(): Promise<AuthStatus>`

Get current authentication status.

**Returns:** Authentication status object

**Example:**
```typescript
const status = await oauth.getStatus();
if (status.authenticated) {
  console.log(`Valid for ${status.expiresIn}s`);
} else {
  console.log(`Not authenticated: ${status.reason}`);
}
```

##### `setActiveAccount(accountId: string, businessId?: number): Promise<void>`

Set active account and business for API requests.

**Parameters:**
- `accountId` - FreshBooks account ID
- `businessId` (optional) - FreshBooks business ID

**Example:**
```typescript
await oauth.setActiveAccount('ABC123', 456);
```

## Types

### OAuthConfig

```typescript
interface OAuthConfig {
  clientId: string;         // OAuth client ID
  clientSecret: string;     // OAuth client secret
  redirectUri: string;      // Redirect URI (must match registration)
  scopes?: string[];        // Optional scopes
}
```

### TokenData

```typescript
interface TokenData {
  accessToken: string;      // Access token for API requests
  refreshToken: string;     // Refresh token for renewal
  expiresAt: number;        // Unix timestamp of expiration
  tokenType: string;        // Token type (usually "Bearer")
  accountId?: string;       // Active account ID
  businessId?: number;      // Active business ID
}
```

### AuthStatus

```typescript
interface AuthStatus {
  authenticated: boolean;           // Whether authenticated
  expiresIn?: number;              // Seconds until expiration
  accountId?: string;              // Active account ID
  businessId?: number;             // Active business ID
  reason?: string;                 // Reason if not authenticated
  canRefresh?: boolean;            // Whether refresh is possible
}
```

### OAuthError

```typescript
class OAuthError extends Error {
  code: OAuthErrorCode;     // Error code
  message: string;          // Error message
  details?: any;            // Additional error details
}
```

**Error codes:**
- `not_authenticated` - No authentication found
- `token_exchange_failed` - Failed to exchange code
- `refresh_failed` - Failed to refresh token
- `invalid_grant` - Invalid authorization code/refresh token
- `invalid_client` - Invalid client credentials
- `no_refresh_token` - No refresh token available
- `session_expired` - Session has expired

## Security Best Practices

### 1. Protect Client Credentials

**Never commit credentials to version control:**

```bash
# .env
FRESHBOOKS_CLIENT_ID=your-client-id
FRESHBOOKS_CLIENT_SECRET=your-client-secret
```

```typescript
// Load from environment
const config = {
  clientId: process.env.FRESHBOOKS_CLIENT_ID!,
  clientSecret: process.env.FRESHBOOKS_CLIENT_SECRET!,
  redirectUri: process.env.FRESHBOOKS_REDIRECT_URI!,
};
```

### 2. Secure Token Storage

**Use encrypted file storage in production:**

```typescript
const store = new EncryptedFileTokenStore('./tokens.enc');
```

**Add additional password protection:**

```bash
# Set encryption password
export FRESHBOOKS_TOKEN_PASSWORD='your-secure-password'
```

### 3. Never Log Tokens

**NEVER log tokens to console, files, or error tracking:**

```typescript
// BAD - Don't do this!
console.log('Token:', token);
logger.info({ accessToken: token });

// GOOD - Log status only
console.log('Authentication successful');
logger.info({ authenticated: true, expiresIn: 3600 });
```

### 4. CSRF Protection

**Use state parameter for OAuth flow:**

```typescript
import { randomBytes } from 'crypto';

const state = randomBytes(32).toString('hex');
const url = oauth.generateAuthorizationUrl(state);

// Store state in session/cookie
// Verify state matches when handling redirect
```

### 5. Secure Redirect URI

**Use HTTPS in production:**

```typescript
const config = {
  redirectUri: process.env.NODE_ENV === 'production'
    ? 'https://your-domain.com/callback'
    : 'http://localhost:3000/callback',
};
```

## Error Handling

### Handle OAuth Errors

```typescript
import { OAuthError } from './auth';

try {
  await oauth.exchangeCode(code);
} catch (error) {
  if (error instanceof OAuthError) {
    switch (error.code) {
      case 'invalid_grant':
        console.error('Authorization code expired or invalid');
        // Redirect user to start new auth flow
        break;
      case 'invalid_client':
        console.error('Invalid client credentials');
        // Check client ID and secret
        break;
      case 'session_expired':
        console.error('Session expired, please re-authenticate');
        // Start new auth flow
        break;
      default:
        console.error(`Auth error: ${error.message}`);
    }
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Handle Token Refresh Failures

```typescript
try {
  const token = await oauth.getValidToken();
  // Use token
} catch (error) {
  if (error instanceof OAuthError && error.code === 'not_authenticated') {
    // Start new authentication flow
    const url = oauth.generateAuthorizationUrl();
    console.log('Please re-authenticate:', url);
  }
}
```

## Testing

### Unit Tests with InMemoryTokenStore

```typescript
import { FreshBooksOAuth, InMemoryTokenStore } from './auth';

describe('OAuth', () => {
  it('should store tokens', async () => {
    const store = new InMemoryTokenStore();
    const oauth = new FreshBooksOAuth(config, store);

    // Mock token data
    await store.save({
      accessToken: 'test-token',
      refreshToken: 'refresh-token',
      expiresAt: Date.now() / 1000 + 3600,
      tokenType: 'Bearer',
    });

    const token = await oauth.getValidToken();
    expect(token).toBe('test-token');
  });
});
```

### Integration Tests with EnvTokenStore

```bash
# Set test tokens
export FRESHBOOKS_ACCESS_TOKEN='test-access-token'
export FRESHBOOKS_REFRESH_TOKEN='test-refresh-token'
export FRESHBOOKS_TOKEN_EXPIRES='9999999999'
```

```typescript
import { FreshBooksOAuth, EnvTokenStore } from './auth';

const oauth = new FreshBooksOAuth(config, new EnvTokenStore());
const token = await oauth.getValidToken();
// Use token for integration tests
```

## Migration from Other Auth Systems

### From Manual Token Management

**Before:**
```typescript
let accessToken = 'stored-somewhere';
let refreshToken = 'stored-somewhere';

// Manual refresh logic
if (isExpired(accessToken)) {
  const newToken = await refreshToken();
  accessToken = newToken;
}
```

**After:**
```typescript
import { FreshBooksOAuth, EncryptedFileTokenStore } from './auth';

const oauth = new FreshBooksOAuth(config, new EncryptedFileTokenStore('./tokens.enc'));

// Automatic refresh
const token = await oauth.getValidToken();
```

## Troubleshooting

### "No authentication found" Error

**Cause:** No tokens stored or tokens cleared.

**Solution:**
1. Check if token file exists
2. Verify file permissions
3. Re-run authorization flow

### "Failed to refresh access token" Error

**Cause:** Refresh token expired or invalid.

**Solution:**
1. Clear stored tokens: `await oauth.revokeToken()`
2. Start new authorization flow
3. Exchange new authorization code

### Token File Cannot Be Decrypted

**Cause:** Machine ID changed or encryption password changed.

**Solution:**
1. Delete encrypted token file
2. Re-authenticate to generate new tokens

### Environment Tokens Not Working

**Cause:** Environment variables not set or incorrect.

**Solution:**
1. Verify environment variables are set:
   ```bash
   echo $FRESHBOOKS_ACCESS_TOKEN
   ```
2. Check variable names match exactly
3. Ensure tokens are still valid

## Resources

- [FreshBooks OAuth2 Documentation](https://www.freshbooks.com/api/authentication)
- [OAuth2 RFC 6749](https://tools.ietf.org/html/rfc6749)
- [FreshBooks API Reference](https://www.freshbooks.com/api)
