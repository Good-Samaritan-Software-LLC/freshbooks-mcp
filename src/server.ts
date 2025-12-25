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
import { FreshBooksClientWrapper } from './client/index.js';
import { handleError, createAuthError } from './errors/index.js';

/**
 * Main server class
 */
class FreshBooksServer {
  private server: Server;
  private oauth: FreshBooksOAuth;
  private client: FreshBooksClientWrapper;

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

    // Initialize OAuth and client
    const tokenStore = new EncryptedFileTokenStore(config.server.tokenStorePath);
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
              },
              required: ['code'],
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
          text: JSON.stringify(status, null, 2),
        },
      ],
    };
  }

  /**
   * Handle auth_get_url tool
   */
  private async handleAuthGetUrl() {
    const url = this.oauth.generateAuthorizationUrl();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              authorizationUrl: url,
              instructions: [
                '1. Visit the authorization URL in your browser',
                '2. Log in to FreshBooks and authorize the application',
                '3. Copy the authorization code from the redirect URL',
                '4. Call auth_exchange_code with the authorization code',
              ],
            },
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
            {
              success: true,
              message: 'Authentication successful',
              accountId: tokenData.accountId,
              expiresIn: tokenData.expiresAt - Math.floor(Date.now() / 1000),
            },
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
            {
              success: true,
              message: 'Authentication revoked successfully',
            },
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
