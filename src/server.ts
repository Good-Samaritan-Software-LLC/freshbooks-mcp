#!/usr/bin/env node

/**
 * FreshBooks MCP Server
 *
 * Main entry point for the FreshBooks Model Context Protocol server.
 * Provides Claude with access to FreshBooks time tracking, invoicing,
 * expense management, and more through MCP tools.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { getConfig } from './config/index.js';
import { logger } from './utils/logger.js';
import { FreshBooksOAuth } from './auth/oauth.js';
import { EncryptedFileTokenStore } from './auth/token-store.js';
import { InMemoryStateStore, type StateStore } from './auth/state-store.js';
import { InMemoryConfirmationStore, type ConfirmationStore } from './auth/confirmation-store.js';
import { FreshBooksClientWrapper } from './client/index.js';
import { handleError, createAuthError } from './errors/index.js';
import { sanitizeForMcpResponse } from './utils/sanitizer.js';
import { getToolMetadata } from './tools/metadata.js';

/**
 * Main server class
 */
class FreshBooksServer {
  private server: Server;
  private oauth: FreshBooksOAuth;
  private client: FreshBooksClientWrapper;
  private stateStore: StateStore;
  private confirmationStore: ConfirmationStore;

  constructor() {
    // Initialize MCP server
    this.server = new Server(
      {
        name: 'freshbooks-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Load configuration
    const config = getConfig();

    // Initialize OAuth, state store, confirmation store, and client
    const tokenStore = new EncryptedFileTokenStore(config.server.tokenStorePath);
    this.stateStore = new InMemoryStateStore();
    this.confirmationStore = new InMemoryConfirmationStore();
    this.oauth = new FreshBooksOAuth(
      {
        clientId: config.freshbooks.clientId,
        clientSecret: config.freshbooks.clientSecret,
        redirectUri: config.freshbooks.redirectUri,
      },
      tokenStore
    );
    this.client = new FreshBooksClientWrapper(this.oauth);

    // Set up handlers
    this.setupHandlers();

    logger.info('FreshBooks MCP Server initialized', {
      serverName: 'freshbooks-mcp',
      version: '1.0.0',
    });
  }

  /**
   * Set up MCP protocol handlers
   */
  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.debug('Listing available tools');

      return {
        tools: [
          // Authentication tools
          {
            name: 'auth_status',
            description: `Check whether FreshBooks is connected and return the active session details.

WHEN TO USE:
- Call first in any workflow before using accounting or time-tracking tools
- User asks "am I connected to FreshBooks?", "what account is linked?"
- Diagnose why a tool returned an auth error

TAKES NO ARGUMENTS — safe to call anytime.

RETURNS (connected session):
{ connected: true, userId, accountId, businessId, email, expiresAt }
- accountId and businessId are the IDs to pass to accounting and time-tracking tools

RETURNS (no session or expired token):
{ connected: false }

NEXT STEPS:
- If connected: false → call auth_get_url to start OAuth
- If connected: true → use accountId/businessId with all other tools`,
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'auth_get_url',
            description: `Generate an OAuth 2.0 authorization URL and a CSRF state token for the FreshBooks sign-in flow.

WHEN TO USE:
- auth_status returns { connected: false }
- User says "connect my FreshBooks account" or "sign in to FreshBooks"
- Re-authenticating after a revoked or expired session

TAKES NO ARGUMENTS.

RETURNS:
{ url: "https://auth.freshbooks.com/oauth/authorize?...", state: "<csrf-token>" }

WORKFLOW:
1. Call auth_get_url → share the url with the user
2. User visits the URL, authorizes, and is redirected — the redirect URL contains code and state query params
3. User pastes the code and state back → call auth_exchange_code with both values`,
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'auth_exchange_code',
            description: `Exchange an OAuth authorization code for access and refresh tokens, completing the FreshBooks connection.

WHEN TO USE:
- Immediately after the user visits the auth_get_url link and is redirected with a code
- Only call once per code — codes expire quickly (typically 60 seconds)

REQUIRED:
- code (string): The authorization code from the FreshBooks redirect URL. Example: "eyJhbGci..."
- state (string): The state value returned by auth_get_url — must match to prevent CSRF. Example: "abc123xyz"

RETURNS:
{ success: true, userId, accountId, businessId, email, expiresAt }
Tokens are stored locally; all subsequent tool calls use them automatically.

ERRORS:
- Expired or invalid code → restart with auth_get_url
- State mismatch → CSRF protection triggered → restart with auth_get_url`,
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Authorization code from the FreshBooks OAuth redirect URL. Example: "eyJhbGci..."',
                },
                state: {
                  type: 'string',
                  description: 'CSRF state token returned by auth_get_url; must match the value from that call. Example: "abc123xyz"',
                },
              },
              required: ['code', 'state'],
            },
          },
          {
            name: 'auth_revoke',
            description: `Revoke the current FreshBooks OAuth session and delete all stored tokens.

WHEN TO USE:
- User says "disconnect FreshBooks", "sign out", or "remove my FreshBooks connection"
- Switching to a different FreshBooks account — revoke first, then use auth_get_url for the new account
- Security: clear stored credentials from this machine

TAKES NO ARGUMENTS.

RETURNS:
{ success: true, message: "Authentication revoked successfully" }

NOTE: After calling this tool, all accounting and time-tracking tools will return auth errors until a new OAuth session is established via auth_get_url → auth_exchange_code.`,
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          // TODO: Additional tools will be registered here by other agents
        ],
      };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      logger.debug('Tool execution requested', {
        tool: name,
        hasArgs: !!args,
      });

