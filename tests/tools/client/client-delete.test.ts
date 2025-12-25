/**
 * Tests for client_delete tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clientDeleteTool } from '../../../src/tools/client/client-delete.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockClientDeleteResponse,
  mockClientNotFoundError,
} from '../../mocks/responses/client.js';
import {
  mockUnauthorizedError,
  mockServerError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('client_delete tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should delete a client', async () => {
      const mockResponse = mockClientDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await clientDeleteTool.execute(
        { accountId: 'ABC123', clientId: 12345 },
        mockClient as any
      );

      expect(result.success).toBe(true);
      expect(result.clientId).toBe(12345);
    });

    it('should call delete API with correct parameters', async () => {
      let capturedAccountId: string = '';
      let capturedClientId: string = '';

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            delete: vi.fn((accountId: string, clientId: string) => {
              capturedAccountId = accountId;
              capturedClientId = clientId;
              return Promise.resolve(mockClientDeleteResponse());
            }),
          },
        };
        return apiCall(client);
      });

      await clientDeleteTool.execute(
        { accountId: 'ABC123', clientId: 54321 },
        mockClient as any
      );

      expect(capturedAccountId).toBe('ABC123');
      expect(capturedClientId).toBe('54321');
    });
  });

  describe('error handling', () => {
    it('should handle not found error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            delete: vi.fn().mockResolvedValue(mockClientNotFoundError(99999)),
          },
        };
        return apiCall(client);
      });

      await expect(
        clientDeleteTool.execute(
          { accountId: 'ABC123', clientId: 99999 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            delete: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        clientDeleteTool.execute(
          { accountId: 'ABC123', clientId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            delete: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        clientDeleteTool.execute(
          { accountId: 'ABC123', clientId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        clientDeleteTool.execute({ clientId: 12345 } as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require clientId', async () => {
      await expect(
        clientDeleteTool.execute({ accountId: 'ABC123' } as any, mockClient as any)
      ).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle deleting already deleted client', async () => {
      // FreshBooks might return success even for already deleted clients
      const mockResponse = mockClientDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await clientDeleteTool.execute(
        { accountId: 'ABC123', clientId: 12345 },
        mockClient as any
      );

      expect(result.success).toBe(true);
    });
  });
});
