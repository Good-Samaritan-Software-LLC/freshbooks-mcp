/**
 * Tests for billvendor_delete tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { billvendorDeleteTool } from '../../../src/tools/bill-vendor/billvendor-delete.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockVendorDeleteResponse,
  mockVendorNotFoundError,
  mockVendorHasBillsError,
} from '../../mocks/responses/bill-vendor.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
  mockNetworkTimeoutError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('billvendor_delete tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should delete a vendor by ID', async () => {
      const mockResponse = mockVendorDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billvendorDeleteTool.execute(
        { accountId: 'ABC123', vendorId: 12345 },
        mockClient as any
      );

      expect(result.success).toBe(true);
      expect(result.vendorId).toBe(12345);
    });

    it('should return success with the correct vendor ID', async () => {
      const mockResponse = mockVendorDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billvendorDeleteTool.execute(
        { accountId: 'XYZ789', vendorId: 67890 },
        mockClient as any
      );

      expect(result.success).toBe(true);
      expect(result.vendorId).toBe(67890);
    });

    it('should call API with correct parameters', async () => {
      const mockResponse = mockVendorDeleteResponse();
      const deleteFn = vi.fn().mockResolvedValue(mockResponse);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            delete: deleteFn,
          },
        };
        return apiCall(client);
      });

      await billvendorDeleteTool.execute(
        { accountId: 'ABC123', vendorId: 12345 },
        mockClient as any
      );

      expect(deleteFn).toHaveBeenCalledWith('ABC123', 12345);
    });
  });

  describe('error handling', () => {
    it('should handle not found error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            delete: vi.fn().mockResolvedValue(mockVendorNotFoundError(99999)),
          },
        };
        return apiCall(client);
      });

      await expect(
        billvendorDeleteTool.execute(
          { accountId: 'ABC123', vendorId: 99999 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            delete: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        billvendorDeleteTool.execute(
          { accountId: 'ABC123', vendorId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            delete: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        billvendorDeleteTool.execute(
          { accountId: 'ABC123', vendorId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            delete: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        billvendorDeleteTool.execute(
          { accountId: 'ABC123', vendorId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());

      await expect(
        billvendorDeleteTool.execute(
          { accountId: 'ABC123', vendorId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle vendor has bills error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            delete: vi.fn().mockResolvedValue(mockVendorHasBillsError(12345)),
          },
        };
        return apiCall(client);
      });

      await expect(
        billvendorDeleteTool.execute(
          { accountId: 'ABC123', vendorId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        billvendorDeleteTool.execute({ vendorId: 12345 } as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require vendorId', async () => {
      await expect(
        billvendorDeleteTool.execute({ accountId: 'ABC123' } as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should reject non-numeric vendorId', async () => {
      await expect(
        billvendorDeleteTool.execute(
          { accountId: 'ABC123', vendorId: 'invalid' } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject empty accountId', async () => {
      await expect(
        billvendorDeleteTool.execute(
          { accountId: '', vendorId: 12345 } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject negative vendorId', async () => {
      await expect(
        billvendorDeleteTool.execute(
          { accountId: 'ABC123', vendorId: -1 } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });
});
