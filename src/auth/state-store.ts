/**
 * OAuth State Store
 *
 * Manages OAuth2 state parameters for CSRF protection.
 * States are one-time use and expire after a configurable TTL.
 */

import { randomBytes } from 'crypto';

/**
 * OAuth state data
 */
export interface OAuthStateData {
  /** Cryptographically random state value */
  state: string;
  /** Unix timestamp when state was created */
  createdAt: number;
  /** Unix timestamp when state expires */
  expiresAt: number;
}

/**
 * State store interface for OAuth CSRF protection
 */
export interface StateStore {
  /**
   * Create a new state with optional TTL
   * @param ttlSeconds Time-to-live in seconds (default: 600 = 10 minutes)
   */
  create(ttlSeconds?: number): Promise<OAuthStateData>;

  /**
   * Validate that a state exists and is not expired
   * Does NOT consume the state (use for pre-validation)
   */
  validate(state: string): Promise<boolean>;

  /**
   * Consume a state (one-time use)
   * Returns true if valid and consumed, false otherwise
   */
  consume(state: string): Promise<boolean>;

  /**
   * Clear all stored states
   */
  clear(): Promise<void>;
}

/**
 * In-memory state store implementation
 *
 * Suitable for single-instance deployments.
 * States are automatically cleaned up when expired.
 */
export class InMemoryStateStore implements StateStore {
  private states: Map<string, OAuthStateData> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  /** Default TTL: 10 minutes */
  private static readonly DEFAULT_TTL_SECONDS = 600;

  /** Cleanup interval: 1 minute */
  private static readonly CLEANUP_INTERVAL_MS = 60000;

  /** State entropy: 32 bytes = 256 bits */
  private static readonly STATE_BYTES = 32;

  constructor() {
    // Start periodic cleanup
    this.startCleanup();
  }

  /**
   * Create a new cryptographically random state
   */
  async create(ttlSeconds = InMemoryStateStore.DEFAULT_TTL_SECONDS): Promise<OAuthStateData> {
    // Generate cryptographically secure random state
    const state = randomBytes(InMemoryStateStore.STATE_BYTES).toString('hex');

    const now = Math.floor(Date.now() / 1000);
    const stateData: OAuthStateData = {
      state,
      createdAt: now,
      expiresAt: now + ttlSeconds,
    };

    this.states.set(state, stateData);

    return stateData;
  }

  /**
   * Validate a state without consuming it
   */
  async validate(state: string): Promise<boolean> {
    const stateData = this.states.get(state);

    if (!stateData) {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    if (now > stateData.expiresAt) {
      // Expired - remove and return false
      this.states.delete(state);
      return false;
    }

    return true;
  }

  /**
   * Consume a state (one-time use)
   * This is the primary validation method - states can only be used once
   */
  async consume(state: string): Promise<boolean> {
    const isValid = await this.validate(state);

    if (isValid) {
      // Remove state after successful validation (one-time use)
      this.states.delete(state);
      return true;
    }

    return false;
  }

  /**
   * Clear all stored states
   */
  async clear(): Promise<void> {
    this.states.clear();
  }

  /**
   * Stop the cleanup interval (for testing/cleanup)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get the number of stored states (for testing)
   */
  size(): number {
    return this.states.size;
  }

  /**
   * Start periodic cleanup of expired states
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, InMemoryStateStore.CLEANUP_INTERVAL_MS);

    // Don't prevent process exit
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Remove expired states
   */
  private cleanup(): void {
    const now = Math.floor(Date.now() / 1000);

    for (const [state, data] of this.states.entries()) {
      if (now > data.expiresAt) {
        this.states.delete(state);
      }
    }
  }
}

/**
 * Create a default state store instance
 */
export function createStateStore(): StateStore {
  return new InMemoryStateStore();
}
