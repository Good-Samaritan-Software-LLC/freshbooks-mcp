/**
 * Tests for otherincome_update tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { otherincomeUpdateTool } from '../../../src/tools/other-income/otherincome-update.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockOtherIncomeUpdateResponse,
  mockOtherIncomeNotFoundError,
  mockOtherIncomeValidationError,
} from '../../mocks/responses/other-income.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
  mockNetworkTimeoutError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('otherincome_update tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  const validInput = {
    accountId: 'ABC123',
    incomeId: 12345,
    amount: { amount: '750.00', code: 'USD' },
  };

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should update other income amount', async () => {
      const mockResponse = mockOtherIncomeUpdateResponse(12345, {
        amount: { amount: '750.00', code: 'USD' },
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await otherincomeUpdateTool.execute(validInput, mockClient as any);

      expect(result.incomeId).toBe(12345);
      expect(result.amount).toEqual({ amount: '750.00', code: 'USD' });
    });

    it('should update category name', async () => {
      const mockResponse = mockOtherIncomeUpdateResponse(12345, {
        categoryName: 'Dividend Income',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await otherincomeUpdateTool.execute(
        { ...validInput, categoryName: 'Dividend Income' },
        mockClient as any
      );

      expect(result.categoryName).toBe('Dividend Income');
    });

    it('should update date', async () => {
      const mockResponse = mockOtherIncomeUpdateResponse(12345, {
        date: '2024-02-20T00:00:00Z',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await otherincomeUpdateTool.execute(
        { ...validInput, date: '2024-02-20' },
        mockClient as any
      );

      // API returns full datetime, but input accepts YYYY-MM-DD
      expect(result.date).toBe('2024-02-20T00:00:00Z');
    });

    it('should update payment type', async () => {
      const mockResponse = mockOtherIncomeUpdateResponse(12345, {
        paymentType: 'Check',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await otherincomeUpdateTool.execute(
        { ...validInput, paymentType: 'Check' },
        mockClient as any
      );

      expect(result.paymentType).toBe('Check');
    });

    it('should update note', async () => {
      const mockResponse = mockOtherIncomeUpdateResponse(12345, {
        note: 'Updated: Quarterly interest payment',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await otherincomeUpdateTool.execute(
        { ...validInput, note: 'Updated: Quarterly interest payment' },
        mockClient as any
      );

      expect(result.note).toBe('Updated: Quarterly interest payment');
    });

    it('should update source', async () => {
      const mockResponse = mockOtherIncomeUpdateResponse(12345, {
        source: 'Scotia Bank',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await otherincomeUpdateTool.execute(
        { ...validInput, source: 'Scotia Bank' },
        mockClient as any
      );

      expect(result.source).toBe('Scotia Bank');
    });

    it('should update taxes', async () => {
      const mockResponse = mockOtherIncomeUpdateResponse(12345, {
        taxes: [
          { name: 'GST', amount: '37.50', percent: '5' },
          { name: 'PST', amount: '60.00', percent: '8' },
        ],
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await otherincomeUpdateTool.execute(
        {
          ...validInput,
          taxes: [
            { name: 'GST', amount: '37.50', percent: '5' },
            { name: 'PST', amount: '60.00', percent: '8' },
          ],
        },
        mockClient as any
      );

      expect(result.taxes).toHaveLength(2);
      expect(result.taxes![0].name).toBe('GST');
    });

    it('should update multiple fields at once', async () => {
      const mockResponse = mockOtherIncomeUpdateResponse(12345, {
        amount: { amount: '1200.00', code: 'CAD' },
        categoryName: 'Rebates',
        note: 'Vendor rebate payment',
        paymentType: 'Bank Transfer',
        source: 'ABC Supplier',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await otherincomeUpdateTool.execute(
        {
          accountId: 'ABC123',
          incomeId: 12345,
          amount: { amount: '1200.00', code: 'CAD' },
          categoryName: 'Rebates',
          note: 'Vendor rebate payment',
          paymentType: 'Bank Transfer',
          source: 'ABC Supplier',
        },
        mockClient as any
      );

      expect(result.amount).toEqual({ amount: '1200.00', code: 'CAD' });
      expect(result.categoryName).toBe('Rebates');
      expect(result.note).toBe('Vendor rebate payment');
      expect(result.paymentType).toBe('Bank Transfer');
      expect(result.source).toBe('ABC Supplier');
    });

    it('should clear optional fields by setting to null', async () => {
      const mockResponse = mockOtherIncomeUpdateResponse(12345, {
        note: null,
        source: null,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await otherincomeUpdateTool.execute(
        {
          accountId: 'ABC123',
          incomeId: 12345,
          note: '',
          source: '',
        },
        mockClient as any
      );

      expect(result.note).toBeNull();
      expect(result.source).toBeNull();
    });

    it('should update with different currencies', async () => {
      const currencies = ['USD', 'CAD', 'EUR', 'GBP', 'AUD'];

      for (const currency of currencies) {
        const mockResponse = mockOtherIncomeUpdateResponse(12345, {
          amount: { amount: '1000.00', code: currency },
        });

        mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
          const client = {
            otherIncomes: {
              update: vi.fn().mockResolvedValue(mockResponse),
            },
          };
          return apiCall(client);
        });

        const result = await otherincomeUpdateTool.execute(
          {
            accountId: 'ABC123',
            incomeId: 12345,
            amount: { amount: '1000.00', code: currency },
          },
          mockClient as any
        );

        expect(result.amount.code).toBe(currency);
      }
    });

    it('should update with different payment types', async () => {
      const paymentTypes = ['Cash', 'Check', 'Credit Card', 'PayPal', 'ACH'];

      for (const paymentType of paymentTypes) {
        const mockResponse = mockOtherIncomeUpdateResponse(12345, {
          paymentType,
        });

        mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
          const client = {
            otherIncomes: {
              update: vi.fn().mockResolvedValue(mockResponse),
            },
          };
          return apiCall(client);
        });

        const result = await otherincomeUpdateTool.execute(
          {
            accountId: 'ABC123',
            incomeId: 12345,
            paymentType: paymentType as any,
          },
          mockClient as any
        );

        expect(result.paymentType).toBe(paymentType);
      }
    });
  });

  describe('error handling', () => {
    it('should handle not found error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            update: vi.fn().mockResolvedValue(mockOtherIncomeNotFoundError(99999)),
          },
        };
        return apiCall(client);
      });

      await expect(
        otherincomeUpdateTool.execute(
          { ...validInput, incomeId: 99999 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            update: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        otherincomeUpdateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            update: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        otherincomeUpdateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            update: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        otherincomeUpdateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());

      await expect(
        otherincomeUpdateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle validation error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            update: vi.fn().mockResolvedValue(
              mockOtherIncomeValidationError('amount', 'Amount must be positive')
            ),
          },
        };
        return apiCall(client);
      });

      await expect(
        otherincomeUpdateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      const { accountId, ...inputWithoutAccount } = validInput;

      await expect(
        otherincomeUpdateTool.execute(inputWithoutAccount as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require incomeId', async () => {
      const { incomeId, ...inputWithoutId } = validInput;

      await expect(
        otherincomeUpdateTool.execute(inputWithoutId as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should allow update with only incomeId (no fields to update)', async () => {
      const mockResponse = mockOtherIncomeUpdateResponse(12345, {});

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      // Should not throw even with no update fields
      const result = await otherincomeUpdateTool.execute(
        { accountId: 'ABC123', incomeId: 12345 },
        mockClient as any
      );

      expect(result.incomeId).toBe(12345);
    });

    it('should accept valid input with optional fields', async () => {
      const mockResponse = mockOtherIncomeUpdateResponse(12345, {
        amount: { amount: '750.00', code: 'USD' },
        categoryName: 'Interest Income',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      // Should not throw
      await expect(
        otherincomeUpdateTool.execute(
          {
            accountId: 'ABC123',
            incomeId: 12345,
            amount: { amount: '750.00', code: 'USD' },
            categoryName: 'Interest Income',
          },
          mockClient as any
        )
      ).resolves.toBeDefined();
    });
  });
});
