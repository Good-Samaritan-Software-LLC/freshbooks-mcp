/**
 * Output sanitization utilities for MCP responses
 *
 * Prevents prompt injection attacks by sanitizing user-controlled data
 * before returning it to Claude in MCP tool responses.
 */

export interface SanitizeOptions {
  /** Maximum string length before truncation (default: 10000) */
  maxStringLength?: number;
  /** Strip control characters (default: true) */
  stripControlChars?: boolean;
  /** Maximum recursion depth (default: 50) */
  maxDepth?: number;
  /** Flag suspicious content in metadata (default: true) */
  flagSuspiciousContent?: boolean;
}

export interface SanitizeResult {
  data: unknown;
  warnings: string[];
}

const DEFAULT_OPTIONS: Required<SanitizeOptions> = {
  maxStringLength: 10000,
  stripControlChars: true,
  maxDepth: 50,
  flagSuspiciousContent: true,
};

/**
 * Patterns that may indicate prompt injection attempts
 * These are flagged but not blocked to avoid false positives
 */
const SUSPICIOUS_PATTERNS: RegExp[] = [
  // Direct instruction overrides
  /ignore\s+(all\s+)?previous\s+instructions?/i,
  /ignore\s+(all\s+)?prior\s+instructions?/i,
  /disregard\s+(all\s+)?previous/i,
  /forget\s+(all\s+)?previous/i,

  // Role manipulation
  /you\s+are\s+now\s+a/i,
  /pretend\s+you\s+are/i,
  /act\s+as\s+(if\s+you\s+are\s+)?a/i,
  /from\s+now\s+on,?\s+you/i,

  // System prompt references
  /system\s*prompt/i,
  /\[system\]/i,
  /\[INST\]/i,
  /<\|system\|>/i,

  // Jailbreak attempts
  /do\s+anything\s+now/i,
  /DAN\s+mode/i,
  /developer\s+mode/i,
  /jailbreak/i,

  // Instruction injection markers
  /\n\n---\n\nNew instructions:/i,
  /END\s+OF\s+DOCUMENT/i,
  /IMPORTANT:\s*As\s+an?\s+AI/i,

  // Tool manipulation
  /call\s+(the\s+)?tool/i,
  /execute\s+(the\s+)?function/i,
  /invoke\s+.*_delete/i,
];

/**
 * Control characters to strip (excluding common whitespace)
 */
const CONTROL_CHAR_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/**
 * Check if a string contains suspicious content that might be prompt injection
 */
export function containsSuspiciousContent(str: string): boolean {
  if (typeof str !== 'string') {
    return false;
  }

  return SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(str));
}

/**
 * Sanitize a string value
 */
function sanitizeString(str: string, options: Required<SanitizeOptions>): string {
  let result = str;

  // Strip control characters
  if (options.stripControlChars) {
    result = result.replace(CONTROL_CHAR_REGEX, '');
  }

  // Truncate if too long
  if (result.length > options.maxStringLength) {
    result = result.substring(0, options.maxStringLength) + '... [TRUNCATED]';
  }

  return result;
}

/**
 * Recursively sanitize data for MCP response
 */
function sanitizeValue(
  data: unknown,
  options: Required<SanitizeOptions>,
  warnings: string[],
  path: string,
  depth: number
): unknown {
  // Check depth limit
  if (depth > options.maxDepth) {
    warnings.push(`Max depth exceeded at path: ${path}`);
    return '[MAX_DEPTH_EXCEEDED]';
  }

  // Handle null/undefined
  if (data === null || data === undefined) {
    return data;
  }

  // Handle primitives
  if (typeof data === 'string') {
    const sanitized = sanitizeString(data, options);

    // Check for suspicious content
    if (options.flagSuspiciousContent && containsSuspiciousContent(data)) {
      warnings.push(`Suspicious content detected at path: ${path}`);
    }

    return sanitized;
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item, index) =>
      sanitizeValue(item, options, warnings, `${path}[${index}]`, depth + 1)
    );
  }

  // Handle objects
  if (typeof data === 'object') {
    // Handle Date objects
    if (data instanceof Date) {
      return data.toISOString();
    }

    // Handle regular objects
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeValue(value, options, warnings, `${path}.${key}`, depth + 1);
    }

    return sanitized;
  }

  // Handle functions (shouldn't appear in JSON, but be safe)
  if (typeof data === 'function') {
    return '[FUNCTION]';
  }

  return data;
}

/**
 * Sanitize data for MCP response with warnings
 *
 * Returns both the sanitized data and any warnings about suspicious content.
 * Warnings are for logging purposes - the data is still returned.
 */
export function sanitizeWithWarnings(
  data: unknown,
  options?: SanitizeOptions
): SanitizeResult {
  const mergedOptions: Required<SanitizeOptions> = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const warnings: string[] = [];
  const sanitizedData = sanitizeValue(data, mergedOptions, warnings, '$', 0);

  return {
    data: sanitizedData,
    warnings,
  };
}

/**
 * Sanitize data for MCP response
 *
 * This is the main function to use when preparing tool responses.
 * It sanitizes user-controlled data to prevent prompt injection.
 *
 * @param data - The data to sanitize (typically from FreshBooks API)
 * @param options - Optional sanitization options
 * @returns Sanitized data safe for MCP response
 */
export function sanitizeForMcpResponse(data: unknown, options?: SanitizeOptions): unknown {
  return sanitizeWithWarnings(data, options).data;
}

/**
 * Create a sanitized JSON string for MCP response content
 *
 * Convenience function that sanitizes and stringifies in one call.
 */
export function toSanitizedJson(data: unknown, options?: SanitizeOptions): string {
  const sanitized = sanitizeForMcpResponse(data, options);
  return JSON.stringify(sanitized, null, 2);
}
