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
            description: 'Check current FreshBooks authentication status',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'auth_get_url',
            description: 'Get OAuth authorization URL to authenticate with FreshBooks',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'auth_exchange_code',
            description: 'Exchange OAuth authorization code for access tokens',
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Authorization code from OAuth redirect',
                },
                state: {
                  type: 'string',
                  description: 'State parameter returned by auth_get_url (required for CSRF protection)',
                },
              },
              required: ['code', 'state'],
            },
          },
          {
            name: 'auth_revoke',
            description: 'Revoke current authentication and clear tokens',
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
