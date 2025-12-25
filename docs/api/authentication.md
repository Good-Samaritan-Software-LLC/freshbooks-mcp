# Authentication API Reference

Authentication tools manage OAuth2 authentication with FreshBooks. All other tools require valid authentication.

## OAuth2 Flow

The FreshBooks MCP server uses OAuth 2.0 authorization code flow:

```
1. auth_get_url     → Get authorization URL
2. User visits URL  → Authorizes in browser
3. User copies code → From redirect URL
4. auth_exchange_code → Exchange code for tokens
5. Tokens stored    → Automatic refresh
```

---

## auth_status

Check current authentication status.

### Description

Returns information about the current authentication state, including whether authenticated, token expiration, and available accounts.

**When to use:**
- Check if authenticated before making API calls
- Get accountId for other tool calls
- Verify token validity
- List available accounts

### Input Schema

No input parameters required.

### Input Example

```json
{}
```

### Output Schema

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| authenticated | boolean | No | Whether user is authenticated |
| expiresAt | string | Yes | Token expiration timestamp (ISO 8601) |
| expiresIn | number | Yes | Seconds until token expires |
| accountId | string | Yes | Currently selected account ID |
| accounts | Account[] | Yes | Available accounts |

#### Account Object

| Field | Type | Description |
|-------|------|-------------|
| accountId | string | Account identifier |
| businessId | number | Business identifier |
| name | string | Account/business name |

### Output Example

**Authenticated:**

```json
{
  "authenticated": true,
  "expiresAt": "2024-12-21T18:30:00Z",
  "expiresIn": 3542,
  "accountId": "ABC123",
  "accounts": [
    {
      "accountId": "ABC123",
      "businessId": 123456,
      "name": "My Consulting Business"
    },
    {
      "accountId": "DEF456",
      "businessId": 789012,
      "name": "Freelance Work"
    }
  ]
}
```

**Not Authenticated:**

```json
{
  "authenticated": false,
  "expiresAt": null,
  "expiresIn": null,
  "accountId": null,
  "accounts": null
}
```

### Errors

No errors - always returns status information.

### Related Tools

