/**
 * Logging utility for FreshBooks MCP Server
 *
 * IMPORTANT: All logs go to stderr (stdout is reserved for MCP protocol)
 */

import type { LogLevel } from '../types/index.js';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private currentLevel: LogLevel;
  private requestId: string | null = null;

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
   * Sanitize data to prevent logging sensitive information
   */
  private sanitize(data: unknown): unknown {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item));
    }

    const sanitized: Record<string, unknown> = {};
    const sensitiveKeys = [
      'token',
      'accessToken',
      'refreshToken',
      'access_token',
      'refresh_token',
      'secret',
      'password',
      'clientSecret',
      'client_secret',
      'authorization',
      'apiKey',
      'api_key',
    ];

    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = this.sanitize(value);
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
        stack: error.stack,
      };
    } else if (error) {
      errorContext.error = this.sanitize(error);
    }

    this.write('error', message, errorContext);
  }
}

// Export singleton instance
export const logger = new Logger();
