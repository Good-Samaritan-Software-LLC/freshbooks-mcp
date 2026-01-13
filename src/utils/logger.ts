/**
 * Logging utility for FreshBooks MCP Server
 *
 * IMPORTANT: All logs go to stderr (stdout is reserved for MCP protocol)
 */

import type { LogLevel } from '../types/index.js';
import { isProduction } from '../config/environment.js';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Regex patterns for detecting sensitive keys
 * These patterns catch various naming conventions (camelCase, snake_case, etc.)
 */
const SENSITIVE_KEY_PATTERNS: RegExp[] = [
  // Tokens and authentication
  /token/i,
  /bearer/i,
  /jwt/i,
  /oauth/i,
  /session/i,
  /auth/i,

  // Secrets and passwords
  /secret/i,
  /password/i,
  /passwd/i,
  /pwd/i,
  /credential/i,

  // API keys
  /api[-_]?key/i,
  /apikey/i,
  /key/i,

  // Cryptographic
  /private[-_]?key/i,
  /signing/i,
  /cipher/i,
  /encrypt/i,
  /salt/i,
  /hash/i,
  /\biv\b/i, // initialization vector

  // Personal identifiable information
  /ssn/i,
  /social[-_]?security/i,
  /credit[-_]?card/i,
  /card[-_]?number/i,
  /cvv/i,
  /\bpin\b/i,

  // Headers
  /x-api/i,
  /x-auth/i,
  /x-secret/i,
];

/**
 * Exact key matches (case-insensitive, normalized)
 * These are checked after removing hyphens and underscores
 */
const SENSITIVE_EXACT_KEYS = new Set([
  'password',
  'token',
  'secret',
  'key',
  'accesstoken',
  'refreshtoken',
  'apikey',
  'clientsecret',
  'privatekey',
  'authorization',
  'bearer',
  'jwt',
  'sessionid',
  'cookie',
  'credentials',
]);

class Logger {
  private currentLevel: LogLevel;
  private requestId: string | null = null;
  private static readonly MAX_DEPTH = 10;

  constructor(level: LogLevel = 'info') {
    this.currentLevel = level;
  }

  /**
   * Set the current log level
   */
  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  /**
   * Set request ID for correlation
   */
  setRequestId(id: string): void {
    this.requestId = id;
  }

  /**
   * Clear request ID
   */
  clearRequestId(): void {
    this.requestId = null;
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.currentLevel];
  }

  /**
   * Check if a key name indicates sensitive data
   */
  private isSensitiveKey(key: string): boolean {
    // Normalize key: lowercase and remove separators
    const normalizedKey = key.toLowerCase().replace(/[-_]/g, '');

    // Check exact matches
    if (SENSITIVE_EXACT_KEYS.has(normalizedKey)) {
      return true;
    }

    // Check patterns
    return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
  }

  /**
   * Heuristically detect if a string value looks like a secret
   */
  private looksLikeSecret(value: string): boolean {
    // Skip short values
    if (value.length < 20) {
      return false;
    }

    // JWT pattern: eyJ...
    if (/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value)) {
      return true;
    }

    // Long hex strings (32+ chars) - likely keys/tokens
    if (/^[a-f0-9]{32,}$/i.test(value)) {
      return true;
    }

    // Base64-ish strings that are long (50+ chars) - likely tokens
    if (/^[A-Za-z0-9+/=_-]{50,}$/.test(value)) {
      return true;
    }

    return false;
  }

  /**
   * Sanitize data to prevent logging sensitive information
   */
  private sanitize(data: unknown, depth = 0): unknown {
    // Prevent infinite recursion
    if (depth > Logger.MAX_DEPTH) {
      return '[DEPTH_LIMIT]';
    }

    if (typeof data !== 'object' || data === null) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item, depth + 1));
    }

    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (this.isSensitiveKey(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string' && this.looksLikeSecret(value)) {
        // Detect secret-like values even if key doesn't match
        sanitized[key] = '[REDACTED_VALUE]';
      } else {
        sanitized[key] = this.sanitize(value, depth + 1);
      }
    }

    return sanitized;
  }

  /**
   * Write structured log to stderr
   */
  private write(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(this.requestId && { requestId: this.requestId }),
      ...(context && { context: this.sanitize(context) }),
    };

    // Write to stderr only (stdout reserved for MCP protocol)
    process.stderr.write(JSON.stringify(logEntry) + '\n');
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.write('debug', message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.write('info', message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.write('warn', message, context);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
    const errorContext: Record<string, unknown> = context ? { ...context } : {};

    if (error instanceof Error) {
      errorContext.error = {
        name: error.name,
        message: error.message,
        // Only include stack traces in non-production environments
        ...(isProduction() ? {} : { stack: error.stack }),
      };
    } else if (error) {
      errorContext.error = this.sanitize(error);
    }

    this.write('error', message, errorContext);
  }
}

// Export singleton instance
export const logger = new Logger();
