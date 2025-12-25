/**
 * Shared TypeScript types for FreshBooks MCP Server
 */

// Re-export FreshBooks entity types
export * from './freshbooks.js';

/**
 * Log levels for the application logger
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * OAuth2 token storage structure
 */
export interface TokenStore {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp in milliseconds
  accountId: string;
}

/**
 * OAuth2 configuration
 */
export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizationUrl: string;
  tokenUrl: string;
  revokeUrl: string;
}

/**
 * Server configuration
 */
export interface ServerConfig {
  freshbooks: OAuthConfig & {
    apiBaseUrl: string;
  };
  server: {
    logLevel: LogLevel;
    tokenStorePath: string;
  };
}

/**
 * MCP error with FreshBooks context
 */
export interface MCPError {
  code: number;
  message: string;
  data: {
    freshbooksError?: {
      code: string;
      message: string;
      field?: string;
    };
    context?: Record<string, unknown>;
    recoverable: boolean;
    suggestion?: string;
  };
}

/**
 * FreshBooks API error structure
 */
export interface FreshBooksError {
  code?: string;
  message: string;
  field?: string;
  statusCode?: number;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  perPage?: number;
}

/**
 * Pagination metadata in responses
 */
export interface PaginationMetadata {
  page: number;
  pages: number;
  perPage: number;
  total: number;
}

/**
 * Standard list response wrapper
 */
export interface ListResponse<T> {
  data: T[];
  meta: {
    pagination: PaginationMetadata;
  };
}
