/**
 * Configuration management for FreshBooks MCP Server
 */

import type { ServerConfig, LogLevel } from '../types/index.js';
import { logger } from '../utils/logger.js';

/**
 * Load and validate server configuration from environment variables
 */
export function loadConfig(): ServerConfig {
  // Load environment variables
  const clientId = process.env.FRESHBOOKS_CLIENT_ID;
  const clientSecret = process.env.FRESHBOOKS_CLIENT_SECRET;
  const redirectUri = process.env.FRESHBOOKS_REDIRECT_URI || 'http://localhost:3000/oauth/callback';
  const logLevel = (process.env.LOG_LEVEL || 'info') as LogLevel;
  const tokenStorePath = process.env.TOKEN_STORE_PATH || '.freshbooks-tokens.json';
  const apiBaseUrl = process.env.FRESHBOOKS_API_BASE_URL || 'https://api.freshbooks.com';

  // Validate required configuration
  const missing: string[] = [];

  if (!clientId) {
    missing.push('FRESHBOOKS_CLIENT_ID');
  }

  if (!clientSecret) {
    missing.push('FRESHBOOKS_CLIENT_SECRET');
  }

  if (missing.length > 0) {
    const errorMessage = `Missing required environment variables: ${missing.join(', ')}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  // Validate log level
  const validLogLevels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  if (!validLogLevels.includes(logLevel)) {
    logger.warn(`Invalid LOG_LEVEL "${logLevel}", defaulting to "info"`, {
      validLevels: validLogLevels,
    });
  }

  const config: ServerConfig = {
    freshbooks: {
      clientId: clientId as string,
      clientSecret: clientSecret as string,
      redirectUri,
      authorizationUrl: 'https://my.freshbooks.com/service/auth/oauth/authorize',
      tokenUrl: 'https://api.freshbooks.com/auth/oauth/token',
      revokeUrl: 'https://api.freshbooks.com/auth/oauth/revoke',
      apiBaseUrl,
    },
    server: {
      logLevel: validLogLevels.includes(logLevel) ? logLevel : 'info',
      tokenStorePath,
    },
  };

  // Set logger level
  logger.setLevel(config.server.logLevel);

  // Log configuration (sanitized)
  logger.info('Configuration loaded successfully', {
    redirectUri: config.freshbooks.redirectUri,
    logLevel: config.server.logLevel,
    tokenStorePath: config.server.tokenStorePath,
    apiBaseUrl: config.freshbooks.apiBaseUrl,
  });

  return config;
}

/**
 * Global configuration instance
 */
let configInstance: ServerConfig | null = null;

/**
 * Get the current configuration, loading it if necessary
 */
export function getConfig(): ServerConfig {
  if (!configInstance) {
    configInstance = loadConfig();
  }
  return configInstance;
}

/**
 * Reset configuration (useful for testing)
 */
export function resetConfig(): void {
  configInstance = null;
}
