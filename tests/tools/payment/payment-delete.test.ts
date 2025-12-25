/**
 * Tests for payment_delete tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { paymentDeleteTool } from '../../../src/tools/payment/payment-delete.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockPaymentDeleteResponse,
  mockPaymentNotFoundError,
} from '../../mocks/responses/payment.js';
import {
  mockUnauthorizedError,
  mockServerError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('payment_delete tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should delete a payment successfully', async () => {
      const mockResponse = mockPaymentDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentDeleteTool.execute(
        { accountId: 'ABC123', paymentId: 12345 },
        mockClient as any
      );

      expect(result.success).toBe(true);
      expect(result.paymentId).toBe(12345);
    });

    it('should pass correct parameters to API', async () => {
      const mockResponse = mockPaymentDeleteResponse();
      let capturedAccountId: string = '';
      let capturedPaymentId: string = '';

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            delete: vi.fn((accountId, paymentId) => {
              capturedAccountId = accountId;
              capturedPaymentId = paymentId;
              return Promise.resolve(mockResponse);
            }),
          },
        };
        return apiCall(client);
      });

      await paymentDeleteTool.execute(
        { accountId: 'ABC123', paymentId: 12345 },
        mockClient as any
      );

      expect(capturedAccountId).toBe('ABC123');
      expect(capturedPaymentId).toBe('12345');
    });

    it('should handle deletion of different payment IDs', async () => {
      const mockResponse = mockPaymentDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const paymentIds = [1, 12345, 99999, 1000000];

      for (const paymentId of paymentIds) {
        const result = await paymentDeleteTool.execute(
          { accountId: 'ABC123', paymentId },
          mockClient as any
        );

        expect(result.success).toBe(true);
        expect(result.paymentId).toBe(paymentId);
      }
    });
  });

  describe('error handling', () => {
    it('should handle payment not found', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            delete: vi.fn().mockResolvedValue(mockPaymentNotFoundError(99999)),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentDeleteTool.execute(
          { accountId: 'ABC123', paymentId: 99999 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            delete: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentDeleteTool.execute(
          { accountId: 'ABC123', paymentId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            delete: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentDeleteTool.execute(
          { accountId: 'ABC123', paymentId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        paymentDeleteTool.execute(
          { paymentId: 12345 } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should require paymentId', async () => {
      await expect(
        paymentDeleteTool.execute(
          { accountId: 'ABC123' } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle concurrent delete attempts', async () => {
      const mockResponse = mockPaymentDeleteResponse();
      let callCount = 0;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            delete: vi.fn(() => {
              callCount++;
              return Promise.resolve(mockResponse);
            }),
          },
        };
        return apiCall(client);
      });

      const promises = [
        paymentDeleteTool.execute({ accountId: 'ABC123', paymentId: 12345 }, mockClient as any),
        paymentDeleteTool.execute({ accountId: 'ABC123', paymentId: 12346 }, mockClient as any),
        paymentDeleteTool.execute({ accountId: 'ABC123', paymentId: 12347 }, mockClient as any),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });
  });
});
