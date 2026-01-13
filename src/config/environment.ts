/**
 * Environment detection utilities for FreshBooks MCP Server
 *
 * Provides consistent environment detection across the codebase
 * for security-sensitive decisions like stack trace exposure.
 */

export type Environment = 'development' | 'test' | 'production';

/**
 * Get the current environment from NODE_ENV
 * Defaults to 'development' if not set
 */
export function getEnvironment(): Environment {
  const env = process.env.NODE_ENV?.toLowerCase();

  if (env === 'production' || env === 'prod') {
    return 'production';
  }

  if (env === 'test' || env === 'testing') {
    return 'test';
  }

  return 'development';
}

/**
 * Check if running in production environment
 */
export function isProduction(): boolean {
  return getEnvironment() === 'production';
}

/**
 * Check if running in development environment
 */
export function isDevelopment(): boolean {
  return getEnvironment() === 'development';
}

/**
 * Check if running in test environment
 */
export function isTest(): boolean {
  return getEnvironment() === 'test';
}
