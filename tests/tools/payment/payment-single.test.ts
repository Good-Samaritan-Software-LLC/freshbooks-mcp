/**
 * Tests for payment_single tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { paymentSingleTool } from '../../../src/tools/payment/payment-single.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockPaymentSingleResponse,
  mockPaymentNotFoundError,
} from '../../mocks/responses/payment.js';
import {
  mockUnauthorizedError,
  mockServerError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('payment_single tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should return a single payment by ID', async () => {
      const mockResponse = mockPaymentSingleResponse({ id: 12345 });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentSingleTool.execute(
        { accountId: 'ABC123', paymentId: 12345 },
        mockClient as any
      );

      expect(result.id).toBe(12345);
    });

    it('should return payment with all fields populated', async () => {
      const mockResponse = mockPaymentSingleResponse({
        id: 12345,
        invoiceId: 56789,
        type: 'Credit Card',
        amount: { amount: '500.00', code: 'USD' },
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentSingleTool.execute(
        { accountId: 'ABC123', paymentId: 12345 },
        mockClient as any
      );

      expect(result.invoiceId).toBe(56789);
      expect(result.type).toBe('Credit Card');
      expect(result.amount.amount).toBe('500.00');
    });

    it('should pass accountId and paymentId correctly to API', async () => {
      const mockResponse = mockPaymentSingleResponse();
      let capturedAccountId: string = '';
      let capturedPaymentId: string = '';

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            single: vi.fn((accountId, paymentId) => {
              capturedAccountId = accountId;
              capturedPaymentId = paymentId;
              return Promise.resolve(mockResponse);
            }),
          },
        };
        return apiCall(client);
      });

      await paymentSingleTool.execute(
        { accountId: 'ABC123', paymentId: 12345 },
        mockClient as any
      );

      expect(capturedAccountId).toBe('ABC123');
      expect(capturedPaymentId).toBe('12345');
    });
  });

  describe('error handling', () => {
    it('should handle payment not found', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            single: vi.fn().mockResolvedValue(mockPaymentNotFoundError(99999)),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentSingleTool.execute(
          { accountId: 'ABC123', paymentId: 99999 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            single: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentSingleTool.execute(
          { accountId: 'ABC123', paymentId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            single: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentSingleTool.execute(
          { accountId: 'ABC123', paymentId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        paymentSingleTool.execute(
          { paymentId: 12345 } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should require paymentId', async () => {
      await expect(
        paymentSingleTool.execute(
          { accountId: 'ABC123' } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });
});