- [auth_get_url](#auth_get_url) - Start authentication if not authenticated
- [auth_refresh](#auth_refresh) - Refresh expired token
- [account_select](#account_select) - Change active account

---

## auth_get_url

Get OAuth2 authorization URL.

### Description

Generates the FreshBooks OAuth authorization URL. User must visit this URL in a browser to authorize the application.

**When to use:**
- Starting authentication flow
- User needs to re-authenticate
- Initial setup

**Process:**
1. Call auth_get_url to get URL
2. User visits URL in browser
3. User authorizes application
4. FreshBooks redirects with code
5. User copies code from URL
6. Call auth_exchange_code with code

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| redirectUri | string | No | OAuth redirect URI (must match app config) |

### Input Example

```json
{
  "redirectUri": "http://localhost:3000/callback"
}
```

Or with default:

```json
{}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| authorizationUrl | string | URL to visit for authorization |
| instructions | string | User instructions |

### Output Example

```json
{
  "authorizationUrl": "https://my.freshbooks.com/service/auth/oauth/authorize?client_id=...&redirect_uri=...",
  "instructions": "Visit this URL in your browser, authorize the application, and copy the authorization code from the redirect URL."
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid redirectUri | No | Use valid URL matching app config |
| -32603 | Configuration error | No | Check OAuth client ID/secret configured |

### Usage Notes

**Authorization URL:**
User must visit the URL in a web browser. They will:
1. See FreshBooks login page (if not logged in)
2. See authorization prompt
3. Click "Authorize" to grant access
4. Be redirected to redirect URI

**Redirect URL:**
After authorization, FreshBooks redirects to:
```
http://localhost:3000/callback?code=AUTH_CODE_HERE
```

User must copy the `code` parameter value.

**Redirect URI:**
- Must match OAuth app configuration in FreshBooks
- Common values: `http://localhost:3000/callback`, `urn:ietf:wg:oauth:2.0:oob`
- Use `urn:ietf:wg:oauth:2.0:oob` for out-of-band (OOB) flow

### Related Tools

- [auth_exchange_code](#auth_exchange_code) - Next step: exchange code for tokens
- [auth_status](#auth_status) - Check if already authenticated

---

## auth_exchange_code

Exchange authorization code for access tokens.

### Description

Exchanges the authorization code (from auth_get_url flow) for access and refresh tokens. Tokens are securely stored and managed automatically.

**When to use:**
- After user authorizes via auth_get_url
- User has copied code from redirect URL
- Completing authentication flow

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| code | string | Yes | Authorization code from OAuth redirect |
| redirectUri | string | No | Must match the redirectUri used in auth_get_url |

### Input Example

```json
{
  "code": "a1b2c3d4e5f6g7h8i9j0",
  "redirectUri": "http://localhost:3000/callback"
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Whether exchange was successful |
| authenticated | boolean | Whether now authenticated |
| accountId | string | Default account ID |
| expiresIn | number | Seconds until token expires |

### Output Example

```json
{
  "success": true,
  "authenticated": true,
  "accountId": "ABC123",
  "expiresIn": 3600
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Missing code | No | Provide authorization code |
| -32602 | Invalid code format | No | Check code was copied correctly |
| -32001 | Invalid code | Yes | Code expired or invalid, restart flow |
| -32001 | Code already used | Yes | Code can only be used once, restart flow |
| -32603 | Configuration error | No | Check OAuth client ID/secret |

### Usage Notes

**Authorization Code:**
- One-time use only
- Expires after ~10 minutes
- Cannot be reused
- Must match the redirectUri used to generate it

**Redirect URI:**
- Must EXACTLY match the redirectUri from auth_get_url
- Including protocol, host, port, path
- Mismatch causes "redirect_uri_mismatch" error

**After Exchange:**
- Tokens stored securely
- Access token used for API calls
- Refresh token used to get new access token
- Auto-refresh happens automatically

### Related Tools

- [auth_get_url](#auth_get_url) - Previous step: get authorization URL
- [auth_status](#auth_status) - Verify authentication successful
- [auth_refresh](#auth_refresh) - Manually refresh tokens

---

## auth_refresh

Manually refresh the access token.

### Description

Refreshes the access token using the stored refresh token. This is typically handled automatically but can be called manually if needed.

**When to use:**
- Token expired and auto-refresh failed
- Force token refresh for security
- Testing token refresh flow

**Note:** Token refresh happens automatically. This tool is rarely needed in normal operation.

### Input Schema

No input parameters required.

### Input Example

```json
{}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Whether refresh was successful |
| expiresIn | number | Seconds until new token expires |

### Output Example

```json
{
  "success": true,
  "expiresIn": 3600
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32000 | Not authenticated | No | Call auth_get_url to authenticate |
| -32003 | Refresh token invalid/expired | No | Re-authenticate with auth_get_url |
| -32603 | Network error | Yes | Retry |

### Usage Notes

**Automatic Refresh:**
The server automatically refreshes tokens when:
- Access token expired
- API call returns 401 Unauthorized
- Before expiration (proactive refresh)

**Manual Refresh:**
Only needed if:
- Testing authentication flow
- Debugging token issues
- Forcing security token rotation

**Refresh Token Expiration:**
Refresh tokens typically expire after 30 days of inactivity. If expired, user must re-authenticate with full OAuth flow.

### Related Tools

- [auth_status](#auth_status) - Check token expiration
- [auth_get_url](#auth_get_url) - Re-authenticate if refresh fails

---

## Authentication Flow Examples

### First-Time Authentication

```
1. Check status:
   auth_status()
   → { authenticated: false }

2. Get authorization URL:
   auth_get_url()
   → { authorizationUrl: "https://my.freshbooks.com/..." }

3. User visits URL in browser
   → Logs in (if needed)
   → Clicks "Authorize"
   → Redirected to: http://localhost:3000/callback?code=ABC123

4. User copies code "ABC123"

5. Exchange code for tokens:
   auth_exchange_code({ code: "ABC123" })
   → { success: true, authenticated: true }

6. Verify:
   auth_status()
   → { authenticated: true, accountId: "ABC123" }
```

### Token Refresh (Automatic)

```
1. Make API call with expired token:
   timeentry_list({ accountId })
   → Server detects 401 Unauthorized
   → Automatically refreshes token
   → Retries request
   → Returns time entries

No user action needed!
```

### Token Refresh (Manual)

```
1. Check status:
   auth_status()
   → { authenticated: true, expiresIn: 30 }

2. Manually refresh:
   auth_refresh()
   → { success: true, expiresIn: 3600 }

3. Verify:
   auth_status()
   → { expiresIn: 3600 }
```

### Re-authentication

```
1. Refresh fails:
   auth_refresh()
   → Error: Refresh token expired

2. Start over:
   auth_get_url()
   → { authorizationUrl: "..." }

3. User authorizes again

4. Exchange new code:
   auth_exchange_code({ code: "XYZ789" })
   → { success: true }
```

---

## Notes

### Token Storage

Tokens are stored securely:
- Access token: Short-lived (1 hour)
- Refresh token: Long-lived (30 days)
- Encrypted at rest
- Never logged or exposed

### Token Expiration

**Access Token:**
- Expires after 1 hour
- Automatically refreshed when expired
- Used for all API calls

**Refresh Token:**
- Expires after 30 days of inactivity
- Used to get new access tokens
- Requires re-authentication if expired

### Security Best Practices

**Do:**
- Store tokens securely
- Use HTTPS for OAuth redirect
- Validate redirect URI matches
- Handle token expiration gracefully

**Don't:**
- Log tokens
- Share tokens
- Hardcode tokens
- Commit tokens to version control

### Multiple Accounts

Users can have multiple FreshBooks accounts:
- auth_status returns all accounts
- Use account_select to switch accounts
- Each account has different accountId
- Tools require accountId parameter

### OAuth App Configuration

Before using authentication:
1. Create OAuth app in FreshBooks
2. Configure redirect URI
3. Get client ID and client secret
4. Set environment variables:
   - `FRESHBOOKS_CLIENT_ID`
   - `FRESHBOOKS_CLIENT_SECRET`
   - `FRESHBOOKS_REDIRECT_URI`

### Redirect URI Patterns

**Local development:**
```
http://localhost:3000/callback
http://localhost:8080/callback
http://127.0.0.1:3000/callback
```

**Out-of-band (OOB):**
```
urn:ietf:wg:oauth:2.0:oob
```
FreshBooks displays code on screen instead of redirecting.

**Production:**
```
https://yourapp.com/auth/callback
```

### Error Recovery

**Code expired:**
```
auth_exchange_code({ code })
→ Error: Invalid authorization code

Recovery:
1. Call auth_get_url() again
2. User re-authorizes
3. Exchange new code
```

**Refresh failed:**
```
auth_refresh()
→ Error: Refresh token expired

Recovery:
1. Call auth_get_url()
2. Complete full OAuth flow
```

**Configuration error:**
```
auth_get_url()
→ Error: OAuth client not configured

Recovery:
1. Set FRESHBOOKS_CLIENT_ID
2. Set FRESHBOOKS_CLIENT_SECRET
3. Set FRESHBOOKS_REDIRECT_URI
4. Restart server
```
