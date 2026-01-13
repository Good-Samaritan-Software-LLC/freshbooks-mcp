/**
 * Confirmation Store
 *
 * Manages confirmation tokens for destructive operations.
 * Implements a two-phase confirmation flow to prevent bypass attacks:
 *
 * 1. First call (no confirmation): Generate unique token, return to client
 * 2. Second call (with token): Validate token, execute if valid
 *
 * Security features:
 * - Cryptographically secure random tokens
 * - One-time use (tokens are consumed on validation)
 * - TTL expiration (default 5 minutes)
 * - Request binding (token tied to specific tool + args hash)
 */

import { randomBytes, createHash } from 'crypto';

/**
 * Confirmation data structure
 */
export interface ConfirmationData {
  /** Unique confirmation token */
  token: string;
  /** Tool name that requires confirmation */
  toolName: string;
  /** Hash of the original request arguments (for binding) */
  argsHash: string;
  /** Timestamp when confirmation was created */
  createdAt: number;
  /** Timestamp when confirmation expires */
  expiresAt: number;
}

/**
 * Confirmation store interface
 */
export interface ConfirmationStore {
  /**
   * Create a new confirmation token for a destructive operation
   * @param toolName - Tool requiring confirmation
   * @param args - Original request arguments (will be hashed)
   * @param ttlSeconds - Time-to-live in seconds (default 300 = 5 min)
   * @returns Confirmation data with token
   */
  create(toolName: string, args: unknown, ttlSeconds?: number): Promise<ConfirmationData>;

  /**
   * Validate and consume a confirmation token (one-time use)
   * @param token - Confirmation token to validate
   * @param toolName - Tool name (must match original)
   * @param args - Request arguments (hash must match original)
   * @returns true if valid and consumed, false otherwise
   */
  consume(token: string, toolName: string, args: unknown): Promise<boolean>;

  /**
   * Clear all expired confirmations (called periodically)
   */
  clearExpired(): Promise<void>;

  /**
   * Clear all confirmations (for testing)
   */
  clear(): Promise<void>;
}

/**
 * In-memory confirmation store implementation
 */
export class InMemoryConfirmationStore implements ConfirmationStore {
  private confirmations = new Map<string, ConfirmationData>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  /** Default TTL: 5 minutes */
  private static readonly DEFAULT_TTL_SECONDS = 300;

  /** Token size: 32 bytes = 256 bits of entropy */
  private static readonly TOKEN_BYTES = 32;

  /** Cleanup interval: every 60 seconds */
  private static readonly CLEANUP_INTERVAL_MS = 60_000;

  constructor() {
    // Start periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.clearExpired().catch(() => {
        // Ignore cleanup errors
      });
    }, InMemoryConfirmationStore.CLEANUP_INTERVAL_MS);

    // Don't keep process alive for cleanup
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Generate a secure random confirmation token
   */
  private generateToken(): string {
    return randomBytes(InMemoryConfirmationStore.TOKEN_BYTES).toString('hex');
  }

  /**
   * Hash the request arguments for binding
   */
  private hashArgs(args: unknown): string {
    // Remove the confirmation-related fields before hashing
    const cleanArgs = this.removeConfirmationFields(args);
    const json = JSON.stringify(cleanArgs, Object.keys(cleanArgs || {}).sort());
    return createHash('sha256').update(json).digest('hex');
  }

  /**
   * Remove confirmation fields from args before hashing
   */
  private removeConfirmationFields(args: unknown): unknown {
    if (!args || typeof args !== 'object') {
      return args;
    }
    const cleaned = { ...args } as Record<string, unknown>;
    delete cleaned['confirmed'];
    delete cleaned['confirmationId'];
    return cleaned;
  }

  async create(
    toolName: string,
    args: unknown,
    ttlSeconds: number = InMemoryConfirmationStore.DEFAULT_TTL_SECONDS
  ): Promise<ConfirmationData> {
    const token = this.generateToken();
    const now = Date.now();
    const argsHash = this.hashArgs(args);

    const confirmation: ConfirmationData = {
      token,
      toolName,
      argsHash,
      createdAt: now,
      expiresAt: now + ttlSeconds * 1000,
    };

    this.confirmations.set(token, confirmation);

    return confirmation;
  }

  async consume(token: string, toolName: string, args: unknown): Promise<boolean> {
    const confirmation = this.confirmations.get(token);

    if (!confirmation) {
      return false;
    }

    // Check expiration
    if (Date.now() > confirmation.expiresAt) {
      this.confirmations.delete(token);
      return false;
    }

    // Verify tool name matches
    if (confirmation.toolName !== toolName) {
      return false;
    }

    // Verify args hash matches (prevents parameter tampering)
    const argsHash = this.hashArgs(args);
    if (confirmation.argsHash !== argsHash) {
      return false;
    }

    // Consume (one-time use)
    this.confirmations.delete(token);
    return true;
  }

  async clearExpired(): Promise<void> {
    const now = Date.now();
    for (const [token, confirmation] of this.confirmations) {
      if (now > confirmation.expiresAt) {
        this.confirmations.delete(token);
      }
    }
  }

  async clear(): Promise<void> {
    this.confirmations.clear();
  }

  /**
   * Stop the cleanup interval (for graceful shutdown)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}
