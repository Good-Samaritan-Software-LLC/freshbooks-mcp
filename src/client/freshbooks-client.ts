/**
 * FreshBooks Client Wrapper
 *
 * Wraps the FreshBooks SDK with:
 * - Automatic token refresh
 * - Error normalization to MCP format
 * - Rate limiting with exponential backoff
 * - Request logging
 */

import { Client } from '@freshbooks/api';
import { FreshBooksOAuth } from '../auth/oauth.js';
import { handleError, MCPErrorCode } from '../errors/index.js';
import { logger } from '../utils/logger.js';
import type { MCPError, ErrorContext } from '../errors/types.js';

/**
 * Wrapper around FreshBooks SDK Client
 *
 * Provides automatic token refresh, error handling, and logging.
 */
export class FreshBooksClientWrapper {
  private oauth: FreshBooksOAuth;
  private client: Client | null = null;
  private currentAccountId: string | null = null;

  // Rate limiting configuration
  private static readonly MAX_RETRIES = 3;
  private static readonly BASE_BACKOFF_MS = 1000;

  constructor(oauth: FreshBooksOAuth) {
    this.oauth = oauth;
  }

  /**
   * Get or create FreshBooks client with valid token
   */
  private async getClient(): Promise<Client> {
    try {
      // Get valid access token (auto-refreshes if needed)
      const accessToken = await this.oauth.getValidToken();

      // Always create a new client instance with the current token
      // The FreshBooks SDK requires the token to be provided at construction
      this.client = new Client(accessToken, {
        apiUrl: 'https://api.freshbooks.com',
      });

      logger.debug('Created new FreshBooks client');

      return this.client;
    } catch (error) {
      logger.error('Failed to get FreshBooks client', error);
      throw handleError(error, { operation: 'getClient' });
    }
  }

  /**
   * Execute an API call with automatic retry and error handling
   *
   * @param operation Name of the operation for logging
   * @param apiCall Function that makes the API call
   * @returns API response
   */
  async executeWithRetry<T>(
    operation: string,
    apiCall: (client: Client) => Promise<T>
  ): Promise<T> {
    let lastError: Error | unknown;
    const requestId = this.generateRequestId();

    for (let attempt = 1; attempt <= FreshBooksClientWrapper.MAX_RETRIES; attempt++) {
      try {
        logger.debug(`Executing ${operation}`, {
          requestId,
          attempt,
          accountId: this.currentAccountId,
        });

        const startTime = Date.now();
        const client = await this.getClient();
        const result = await apiCall(client);
        const duration = Date.now() - startTime;

        logger.info(`${operation} completed`, {
          requestId,
          duration,
          attempt,
        });

        return result;
      } catch (error) {
        lastError = error;

        // Check if error is recoverable and should be retried
        const mcpError = this.normalizeError(error, operation, requestId);
        const shouldRetry = this.shouldRetry(mcpError, attempt);

        logger.warn(`${operation} failed`, {
          requestId,
          attempt,
          errorCode: mcpError.code,
          recoverable: mcpError.data.recoverable,
          willRetry: shouldRetry,
        });

        if (!shouldRetry) {
          throw mcpError;
        }

        // Exponential backoff before retry
        const backoffMs = FreshBooksClientWrapper.BASE_BACKOFF_MS * Math.pow(2, attempt - 1);
        await this.sleep(backoffMs);
      }
    }

    // All retries exhausted
    logger.error(`${operation} failed after ${FreshBooksClientWrapper.MAX_RETRIES} attempts`, lastError, {
      requestId,
    });

    throw this.normalizeError(lastError, operation, requestId);
  }

  /**
   * Set the active account ID for API calls
   */
  setAccountId(accountId: string): void {
    this.currentAccountId = accountId;
    logger.debug('Set active account', { accountId });
  }

  /**
   * Get the current account ID
   */
  getAccountId(): string | null {
    return this.currentAccountId;
  }

  /**
   * Normalize API errors to MCP format
   */
  private normalizeError(error: unknown, operation: string, requestId: string): MCPError {
    const context: ErrorContext = {
      operation,
      requestId,
    };

    if (this.currentAccountId !== null) {
      context.accountId = this.currentAccountId;
    }

    return handleError(error, context);
  }

  /**
   * Determine if an error should be retried
   */
  private shouldRetry(error: MCPError, attempt: number): boolean {
    // Don't retry if we've exhausted attempts
    if (attempt >= FreshBooksClientWrapper.MAX_RETRIES) {
      return false;
    }

    // Only retry recoverable errors
    if (!error.data.recoverable) {
      return false;
    }

    // Retry rate limit and network errors
    const retryableCodes = [
      MCPErrorCode.RATE_LIMITED,
      MCPErrorCode.NETWORK_ERROR,
      MCPErrorCode.TIMEOUT,
      MCPErrorCode.SERVICE_UNAVAILABLE,
    ];

    return retryableCodes.includes(error.code);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Generate unique request ID for tracking
   */
  private generateRequestId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `req_${timestamp}_${random}`;
  }

  /**
   * Access the underlying FreshBooks client
   * Use with caution - prefer executeWithRetry for automatic error handling
   */
  async getUnderlyingClient(): Promise<Client> {
    return this.getClient();
  }
}
