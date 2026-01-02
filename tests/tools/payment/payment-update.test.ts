/**
 * Tests for payment_update tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { paymentUpdateTool } from '../../../src/tools/payment/payment-update.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockPaymentUpdateResponse,
  mockPaymentNotFoundError,
  mockPaymentValidationError,
} from '../../mocks/responses/payment.js';
import {
  mockUnauthorizedError,
  mockServerError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('payment_update tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should update payment amount', async () => {
      const mockResponse = mockPaymentUpdateResponse(12345, {
        amount: { amount: '600.00', code: 'USD' },
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentUpdateTool.execute(
        { accountId: 'ABC123', paymentId: 12345, amount: { amount: '600.00', code: 'USD' } },
        mockClient as any
      );

      expect(result.id).toBe(12345);
    });

    it('should update payment date', async () => {
      const mockResponse = mockPaymentUpdateResponse(12345, {
        date: '2024-02-15T00:00:00Z',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentUpdateTool.execute(
        { accountId: 'ABC123', paymentId: 12345, date: '2024-02-15' },
        mockClient as any
      );

      expect(result.id).toBe(12345);
    });

    it('should update payment type', async () => {
      const mockResponse = mockPaymentUpdateResponse(12345, {
        type: 'Check',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentUpdateTool.execute(
        { accountId: 'ABC123', paymentId: 12345, type: 'Check' },
        mockClient as any
      );

      expect(result.id).toBe(12345);
    });

    it('should update payment note', async () => {
      const mockResponse = mockPaymentUpdateResponse(12345, {
        note: 'Updated note',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentUpdateTool.execute(
        { accountId: 'ABC123', paymentId: 12345, note: 'Updated note' },
        mockClient as any
      );

      expect(result.id).toBe(12345);
    });

    it('should update multiple fields at once', async () => {
      const mockResponse = mockPaymentUpdateResponse(12345, {
        amount: { amount: '600.00', code: 'USD' },
        type: 'Check',
        note: 'Updated',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentUpdateTool.execute(
        {
          accountId: 'ABC123',
          paymentId: 12345,
          amount: { amount: '600.00', code: 'USD' },
          type: 'Check',
          note: 'Updated',
        },
        mockClient as any
      );

      expect(result.id).toBe(12345);
    });

    it('should pass correct parameters to API', async () => {
      const mockResponse = mockPaymentUpdateResponse(12345);
      let capturedAccountId: string = '';
      let capturedPaymentId: string = '';
      let capturedUpdates: any = null;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            update: vi.fn((accountId, paymentId, updates) => {
              capturedAccountId = accountId;
              capturedPaymentId = paymentId;
              capturedUpdates = updates;
              return Promise.resolve(mockResponse);
            }),
          },
        };
        return apiCall(client);
      });

      await paymentUpdateTool.execute(
        { accountId: 'ABC123', paymentId: 12345, note: 'Test' },
        mockClient as any
      );

      expect(capturedAccountId).toBe('ABC123');
      expect(capturedPaymentId).toBe('12345');
      expect(capturedUpdates.note).toBe('Test');
    });
  });

  describe('error handling', () => {
    it('should handle payment not found', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            update: vi.fn().mockResolvedValue(mockPaymentNotFoundError(99999)),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentUpdateTool.execute(
          { accountId: 'ABC123', paymentId: 99999, note: 'Test' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle validation error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            update: vi.fn().mockResolvedValue(
              mockPaymentValidationError('amount', 'Invalid amount')
            ),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentUpdateTool.execute(
          { accountId: 'ABC123', paymentId: 12345, amount: { amount: '-100', code: 'USD' } },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            update: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentUpdateTool.execute(
          { accountId: 'ABC123', paymentId: 12345, note: 'Test' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            update: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentUpdateTool.execute(
          { accountId: 'ABC123', paymentId: 12345, note: 'Test' },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        paymentUpdateTool.execute(
          { paymentId: 12345, note: 'Test' } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should require paymentId', async () => {
      await expect(
        paymentUpdateTool.execute(
          { accountId: 'ABC123', note: 'Test' } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });
});
