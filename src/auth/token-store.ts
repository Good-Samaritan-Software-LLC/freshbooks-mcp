/**
 * FreshBooks OAuth2 Token Storage
 *
 * Provides secure encrypted file storage and environment-based storage for OAuth tokens.
 */

import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import { dirname } from 'path';
import { TokenData, TokenStore } from './types.js';

const scryptAsync = promisify(scrypt);

/**
 * Encrypted file-based token storage using AES-256-GCM
 *
 * Tokens are encrypted at rest using a key derived from:
 * - Machine-specific identifier (username + platform)
 * - Optional password from environment variable
 *
 * This provides defense-in-depth: even if the token file is accessed,
 * it cannot be decrypted without the correct machine context.
 */
export class EncryptedFileTokenStore implements TokenStore {
  private filePath: string;
  private encryptionKey: Buffer | null = null;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  /**
   * Derive encryption key from machine-specific data
   */
  private async getKey(): Promise<Buffer> {
    if (this.encryptionKey) {
      return this.encryptionKey;
    }

    // Use machine-specific salt
    const machineId = this.getMachineId();

    // Optional password from environment, or default
    const password = process.env.FRESHBOOKS_TOKEN_PASSWORD || 'freshbooks-mcp-default-key';

    // Derive 32-byte key using scrypt
    this.encryptionKey = (await scryptAsync(password, machineId, 32)) as Buffer;

    return this.encryptionKey;
  }

  /**
   * Generate machine-specific identifier for key derivation
   */
  private getMachineId(): string {
    // Combine platform-specific data for unique salt
    const username = process.env.USERNAME || process.env.USER || 'unknown';
    const platform = process.platform;
    const hostname = process.env.COMPUTERNAME || process.env.HOSTNAME || 'unknown';

    return `${username}-${platform}-${hostname}-freshbooks-mcp`;
  }

  /**
   * Save encrypted token data to file
   */
  async save(token: TokenData): Promise<void> {
    const key = await this.getKey();

    // Generate random IV for this encryption
    const iv = randomBytes(16);

    // Create cipher
    const cipher = createCipheriv('aes-256-gcm', key, iv);

    // Encrypt token data
    const data = JSON.stringify(token);
    const encrypted = Buffer.concat([
      cipher.update(data, 'utf8'),
      cipher.final(),
    ]);

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Store IV, auth tag, and encrypted data
    const stored = {
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      data: encrypted.toString('hex'),
    };

    // Ensure directory exists
    await fs.mkdir(dirname(this.filePath), { recursive: true });

    // Write to file with restricted permissions
    await fs.writeFile(this.filePath, JSON.stringify(stored), {
      encoding: 'utf8',
      mode: 0o600, // Owner read/write only
    });
  }

  /**
   * Retrieve and decrypt token data from file
   */
  async get(): Promise<TokenData | null> {
    try {
      // Read encrypted file
      const content = await fs.readFile(this.filePath, 'utf8');
      const stored = JSON.parse(content);

      // Get decryption key
      const key = await this.getKey();

      // Parse stored components
      const iv = Buffer.from(stored.iv, 'hex');
      const authTag = Buffer.from(stored.authTag, 'hex');
      const encrypted = Buffer.from(stored.data, 'hex');

      // Create decipher
      const decipher = createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);

      // Decrypt data
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      // Parse and return token data
      return JSON.parse(decrypted.toString('utf8'));
    } catch (error) {
      // File doesn't exist, is corrupted, or decryption failed
      // Return null to indicate no valid token
      return null;
    }
  }

  /**
   * Clear all stored tokens
   */
  async clear(): Promise<void> {
    try {
      await fs.unlink(this.filePath);
    } catch {
      // File may not exist, ignore error
    }

    // Clear cached encryption key
    this.encryptionKey = null;
  }
}

/**
 * Environment-based token storage for CI/testing
 *
 * Reads tokens from environment variables:
 * - FRESHBOOKS_ACCESS_TOKEN (required)
 * - FRESHBOOKS_REFRESH_TOKEN (optional)
 * - FRESHBOOKS_TOKEN_EXPIRES (optional, unix timestamp)
 * - FRESHBOOKS_ACCOUNT_ID (optional)
 * - FRESHBOOKS_BUSINESS_ID (optional)
 *
 * This store is read-only and cannot persist token changes.
 */
export class EnvTokenStore implements TokenStore {
  /**
   * Retrieve token from environment variables
   */
  async get(): Promise<TokenData | null> {
    const accessToken = process.env.FRESHBOOKS_ACCESS_TOKEN;

    if (!accessToken) {
      return null;
    }

    const refreshToken = process.env.FRESHBOOKS_REFRESH_TOKEN || '';
    const expiresAt = parseInt(process.env.FRESHBOOKS_TOKEN_EXPIRES || '0', 10);
    const accountId = process.env.FRESHBOOKS_ACCOUNT_ID;
    const businessId = process.env.FRESHBOOKS_BUSINESS_ID
      ? parseInt(process.env.FRESHBOOKS_BUSINESS_ID, 10)
      : undefined;

    const tokenData: TokenData = {
      accessToken,
      refreshToken,
      expiresAt,
      tokenType: 'Bearer',
    };

    if (accountId) {
      tokenData.accountId = accountId;
    }

    if (businessId !== undefined) {
      tokenData.businessId = businessId;
    }

    return tokenData;
  }

  /**
   * Save operation not supported for environment store
   */
  async save(_token: TokenData): Promise<void> {
    // Environment store is read-only
    // Tokens should be updated via environment variable configuration
    console.error(
      'Warning: EnvTokenStore is read-only. Cannot persist token updates. ' +
      'Update FRESHBOOKS_ACCESS_TOKEN and related environment variables manually.'
    );
  }

  /**
   * Clear operation not supported for environment store
   */
  async clear(): Promise<void> {
    // Cannot clear environment variables
    console.error(
      'Warning: EnvTokenStore is read-only. Cannot clear environment variables.'
    );
  }
}

/**
 * In-memory token storage for testing
 *
 * Stores tokens in memory only. Tokens are lost when process exits.
 * Useful for unit tests and temporary operations.
 */
export class InMemoryTokenStore implements TokenStore {
  private token: TokenData | null = null;

  async get(): Promise<TokenData | null> {
    return this.token;
  }

  async save(token: TokenData): Promise<void> {
    this.token = token;
  }

  async clear(): Promise<void> {
    this.token = null;
  }
}
