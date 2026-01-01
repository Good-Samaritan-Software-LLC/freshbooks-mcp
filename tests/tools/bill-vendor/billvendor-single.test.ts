/**
 * Tests for billvendor_single tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { billvendorSingleTool } from '../../../src/tools/bill-vendor/billvendor-single.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockVendorSingleResponse,
  mockVendorNotFoundError,
} from '../../mocks/responses/bill-vendor.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
  mockNetworkTimeoutError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('billvendor_single tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should retrieve a vendor by ID', async () => {
      const mockResponse = mockVendorSingleResponse({ id: 12345 });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billvendorSingleTool.execute(
        { accountId: 'ABC123', vendorId: 12345 },
        mockClient as any
      );

      expect(result.id).toBe(12345);
    });

    it('should return complete vendor details', async () => {
      const mockResponse = mockVendorSingleResponse({
        id: 12345,
        vendorName: 'Acme Supplies',
        email: 'vendor@acme.com',
        phone: '555-123-4567',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billvendorSingleTool.execute(
        { accountId: 'ABC123', vendorId: 12345 },
        mockClient as any
      );

      expect(result.id).toBe(12345);
      expect(result.vendorName).toBe('Acme Supplies');
      expect(result.email).toBe('vendor@acme.com');
      expect(result.phone).toBe('555-123-4567');
    });

    it('should return vendor with address details', async () => {
      const mockResponse = mockVendorSingleResponse({
        address: '123 Main St',
        city: 'New York',
        province: 'NY',
        postalCode: '10001',
        country: 'United States',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billvendorSingleTool.execute(
        { accountId: 'ABC123', vendorId: 12345 },
        mockClient as any
      );

      expect(result.address).toBe('123 Main St');
      expect(result.city).toBe('New York');
      expect(result.province).toBe('NY');
    });

    it('should return vendor with tax information', async () => {
      const mockResponse = mockVendorSingleResponse({
        taxNumber: '12-3456789',
        is1099: true,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billvendorSingleTool.execute(
        { accountId: 'ABC123', vendorId: 12345 },
        mockClient as any
      );

      expect(result.taxNumber).toBe('12-3456789');
      expect(result.is1099).toBe(true);
    });

    it('should return vendor with currency code', async () => {
      const mockResponse = mockVendorSingleResponse({
        currencyCode: 'CAD',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billvendorSingleTool.execute(
        { accountId: 'ABC123', vendorId: 12345 },
        mockClient as any
      );

      expect(result.currencyCode).toBe('CAD');
    });
  });

  describe('error handling', () => {
    it('should handle not found error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            single: vi.fn().mockResolvedValue(mockVendorNotFoundError(99999)),
          },
        };
        return apiCall(client);
      });

      await expect(
        billvendorSingleTool.execute(
          { accountId: 'ABC123', vendorId: 99999 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            single: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        billvendorSingleTool.execute(
          { accountId: 'ABC123', vendorId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            single: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        billvendorSingleTool.execute(
          { accountId: 'ABC123', vendorId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            single: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        billvendorSingleTool.execute(
          { accountId: 'ABC123', vendorId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());

      await expect(
        billvendorSingleTool.execute(
          { accountId: 'ABC123', vendorId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        billvendorSingleTool.execute({ vendorId: 12345 } as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require vendorId', async () => {
      await expect(
        billvendorSingleTool.execute({ accountId: 'ABC123' } as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should reject non-numeric vendorId', async () => {
      await expect(
        billvendorSingleTool.execute(
          { accountId: 'ABC123', vendorId: 'invalid' } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });
});