      try {
        // Check if tool requires confirmation for destructive operations
        const metadata = getToolMetadata(name);
        if (metadata?.requiresConfirmation) {
          const confirmationId = (args as any)?.confirmationId;
          const confirmed = (args as any)?.confirmed;

          // Phase 2: Validate confirmation token if provided
          if (confirmed && confirmationId) {
            const isValid = await this.confirmationStore.consume(confirmationId, name, args);
            if (!isValid) {
              logger.warn('Invalid or expired confirmation token', { tool: name });
              return {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify(
                      sanitizeForMcpResponse({
                        error: true,
                        code: 'INVALID_CONFIRMATION',
                        message: 'Invalid or expired confirmation token. Please request a new confirmation.',
                        suggestion: 'Call this tool again without confirmationId to get a new confirmation prompt.',
                      }),
                      null,
                      2
                    ),
                  },
                ],
                isError: true,
              };
            }
            // Valid confirmation - proceed to execute
            logger.info('Confirmation validated for destructive operation', { tool: name, tier: metadata.tier });
          } else {
            // Phase 1: Generate confirmation token and return prompt
            const confirmation = await this.confirmationStore.create(name, args);
            logger.info('Tool requires confirmation', { tool: name, tier: metadata.tier });

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    sanitizeForMcpResponse({
                      requiresConfirmation: true,
                      tool: name,
                      tier: metadata.tier,
                      message: metadata.confirmationMessage,
                      confirmationId: confirmation.token,
                      expiresIn: 300, // 5 minutes
                      instruction: 'IMPORTANT: Ask the user for explicit confirmation before proceeding. To execute, call this tool again with the same parameters plus confirmed: true and confirmationId: "<token>"',
                    }),
                    null,
                    2
                  ),
                },
              ],
            };
          }
        }

        // Route to appropriate tool handler
        switch (name) {
          case 'auth_status':
            return await this.handleAuthStatus();

          case 'auth_get_url':
            return await this.handleAuthGetUrl();

          case 'auth_exchange_code':
            return await this.handleAuthExchangeCode(args);

          case 'auth_revoke':
            return await this.handleAuthRevoke();

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const mcpError = handleError(error, { tool: name });
        logger.error(`Tool ${name} failed`, error);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  error: {
                    code: mcpError.code,
                    message: mcpError.message,
                    recoverable: mcpError.data.recoverable,
                    suggestion: mcpError.data.suggestion,
                  },
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * Handle auth_status tool
   */
  private async handleAuthStatus() {
    const status = await this.oauth.getStatus();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(sanitizeForMcpResponse(status), null, 2),
        },
      ],
    };
  }

  /**
   * Handle auth_get_url tool
   */
  private async handleAuthGetUrl() {
    // Generate CSRF protection state
    const stateData = await this.stateStore.create();
    const url = this.oauth.generateAuthorizationUrl(stateData.state);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            sanitizeForMcpResponse({
              authorizationUrl: url,
              state: stateData.state,
              expiresIn: 600, // 10 minutes
              instructions: [
                '1. Visit the authorization URL in your browser',
                '2. Log in to FreshBooks and authorize the application',
                '3. Copy the authorization code from the redirect URL',
                '4. Call auth_exchange_code with the authorization code AND the state parameter',
              ],
            }),
            null,
            2
          ),
        },
      ],
    };
  }

  /**
   * Handle auth_exchange_code tool
   */
  private async handleAuthExchangeCode(args: any) {
    if (!args || !args.code) {
      throw createAuthError('Authorization code is required');
    }

    if (!args.state) {
      throw createAuthError('State parameter is required for CSRF protection');
    }

    // Validate and consume state (one-time use)
    const isValidState = await this.stateStore.consume(args.state);
    if (!isValidState) {
      throw createAuthError('Invalid or expired state parameter. Please start the authentication flow again with auth_get_url.');
    }

    const tokenData = await this.oauth.exchangeCode(args.code);

    // Set account if provided in token
    if (tokenData.accountId) {
      this.client.setAccountId(tokenData.accountId);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            sanitizeForMcpResponse({
              success: true,
              message: 'Authentication successful',
              accountId: tokenData.accountId,
              expiresIn: tokenData.expiresAt - Math.floor(Date.now() / 1000),
            }),
            null,
            2
          ),
        },
      ],
    };
  }

  /**
   * Handle auth_revoke tool
   */
  private async handleAuthRevoke() {
    await this.oauth.revokeToken();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            sanitizeForMcpResponse({
              success: true,
              message: 'Authentication revoked successfully',
            }),
            null,
            2
          ),
        },
      ],
    };
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();

    logger.info('Starting FreshBooks MCP server');

    await this.server.connect(transport);

    logger.info('FreshBooks MCP server running', {
      transport: 'stdio',
    });
  }
}

/**
 * Main entry point
 */
async function main() {
  try {
    const server = new FreshBooksServer();
    await server.start();

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      logger.info('Received SIGINT, shutting down gracefully');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM, shutting down gracefully');
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Run the server
main();
