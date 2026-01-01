/**
 * Tests for client_create tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clientCreateTool } from '../../../src/tools/client/client-create.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockClientCreateResponse,
  mockClientDuplicateEmailError,
} from '../../mocks/responses/client.js';
import {
  mockUnauthorizedError,
  mockServerError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('client_create tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should create a client with minimal info', async () => {
      const mockResponse = mockClientCreateResponse({
        fName: 'John',
        lName: 'Doe',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await clientCreateTool.execute(
        { accountId: 'ABC123', fName: 'John', lName: 'Doe' },
        mockClient as any
      );

      expect(result.id).toBe(99999);
      expect(result.fName).toBe('John');
      expect(result.lName).toBe('Doe');
    });

    it('should create a client with organization', async () => {
      const mockResponse = mockClientCreateResponse({
        organization: 'Acme Corp',
        email: 'billing@acme.com',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await clientCreateTool.execute(
        { accountId: 'ABC123', organization: 'Acme Corp', email: 'billing@acme.com' },
        mockClient as any
      );

      expect(result.organization).toBe('Acme Corp');
      expect(result.email).toBe('billing@acme.com');
    });

    it('should create a client with full address', async () => {
      const mockResponse = mockClientCreateResponse({
        pStreet: '123 Main St',
        pCity: 'New York',
        pProvince: 'NY',
        pCode: '10001',
        pCountry: 'United States',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await clientCreateTool.execute(
        {
          accountId: 'ABC123',
          fName: 'John',
          pStreet: '123 Main St',
          pCity: 'New York',
          pProvince: 'NY',
          pCode: '10001',
          pCountry: 'United States',
        },
        mockClient as any
      );

      expect(result.pStreet).toBe('123 Main St');
      expect(result.pCity).toBe('New York');
      expect(result.pCountry).toBe('United States');
    });

    it('should create a client with billing preferences', async () => {
      const mockResponse = mockClientCreateResponse({
        allowLateFees: true,
        allowLateNotifications: false,
        currencyCode: 'CAD',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await clientCreateTool.execute(
        {
          accountId: 'ABC123',
          fName: 'John',
          allowLateFees: true,
          allowLateNotifications: false,
          currencyCode: 'CAD',
        },
        mockClient as any
      );

      expect(result.allowLateFees).toBe(true);
      expect(result.allowLateNotifications).toBe(false);
      expect(result.currencyCode).toBe('CAD');
    });

    it('should pass correct data to API', async () => {
      let capturedPayload: any = null;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            create: vi.fn((payload: any) => {
              capturedPayload = payload;
              return Promise.resolve(mockClientCreateResponse(payload));
            }),
          },
        };
        return apiCall(client);
      });

      await clientCreateTool.execute(
        {
          accountId: 'ABC123',
          fName: 'John',
          lName: 'Doe',
          email: 'john@example.com',
          busPhone: '555-1234',
        },
        mockClient as any
      );

      expect(capturedPayload.fName).toBe('John');
      expect(capturedPayload.lName).toBe('Doe');
      expect(capturedPayload.email).toBe('john@example.com');
      expect(capturedPayload.busPhone).toBe('555-1234');
    });
  });

  describe('error handling', () => {
    it('should handle duplicate email error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            create: vi.fn().mockResolvedValue(mockClientDuplicateEmailError('test@example.com')),
          },
        };
        return apiCall(client);
      });

      await expect(
        clientCreateTool.execute(
          { accountId: 'ABC123', email: 'test@example.com' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            create: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        clientCreateTool.execute(
          { accountId: 'ABC123', fName: 'John' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            create: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        clientCreateTool.execute(
          { accountId: 'ABC123', fName: 'John' },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        clientCreateTool.execute({ fName: 'John' } as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should reject invalid email format', async () => {
      await expect(
        clientCreateTool.execute(
          { accountId: 'ABC123', email: 'not-an-email' },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle creating client with unicode characters', async () => {
      const mockResponse = mockClientCreateResponse({
        fName: 'José',
        organization: '日本株式会社',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await clientCreateTool.execute(
        { accountId: 'ABC123', fName: 'José', organization: '日本株式会社' },
        mockClient as any
      );

      expect(result.fName).toBe('José');
      expect(result.organization).toBe('日本株式会社');
    });
  });
});
