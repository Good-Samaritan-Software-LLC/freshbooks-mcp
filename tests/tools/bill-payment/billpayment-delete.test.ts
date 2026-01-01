/**
 * Tests for billpayment_delete tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { billpaymentDeleteTool } from '../../../src/tools/bill-payment/billpayment-delete.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockBillPaymentDeleteResponse,
  mockBillPaymentNotFoundError,
} from '../../mocks/responses/bill-payment.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
  mockNetworkTimeoutError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('billpayment_delete tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should delete a bill payment by ID', async () => {
      const mockResponse = mockBillPaymentDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billPayments: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billpaymentDeleteTool.execute(
        { accountId: 'ABC123', billPaymentId: 12345 },
        mockClient as any
      );

      expect(result.success).toBe(true);
      expect(result.billPaymentId).toBe(12345);
    });

    it('should return success with the correct payment ID', async () => {
      const mockResponse = mockBillPaymentDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billPayments: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billpaymentDeleteTool.execute(
        { accountId: 'XYZ789', billPaymentId: 67890 },
        mockClient as any
      );

      expect(result.success).toBe(true);
      expect(result.billPaymentId).toBe(67890);
    });

    it('should call API with correct parameters', async () => {
      const mockResponse = mockBillPaymentDeleteResponse();
      const deleteFn = vi.fn().mockResolvedValue(mockResponse);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billPayments: {
            delete: deleteFn,
          },
        };
        return apiCall(client);
      });

      await billpaymentDeleteTool.execute(
        { accountId: 'ABC123', billPaymentId: 12345 },
        mockClient as any
      );

      expect(deleteFn).toHaveBeenCalledWith('ABC123', 12345);
    });
  });

  describe('error handling', () => {
    it('should handle not found error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billPayments: {
            delete: vi.fn().mockResolvedValue(mockBillPaymentNotFoundError(99999)),
          },
        };
        return apiCall(client);
      });

      await expect(
        billpaymentDeleteTool.execute(
          { accountId: 'ABC123', billPaymentId: 99999 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billPayments: {
            delete: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        billpaymentDeleteTool.execute(
          { accountId: 'ABC123', billPaymentId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billPayments: {
            delete: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        billpaymentDeleteTool.execute(
          { accountId: 'ABC123', billPaymentId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billPayments: {
            delete: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        billpaymentDeleteTool.execute(
          { accountId: 'ABC123', billPaymentId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());

      await expect(
        billpaymentDeleteTool.execute(
          { accountId: 'ABC123', billPaymentId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        billpaymentDeleteTool.execute({ billPaymentId: 12345 } as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require billPaymentId', async () => {
      await expect(
        billpaymentDeleteTool.execute({ accountId: 'ABC123' } as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should reject non-numeric billPaymentId', async () => {
      await expect(
        billpaymentDeleteTool.execute(
          { accountId: 'ABC123', billPaymentId: 'invalid' } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject empty accountId', async () => {
      await expect(
        billpaymentDeleteTool.execute(
          { accountId: '', billPaymentId: 12345 } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject negative billPaymentId', async () => {
      await expect(
        billpaymentDeleteTool.execute(
          { accountId: 'ABC123', billPaymentId: -1 } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });
});
