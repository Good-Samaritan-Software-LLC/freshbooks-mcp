# FreshBooks MCP Server - Authentication Setup Guide

Complete guide to setting up OAuth2 authentication for the FreshBooks MCP server.

## Prerequisites

1. **FreshBooks Developer Account**
   - Sign up at [freshbooks.com](https://www.freshbooks.com)
   - Access Developer Portal

2. **OAuth Application Registration**
   - Register your application to get Client ID and Client Secret
   - Configure redirect URI

## Step 1: Register OAuth Application

### 1.1 Create Application

1. Log in to FreshBooks
2. Navigate to Developer Settings
3. Click "Create New Application"
4. Fill in application details:
   - **Name:** FreshBooks MCP Server
   - **Description:** MCP server for Claude integration
   - **Redirect URI:** `http://localhost:3000/callback` (for development)

### 1.2 Save Credentials

After registration, save these credentials:
- **Client ID** - Public identifier for your application
- **Client Secret** - Secret key (keep this private!)

## Step 2: Configure Environment Variables

Create a `.env` file in the project root:

```bash
# FreshBooks OAuth2 Credentials
FRESHBOOKS_CLIENT_ID=your-client-id-here
FRESHBOOKS_CLIENT_SECRET=your-client-secret-here
FRESHBOOKS_REDIRECT_URI=http://localhost:3000/callback

# Token Storage (optional)
FRESHBOOKS_TOKEN_PASSWORD=your-encryption-password

# Token File Location (optional, default: ./freshbooks-tokens.enc)
FRESHBOOKS_TOKEN_FILE=./freshbooks-tokens.enc
```

**Important:** Add `.env` to `.gitignore` to prevent committing secrets!

```bash
# .gitignore
.env
freshbooks-tokens.enc
```

## Step 3: Initialize Authentication

### 3.1 Start the Server

```bash
npm install
npm run build
npm start
```

### 3.2 Initiate OAuth Flow

When running the MCP server with Claude, authentication tools are available:

**Tool: `auth_status`**
```
Check authentication status
```

**Tool: `auth_get_url`**
```
Get OAuth authorization URL
```

Example interaction with Claude:

```
You: "Check if I'm authenticated with FreshBooks"
Claude: [Uses auth_status tool]
Response: Not authenticated

You: "Get the authorization URL"
Claude: [Uses auth_get_url tool]
Response: Visit this URL to authorize: https://my.freshbooks.com/service/auth/oauth/authorize?...
```

## Step 4: Complete Authorization

### 4.1 Visit Authorization URL

1. Copy the authorization URL from the previous step
2. Open it in your browser
3. Log in to FreshBooks if prompted
4. Click "Authorize" to grant access

### 4.2 Handle Redirect

After authorization, FreshBooks redirects to your redirect URI with an authorization code:

```
http://localhost:3000/callback?code=abc123def456...
```

Copy the **code** parameter value.

### 4.3 Exchange Code for Tokens

Use the `auth_exchange_code` tool:

```
You: "Exchange this authorization code: abc123def456..."
Claude: [Uses auth_exchange_code tool with the code]
Response: Authentication successful! Tokens stored.
```

## Step 5: Verify Authentication

Check that authentication is working:

```
You: "Check my FreshBooks authentication status"
Claude: [Uses auth_status tool]
Response:
- Authenticated: Yes
- Expires in: 3599 seconds
- Accounts: [List of accessible accounts]
```

## Step 6: Select Account (if multiple)

If you have access to multiple FreshBooks accounts:

```
You: "List my FreshBooks accounts"
Claude: [Uses account_list tool]
Response:
1. ABC Corp (Account ID: abc123)
2. XYZ Ltd (Account ID: xyz789)

You: "Use ABC Corp account"
Claude: [Uses account_select tool with account ID]
Response: Now using ABC Corp account
```

## Authentication Flow Diagram

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       │ 1. Request auth URL
       ▼
┌─────────────────────────┐
│  MCP Server             │
│  auth_get_url tool      │
└──────┬──────────────────┘
       │
       │ 2. Return authorization URL
       ▼
┌─────────────────────────┐
│  User's Browser         │
│  FreshBooks Login       │
└──────┬──────────────────┘
       │
       │ 3. User authorizes
       ▼
┌─────────────────────────┐
│  Redirect with code     │
└──────┬──────────────────┘
       │
       │ 4. User copies code
       ▼
┌─────────────────────────┐
│  MCP Server             │
│  auth_exchange_code     │
└──────┬──────────────────┘
       │
       │ 5. Exchange code for tokens
       ▼
┌─────────────────────────┐
│  FreshBooks API         │
│  Token Endpoint         │
└──────┬──────────────────┘
       │
       │ 6. Return access & refresh tokens
       ▼
┌─────────────────────────┐
│  Encrypted Token Store  │
│  ./tokens.enc           │
└─────────────────────────┘
```

## Token Management

### Automatic Token Refresh

The MCP server automatically refreshes expired tokens:

- Tokens expire after ~12 hours
- Refresh happens automatically when needed
- Refresh tokens are valid for extended period
- No user intervention required

### Manual Token Refresh

Force a token refresh:

```
You: "Refresh my FreshBooks token"
Claude: [Uses auth_refresh tool]
Response: Token refreshed successfully
```

### Revoke Authentication

Log out and clear tokens:

```
You: "Log out of FreshBooks"
Claude: [Uses auth_revoke tool]
Response: Logged out successfully. Tokens cleared.
```

## Production Setup

### HTTPS Redirect URI

For production, use HTTPS redirect URI:

```bash
# .env.production
FRESHBOOKS_REDIRECT_URI=https://your-domain.com/oauth/callback
```

Update redirect URI in FreshBooks Developer Portal.

### Encryption Password

Set a strong encryption password:

```bash
# .env.production
FRESHBOOKS_TOKEN_PASSWORD=$(openssl rand -base64 32)
```

Store this password securely (e.g., in a secrets manager).

### Token File Permissions

Ensure token file is only readable by the application:

```bash
chmod 600 freshbooks-tokens.enc
```

The EncryptedFileTokenStore automatically sets these permissions.

## CI/CD Setup

For automated testing and CI/CD, use environment-based authentication:

```bash
# CI environment variables
FRESHBOOKS_ACCESS_TOKEN=your-access-token
FRESHBOOKS_REFRESH_TOKEN=your-refresh-token
FRESHBOOKS_TOKEN_EXPIRES=1234567890
FRESHBOOKS_ACCOUNT_ID=your-account-id
```

The server will use `EnvTokenStore` when these variables are set.

## Troubleshooting

### "Invalid client credentials" Error

**Cause:** Incorrect Client ID or Client Secret

**Solution:**
1. Verify credentials in `.env` file
2. Check for typos or extra whitespace
3. Regenerate credentials in FreshBooks Developer Portal

### "Redirect URI mismatch" Error

**Cause:** Redirect URI doesn't match registered URI

**Solution:**
1. Check exact URI in `.env` matches Developer Portal
2. Ensure protocol (http/https) matches
3. Ensure port number matches if using localhost

### "Authorization code expired" Error

**Cause:** Authorization code used too late or already used

**Solution:**
1. Start new authorization flow
2. Copy code quickly after redirect
3. Ensure code is used only once

### "Token file cannot be decrypted" Error

**Cause:** Machine ID changed or encryption password changed

**Solution:**
1. Delete token file: `rm freshbooks-tokens.enc`
2. Re-authenticate
3. If using custom password, verify `FRESHBOOKS_TOKEN_PASSWORD`

### "No refresh token available" Error

**Cause:** Refresh token expired or not stored

**Solution:**
1. Clear tokens: Use `auth_revoke` tool
2. Start new authorization flow
3. Complete code exchange

## Security Checklist

- [ ] Client credentials stored in `.env` (not in code)
- [ ] `.env` added to `.gitignore`
- [ ] Token file (`*.enc`) added to `.gitignore`
- [ ] HTTPS used for production redirect URI
- [ ] Strong encryption password set for production
- [ ] Token file permissions restricted to 600
- [ ] No tokens logged to console or files
- [ ] Regular token rotation (via automatic refresh)

## Testing Authentication

### Test Authentication Flow

```bash
# Run tests
npm test src/auth

# Run with coverage
npm run test:coverage
```

### Manual Testing

```bash
# Start server
npm start

# Use Claude to test:
# 1. "Check auth status" - Should show not authenticated
# 2. "Get auth URL" - Should return authorization URL
# 3. Visit URL, authorize, copy code
# 4. "Exchange code: <code>" - Should authenticate
# 5. "Check auth status" - Should show authenticated
```

## Next Steps

After successful authentication:

1. **Explore Available Tools**
   ```
   You: "What can I do with FreshBooks?"
   Claude: [Lists available tools]
   ```

2. **Start Time Tracking**
   ```
   You: "Start a timer for Project X"
   Claude: [Uses timer_start tool]
   ```

3. **View Time Entries**
   ```
   You: "Show my recent time entries"
   Claude: [Uses timeentry_list tool]
   ```

## Support

- FreshBooks API Documentation: https://www.freshbooks.com/api
- FreshBooks Developer Support: https://www.freshbooks.com/support
- OAuth2 Specification: https://oauth.net/2/
