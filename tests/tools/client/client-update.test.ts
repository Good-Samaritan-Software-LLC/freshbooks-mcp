/**
 * Tests for client_update tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clientUpdateTool } from '../../../src/tools/client/client-update.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockClientUpdateResponse,
  mockClientNotFoundError,
} from '../../mocks/responses/client.js';
import {
  mockUnauthorizedError,
  mockServerError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('client_update tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should update client email', async () => {
      const mockResponse = mockClientUpdateResponse(12345, {
        email: 'newemail@example.com',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await clientUpdateTool.execute(
        { accountId: 'ABC123', clientId: 12345, email: 'newemail@example.com' },
        mockClient as any
      );

      expect(result.id).toBe(12345);
      expect(result.email).toBe('newemail@example.com');
    });

    it('should update client address', async () => {
      const mockResponse = mockClientUpdateResponse(12345, {
        pStreet: '456 Oak Ave',
        pCity: 'Boston',
        pProvince: 'MA',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await clientUpdateTool.execute(
        {
          accountId: 'ABC123',
          clientId: 12345,
          pStreet: '456 Oak Ave',
          pCity: 'Boston',
          pProvince: 'MA',
        },
        mockClient as any
      );

      expect(result.pStreet).toBe('456 Oak Ave');
      expect(result.pCity).toBe('Boston');
    });

    it('should archive a client', async () => {
      const mockResponse = mockClientUpdateResponse(12345, { visState: 2 });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await clientUpdateTool.execute(
        { accountId: 'ABC123', clientId: 12345, visState: 2 },
        mockClient as any
      );

      expect(result.visState).toBe(2);
    });

    it('should update billing preferences', async () => {
      const mockResponse = mockClientUpdateResponse(12345, {
        allowLateFees: false,
        allowLateNotifications: true,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await clientUpdateTool.execute(
        {
          accountId: 'ABC123',
          clientId: 12345,
          allowLateFees: false,
          allowLateNotifications: true,
        },
        mockClient as any
      );

      expect(result.allowLateFees).toBe(false);
      expect(result.allowLateNotifications).toBe(true);
    });

    it('should pass correct data to API', async () => {
      let capturedAccountId: string = '';
      let capturedClientId: number = 0;
      let capturedUpdates: any = null;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            update: vi.fn((updates: any, accountId: string, clientId: string) => {
              capturedUpdates = updates;
              capturedAccountId = accountId;
              capturedClientId = parseInt(clientId);
              return Promise.resolve(mockClientUpdateResponse(parseInt(clientId), updates));
            }),
          },
        };
        return apiCall(client);
      });

      await clientUpdateTool.execute(
        {
          accountId: 'ABC123',
          clientId: 12345,
          fName: 'Jane',
          busPhone: '555-9999',
        },
        mockClient as any
      );

      expect(capturedAccountId).toBe('ABC123');
      expect(capturedClientId).toBe(12345);
      expect(capturedUpdates.fName).toBe('Jane');
      expect(capturedUpdates.busPhone).toBe('555-9999');
    });
  });

  describe('error handling', () => {
    it('should handle not found error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            update: vi.fn().mockResolvedValue(mockClientNotFoundError(99999)),
          },
        };
        return apiCall(client);
      });

      await expect(
        clientUpdateTool.execute(
          { accountId: 'ABC123', clientId: 99999, fName: 'John' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            update: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        clientUpdateTool.execute(
          { accountId: 'ABC123', clientId: 12345, fName: 'John' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            update: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        clientUpdateTool.execute(
          { accountId: 'ABC123', clientId: 12345, fName: 'John' },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        clientUpdateTool.execute(
          { clientId: 12345, fName: 'John' } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should require clientId', async () => {
      await expect(
        clientUpdateTool.execute(
          { accountId: 'ABC123', fName: 'John' } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject invalid email format', async () => {
      await expect(
        clientUpdateTool.execute(
          { accountId: 'ABC123', clientId: 12345, email: 'not-an-email' },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle updating with unicode characters', async () => {
      const mockResponse = mockClientUpdateResponse(12345, {
        organization: '株式会社テスト',
        note: 'Note with émojis 🎉',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await clientUpdateTool.execute(
        {
          accountId: 'ABC123',
          clientId: 12345,
          organization: '株式会社テスト',
          note: 'Note with émojis 🎉',
        },
        mockClient as any
      );

      expect(result.organization).toBe('株式会社テスト');
      expect(result.note).toBe('Note with émojis 🎉');
    });

    it('should handle partial updates', async () => {
      const mockResponse = mockClientUpdateResponse(12345, { fName: 'Updated' });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await clientUpdateTool.execute(
        { accountId: 'ABC123', clientId: 12345, fName: 'Updated' },
        mockClient as any
      );

      expect(result.fName).toBe('Updated');
      // Other fields should remain unchanged
      expect(result.lName).toBe('Doe');
    });
  });
});
