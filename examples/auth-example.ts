/**
 * FreshBooks OAuth2 Authentication Example
 *
 * Demonstrates the complete OAuth2 flow for FreshBooks authentication.
 */

import { FreshBooksOAuth } from '../src/auth/oauth.js';
import { EncryptedFileTokenStore } from '../src/auth/token-store.js';
import { OAuthConfig } from '../src/auth/types.js';
import * as readline from 'readline';

/**
 * Example: Complete OAuth2 authentication flow
 */
async function authenticateExample() {
  console.log('FreshBooks OAuth2 Authentication Example\n');

  // Step 1: Configure OAuth
  const config: OAuthConfig = {
    clientId: process.env.FRESHBOOKS_CLIENT_ID || '',
    clientSecret: process.env.FRESHBOOKS_CLIENT_SECRET || '',
    redirectUri: process.env.FRESHBOOKS_REDIRECT_URI || 'http://localhost:3000/callback',
  };

  if (!config.clientId || !config.clientSecret) {
    console.error('Error: FRESHBOOKS_CLIENT_ID and FRESHBOOKS_CLIENT_SECRET must be set');
    console.error('Set these in your .env file or environment variables');
    process.exit(1);
  }

  // Step 2: Create OAuth client with encrypted token storage
  const tokenStore = new EncryptedFileTokenStore('./freshbooks-tokens.enc');
  const oauth = new FreshBooksOAuth(config, tokenStore);

  // Step 3: Check if already authenticated
  const status = await oauth.getStatus();

  if (status.authenticated) {
    console.log('Already authenticated!');
    console.log(`Token expires in: ${status.expiresIn} seconds`);
    console.log(`Account ID: ${status.accountId || 'Not set'}`);
    console.log('\nYou can start using the API now.');
    return;
  }

  console.log('Not authenticated. Starting OAuth flow...\n');

  // Step 4: Generate authorization URL
  const state = Math.random().toString(36).substring(7); // Random state for CSRF protection
  const authUrl = oauth.generateAuthorizationUrl(state);

  console.log('Step 1: Visit this URL to authorize the application:');
  console.log(authUrl);
  console.log();

  // Step 5: Wait for user to complete authorization and get code
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const authCode = await new Promise<string>((resolve) => {
    rl.question('Step 2: After authorizing, paste the authorization code here: ', (code) => {
      rl.close();
      resolve(code.trim());
    });
  });

  if (!authCode) {
    console.error('Error: No authorization code provided');
    process.exit(1);
  }

  // Step 6: Exchange authorization code for tokens
  try {
    console.log('\nExchanging authorization code for tokens...');
    const tokens = await oauth.exchangeCode(authCode);

    console.log('\nAuthentication successful!');
    console.log(`Access token expires in: ${tokens.expiresAt - Math.floor(Date.now() / 1000)} seconds`);
    console.log('Tokens have been securely stored.');
    console.log('\nYou can now use the API.');

    // Step 7: Verify authentication
    const newStatus = await oauth.getStatus();
    console.log('\nAuthentication status:');
    console.log(`- Authenticated: ${newStatus.authenticated}`);
    console.log(`- Expires in: ${newStatus.expiresIn} seconds`);
  } catch (error: any) {
    console.error('\nAuthentication failed:');
    console.error(`Error: ${error.message}`);
    if (error.code) {
      console.error(`Code: ${error.code}`);
    }
    process.exit(1);
  }
}

/**
 * Example: Using stored tokens
 */
async function useStoredTokensExample() {
  console.log('Using Stored Tokens Example\n');

  const config: OAuthConfig = {
    clientId: process.env.FRESHBOOKS_CLIENT_ID || '',
    clientSecret: process.env.FRESHBOOKS_CLIENT_SECRET || '',
    redirectUri: process.env.FRESHBOOKS_REDIRECT_URI || 'http://localhost:3000/callback',
  };

  const tokenStore = new EncryptedFileTokenStore('./freshbooks-tokens.enc');
  const oauth = new FreshBooksOAuth(config, tokenStore);

  try {
    // Get valid token (automatically refreshes if needed)
    const accessToken = await oauth.getValidToken();

    console.log('Got valid access token');
    console.log('Token length:', accessToken.length);
    console.log('Token preview:', accessToken.substring(0, 20) + '...');

    // Use token for API request
    console.log('\nMaking API request...');
    const response = await fetch('https://api.freshbooks.com/auth/api/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Api-Version': 'alpha',
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('API request successful!');
      console.log('User info:', JSON.stringify(data, null, 2));
    } else {
      console.error('API request failed:', response.status, response.statusText);
    }
  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.code === 'not_authenticated') {
      console.log('\nNot authenticated. Run the authentication example first.');
    }
  }
}

/**
 * Example: Checking authentication status
 */
async function checkStatusExample() {
  console.log('Authentication Status Check Example\n');

  const config: OAuthConfig = {
    clientId: process.env.FRESHBOOKS_CLIENT_ID || '',
    clientSecret: process.env.FRESHBOOKS_CLIENT_SECRET || '',
    redirectUri: process.env.FRESHBOOKS_REDIRECT_URI || 'http://localhost:3000/callback',
  };

  const tokenStore = new EncryptedFileTokenStore('./freshbooks-tokens.enc');
  const oauth = new FreshBooksOAuth(config, tokenStore);

  const status = await oauth.getStatus();

  console.log('Authentication Status:');
  console.log('- Authenticated:', status.authenticated);

  if (status.authenticated) {
    console.log('- Expires in:', status.expiresIn, 'seconds');
    console.log('- Account ID:', status.accountId || 'Not set');
    console.log('- Business ID:', status.businessId || 'Not set');
  } else {
    console.log('- Reason:', status.reason);
    console.log('- Can refresh:', status.canRefresh || false);
  }
}

/**
 * Example: Revoking authentication
 */
async function revokeExample() {
  console.log('Revoke Authentication Example\n');

  const config: OAuthConfig = {
    clientId: process.env.FRESHBOOKS_CLIENT_ID || '',
    clientSecret: process.env.FRESHBOOKS_CLIENT_SECRET || '',
    redirectUri: process.env.FRESHBOOKS_REDIRECT_URI || 'http://localhost:3000/callback',
  };

  const tokenStore = new EncryptedFileTokenStore('./freshbooks-tokens.enc');
  const oauth = new FreshBooksOAuth(config, tokenStore);

  console.log('Revoking authentication...');
  await oauth.revokeToken();
  console.log('Authentication revoked. Tokens cleared.');

  const status = await oauth.getStatus();
  console.log('\nNew status:');
  console.log('- Authenticated:', status.authenticated);
}

// Main
const example = process.argv[2] || 'authenticate';

switch (example) {
  case 'authenticate':
    authenticateExample().catch(console.error);
    break;
  case 'use-tokens':
    useStoredTokensExample().catch(console.error);
    break;
  case 'status':
    checkStatusExample().catch(console.error);
    break;
  case 'revoke':
    revokeExample().catch(console.error);
    break;
  default:
    console.log('Usage: npm run example:auth [authenticate|use-tokens|status|revoke]');
    console.log('');
    console.log('Examples:');
    console.log('  npm run example:auth authenticate  - Complete OAuth flow');
    console.log('  npm run example:auth use-tokens    - Use stored tokens');
    console.log('  npm run example:auth status        - Check auth status');
    console.log('  npm run example:auth revoke        - Revoke authentication');
}
