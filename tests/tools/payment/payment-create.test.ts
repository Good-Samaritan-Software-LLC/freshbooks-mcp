/**
 * Tests for payment_create tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { paymentCreateTool } from '../../../src/tools/payment/payment-create.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockPaymentCreateResponse,
  mockPaymentValidationError,
} from '../../mocks/responses/payment.js';
import {
  mockUnauthorizedError,
  mockServerError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('payment_create tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  const validInput = {
    accountId: 'ABC123',
    invoiceId: 56789,
    amount: { amount: '500.00', code: 'USD' },
    date: '2024-01-15T00:00:00Z',
    type: 'Credit Card' as const,
  };

  describe('successful operations', () => {
    it('should create a payment with required fields', async () => {
      const mockResponse = mockPaymentCreateResponse({
        invoiceId: 56789,
        amount: { amount: '500.00', code: 'USD' },
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentCreateTool.execute(validInput, mockClient as any);

      expect(result.id).toBe(99999);
    });

    it('should create a payment with optional note', async () => {
      const inputWithNote = {
        ...validInput,
        note: 'Check #1234',
      };

      const mockResponse = mockPaymentCreateResponse({
        note: 'Check #1234',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentCreateTool.execute(inputWithNote, mockClient as any);

      expect(result.id).toBeDefined();
    });

    it('should create a payment with email receipt flag', async () => {
      const inputWithReceipt = {
        ...validInput,
        sendEmailReceipt: true,
      };

      const mockResponse = mockPaymentCreateResponse({
        sendEmailReceipt: true,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentCreateTool.execute(inputWithReceipt, mockClient as any);

      expect(result.id).toBeDefined();
    });

    it('should pass correct payload to API', async () => {
      const mockResponse = mockPaymentCreateResponse();
      let capturedPayload: any = null;
      let capturedAccountId: string = '';

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            create: vi.fn((payload, accountId) => {
              capturedPayload = payload;
              capturedAccountId = accountId;
              return Promise.resolve(mockResponse);
            }),
          },
        };
        return apiCall(client);
      });

      await paymentCreateTool.execute(validInput, mockClient as any);

      expect(capturedAccountId).toBe('ABC123');
      expect(capturedPayload.invoiceid).toBe(56789);
      expect(capturedPayload.amount.amount).toBe('500.00');
    });

    it('should use default payment type when not specified', async () => {
      const inputNoType = {
        accountId: 'ABC123',
        invoiceId: 56789,
        amount: { amount: '500.00', code: 'USD' },
        date: '2024-01-15T00:00:00Z',
      };

      const mockResponse = mockPaymentCreateResponse();
      let capturedPayload: any = null;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            create: vi.fn((payload) => {
              capturedPayload = payload;
              return Promise.resolve(mockResponse);
            }),
          },
        };
        return apiCall(client);
      });

      await paymentCreateTool.execute(inputNoType as any, mockClient as any);

      expect(capturedPayload.type).toBe('Cash');
    });
  });

  describe('error handling', () => {
    it('should handle validation error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            create: vi.fn().mockResolvedValue(
              mockPaymentValidationError('invoiceId', 'Invoice not found')
            ),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            create: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            create: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      const invalidInput = {
        invoiceId: 56789,
        amount: { amount: '500.00', code: 'USD' },
        date: '2024-01-15T00:00:00Z',
      };

      await expect(
        paymentCreateTool.execute(invalidInput as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require invoiceId', async () => {
      const invalidInput = {
        accountId: 'ABC123',
        amount: { amount: '500.00', code: 'USD' },
        date: '2024-01-15T00:00:00Z',
      };

      await expect(
        paymentCreateTool.execute(invalidInput as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require amount', async () => {
      const invalidInput = {
        accountId: 'ABC123',
        invoiceId: 56789,
        date: '2024-01-15T00:00:00Z',
      };

      await expect(
        paymentCreateTool.execute(invalidInput as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require date', async () => {
      const invalidInput = {
        accountId: 'ABC123',
        invoiceId: 56789,
        amount: { amount: '500.00', code: 'USD' },
      };

      await expect(
        paymentCreateTool.execute(invalidInput as any, mockClient as any)
      ).rejects.toThrow();
    });
  });
});
