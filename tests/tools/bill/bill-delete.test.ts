/**
 * Tests for bill_delete tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { billDeleteTool } from '../../../src/tools/bill/bill-delete.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockBillDeleteResponse,
  mockBillNotFoundError,
  mockBillPaymentConflictError,
} from '../../mocks/responses/bill.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
  mockNetworkTimeoutError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('bill_delete tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should delete a bill by ID', async () => {
      const mockResponse = mockBillDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billDeleteTool.execute(
        { accountId: 'ABC123', billId: 12345 },
        mockClient as any
      );

      expect(result.success).toBe(true);
      expect(result.billId).toBe(12345);
    });

    it('should return success with the correct bill ID', async () => {
      const mockResponse = mockBillDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billDeleteTool.execute(
        { accountId: 'XYZ789', billId: 67890 },
        mockClient as any
      );

      expect(result.success).toBe(true);
      expect(result.billId).toBe(67890);
    });

    it('should call API with correct parameters', async () => {
      const mockResponse = mockBillDeleteResponse();
      const deleteFn = vi.fn().mockResolvedValue(mockResponse);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            delete: deleteFn,
          },
        };
        return apiCall(client);
      });

      await billDeleteTool.execute(
        { accountId: 'ABC123', billId: 12345 },
        mockClient as any
      );

      expect(deleteFn).toHaveBeenCalledWith('ABC123', 12345);
    });
  });

  describe('error handling', () => {
    it('should handle not found error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            delete: vi.fn().mockResolvedValue(mockBillNotFoundError(99999)),
          },
        };
        return apiCall(client);
      });

      await expect(
        billDeleteTool.execute(
          { accountId: 'ABC123', billId: 99999 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            delete: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        billDeleteTool.execute(
          { accountId: 'ABC123', billId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            delete: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        billDeleteTool.execute(
          { accountId: 'ABC123', billId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            delete: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        billDeleteTool.execute(
          { accountId: 'ABC123', billId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());

      await expect(
        billDeleteTool.execute(
          { accountId: 'ABC123', billId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle payment conflict error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            delete: vi.fn().mockResolvedValue(mockBillPaymentConflictError(12345)),
          },
        };
        return apiCall(client);
      });

      await expect(
        billDeleteTool.execute(
          { accountId: 'ABC123', billId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        billDeleteTool.execute({ billId: 12345 } as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require billId', async () => {
      await expect(
        billDeleteTool.execute({ accountId: 'ABC123' } as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should reject non-numeric billId', async () => {
      await expect(
        billDeleteTool.execute(
          { accountId: 'ABC123', billId: 'invalid' } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject empty accountId', async () => {
      await expect(
        billDeleteTool.execute(
          { accountId: '', billId: 12345 } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject negative billId', async () => {
      await expect(
        billDeleteTool.execute(
          { accountId: 'ABC123', billId: -1 } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });
});
