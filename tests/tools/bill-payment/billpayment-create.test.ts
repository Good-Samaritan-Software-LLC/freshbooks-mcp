/**
 * Tests for billpayment_create tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { billpaymentCreateTool } from '../../../src/tools/bill-payment/billpayment-create.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockBillPaymentCreateResponse,
  mockBillPaymentValidationError,
  mockBillNotFoundForPaymentError,
} from '../../mocks/responses/bill-payment.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
  mockNetworkTimeoutError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('billpayment_create tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  const validInput = {
    accountId: 'ABC123',
    billId: 5001,
    amount: { amount: '500.00', code: 'USD' },
    paymentType: 'check' as const,
    paidDate: '2024-01-20T00:00:00Z',
  };

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should create a bill payment with required fields', async () => {
      const mockResponse = mockBillPaymentCreateResponse({
        billId: 5001,
        amount: { amount: '500.00', code: 'USD' },
        paymentType: 'check',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billPayments: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billpaymentCreateTool.execute(validInput, mockClient as any);

      expect(result.id).toBe(99999);
      expect(result.billId).toBe(5001);
    });

    it('should create a bill payment with note', async () => {
      const mockResponse = mockBillPaymentCreateResponse({
        note: 'Payment for January services',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billPayments: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billpaymentCreateTool.execute(
        { ...validInput, note: 'Payment for January services' },
        mockClient as any
      );

      expect(result.note).toBe('Payment for January services');
    });

    it('should create bill payment with check payment type', async () => {
      const mockResponse = mockBillPaymentCreateResponse({
        paymentType: 'check',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billPayments: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billpaymentCreateTool.execute(validInput, mockClient as any);

      expect(result.paymentType).toBe('check');
    });

    it('should create bill payment with credit payment type', async () => {
      const mockResponse = mockBillPaymentCreateResponse({
        paymentType: 'credit',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billPayments: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billpaymentCreateTool.execute(
        { ...validInput, paymentType: 'credit' as const },
        mockClient as any
      );

      expect(result.paymentType).toBe('credit');
    });

    it('should create bill payment with bank_transfer payment type', async () => {
      const mockResponse = mockBillPaymentCreateResponse({
        paymentType: 'bank_transfer',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billPayments: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billpaymentCreateTool.execute(
        { ...validInput, paymentType: 'bank_transfer' as const },
        mockClient as any
      );

      expect(result.paymentType).toBe('bank_transfer');
    });

    it('should create bill payment with different currency', async () => {
      const mockResponse = mockBillPaymentCreateResponse({
        amount: { amount: '1000.00', code: 'CAD' },
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billPayments: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billpaymentCreateTool.execute(
        { ...validInput, amount: { amount: '1000.00', code: 'CAD' } },
        mockClient as any
      );

      expect(result.amount.code).toBe('CAD');
    });

    it('should create bill payment with all fields', async () => {
      const fullInput = {
        ...validInput,
        note: 'Complete payment with all details',
      };

      const mockResponse = mockBillPaymentCreateResponse(fullInput);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billPayments: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billpaymentCreateTool.execute(fullInput, mockClient as any);

      expect(result.id).toBe(99999);
      expect(result.note).toBe('Complete payment with all details');
    });
  });

  describe('error handling', () => {
    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billPayments: {
            create: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        billpaymentCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billPayments: {
            create: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        billpaymentCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billPayments: {
            create: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        billpaymentCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());

      await expect(
        billpaymentCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle validation error for invalid amount', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billPayments: {
            create: vi.fn().mockResolvedValue(
              mockBillPaymentValidationError('amount', 'Invalid amount format')
            ),
          },
        };
        return apiCall(client);
      });

      await expect(
        billpaymentCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle bill not found error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billPayments: {
            create: vi.fn().mockResolvedValue(mockBillNotFoundForPaymentError(5001)),
          },
        };
        return apiCall(client);
      });

      await expect(
        billpaymentCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      const { accountId, ...inputWithoutAccount } = validInput;

      await expect(
        billpaymentCreateTool.execute(inputWithoutAccount as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require billId', async () => {
      const { billId, ...inputWithoutBill } = validInput;

      await expect(
        billpaymentCreateTool.execute(inputWithoutBill as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require amount', async () => {
      const { amount, ...inputWithoutAmount } = validInput;

      await expect(
        billpaymentCreateTool.execute(inputWithoutAmount as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require paymentType', async () => {
      const { paymentType, ...inputWithoutType } = validInput;

      await expect(
        billpaymentCreateTool.execute(inputWithoutType as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require paidDate', async () => {
      const { paidDate, ...inputWithoutDate } = validInput;

      await expect(
        billpaymentCreateTool.execute(inputWithoutDate as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should reject invalid date format', async () => {
      await expect(
        billpaymentCreateTool.execute(
          { ...validInput, paidDate: 'invalid-date' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject invalid payment type', async () => {
      await expect(
        billpaymentCreateTool.execute(
          { ...validInput, paymentType: 'invalid_type' as any },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });
});
