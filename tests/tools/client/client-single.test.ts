/**
 * Tests for client_single tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clientSingleTool } from '../../../src/tools/client/client-single.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockClientSingleResponse,
  mockClientNotFoundError,
} from '../../mocks/responses/client.js';
import {
  mockUnauthorizedError,
  mockServerError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('client_single tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should return a client by ID', async () => {
      const mockResponse = mockClientSingleResponse({ id: 12345 });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await clientSingleTool.execute(
        { accountId: 'ABC123', clientId: 12345 },
        mockClient as any
      );

      expect(result.id).toBe(12345);
      expect(result.fName).toBe('John');
      expect(result.lName).toBe('Doe');
    });

    it('should return all client fields', async () => {
      const mockResponse = mockClientSingleResponse({
        id: 12345,
        organization: 'Test Corp',
        email: 'test@example.com',
        currencyCode: 'CAD',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await clientSingleTool.execute(
        { accountId: 'ABC123', clientId: 12345 },
        mockClient as any
      );

      expect(result.organization).toBe('Test Corp');
      expect(result.email).toBe('test@example.com');
      expect(result.currencyCode).toBe('CAD');
    });
  });

  describe('error handling', () => {
    it('should handle not found error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            single: vi.fn().mockResolvedValue(mockClientNotFoundError(99999)),
          },
        };
        return apiCall(client);
      });

      await expect(
        clientSingleTool.execute(
          { accountId: 'ABC123', clientId: 99999 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            single: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        clientSingleTool.execute(
          { accountId: 'ABC123', clientId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            single: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        clientSingleTool.execute(
          { accountId: 'ABC123', clientId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        clientSingleTool.execute({ clientId: 12345 } as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require clientId', async () => {
      await expect(
        clientSingleTool.execute({ accountId: 'ABC123' } as any, mockClient as any)
      ).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle client with all null optional fields', async () => {
      const mockResponse = mockClientSingleResponse({
        homePhone: null,
        note: null,
        vatNumber: null,
        vatName: null,
        language: null,
        hasRetainer: null,
        retainerId: null,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await clientSingleTool.execute(
        { accountId: 'ABC123', clientId: 12345 },
        mockClient as any
      );

      expect(result.homePhone).toBeNull();
      expect(result.note).toBeNull();
      expect(result.vatNumber).toBeNull();
    });

    it('should handle client with unicode characters', async () => {
      const mockResponse = mockClientSingleResponse({
        fName: 'José',
        organization: '日本株式会社',
        note: 'Client note with émojis 🎉',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await clientSingleTool.execute(
        { accountId: 'ABC123', clientId: 12345 },
        mockClient as any
      );

      expect(result.fName).toBe('José');
      expect(result.organization).toBe('日本株式会社');
      expect(result.note).toBe('Client note with émojis 🎉');
    });
  });
});
