/**
 * Tests for otherincome_create tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { otherincomeCreateTool } from '../../../src/tools/other-income/otherincome-create.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockOtherIncomeCreateResponse,
  mockOtherIncomeValidationError,
} from '../../mocks/responses/other-income.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
  mockNetworkTimeoutError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('otherincome_create tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  const validInput = {
    accountId: 'ABC123',
    amount: { amount: '500.00', code: 'USD' },
    categoryName: 'Interest Income',
    date: '2024-01-15T00:00:00Z',
  };

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should create other income with required fields only', async () => {
      const mockResponse = mockOtherIncomeCreateResponse({
        amount: { amount: '500.00', code: 'USD' },
        categoryName: 'Interest Income',
        date: '2024-01-15T00:00:00Z',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await otherincomeCreateTool.execute(validInput, mockClient as any);

      expect(result.incomeId).toBe(99999);
      expect(result.categoryName).toBe('Interest Income');
      expect(result.amount).toEqual({ amount: '500.00', code: 'USD' });
    });

    it('should create other income with all optional fields', async () => {
      const mockResponse = mockOtherIncomeCreateResponse({
        amount: { amount: '1000.00', code: 'CAD' },
        categoryName: 'Dividend Income',
        date: '2024-02-15T00:00:00Z',
        paymentType: 'Bank Transfer',
        note: 'Quarterly dividend payment',
        source: 'Investment Account',
        taxes: [{ name: 'Withholding Tax', amount: '150.00', percent: '15' }],
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await otherincomeCreateTool.execute(
        {
          ...validInput,
          amount: { amount: '1000.00', code: 'CAD' },
          categoryName: 'Dividend Income',
          paymentType: 'Bank Transfer',
          note: 'Quarterly dividend payment',
          source: 'Investment Account',
          taxes: [{ name: 'Withholding Tax', amount: '150.00', percent: '15' }],
        },
        mockClient as any
      );

      expect(result.incomeId).toBeDefined();
      expect(result.note).toBe('Quarterly dividend payment');
      expect(result.source).toBe('Investment Account');
      expect(result.paymentType).toBe('Bank Transfer');
      expect(result.taxes).toHaveLength(1);
    });

    it('should create other income with note', async () => {
      const mockResponse = mockOtherIncomeCreateResponse({
        note: 'Bank interest for January',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await otherincomeCreateTool.execute(
        { ...validInput, note: 'Bank interest for January' },
        mockClient as any
      );

      expect(result.note).toBe('Bank interest for January');
    });

    it('should create other income with source', async () => {
      const mockResponse = mockOtherIncomeCreateResponse({
        source: 'TD Bank Savings Account',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await otherincomeCreateTool.execute(
        { ...validInput, source: 'TD Bank Savings Account' },
        mockClient as any
      );

      expect(result.source).toBe('TD Bank Savings Account');
    });

    it('should create other income with different payment types', async () => {
      const paymentTypes = ['Cash', 'Check', 'Credit Card', 'PayPal', 'Bank Transfer'];

      for (const paymentType of paymentTypes) {
        const mockResponse = mockOtherIncomeCreateResponse({ paymentType });

        mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
          const client = {
            otherIncomes: {
              create: vi.fn().mockResolvedValue(mockResponse),
            },
          };
          return apiCall(client);
        });

        const result = await otherincomeCreateTool.execute(
          { ...validInput, paymentType: paymentType as any },
          mockClient as any
        );

        expect(result.paymentType).toBe(paymentType);
      }
    });

    it('should create other income with different currencies', async () => {
      const currencies = ['USD', 'CAD', 'EUR', 'GBP', 'AUD'];

      for (const currency of currencies) {
        const mockResponse = mockOtherIncomeCreateResponse({
          amount: { amount: '1000.00', code: currency },
        });

        mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
          const client = {
            otherIncomes: {
              create: vi.fn().mockResolvedValue(mockResponse),
            },
          };
          return apiCall(client);
        });

        const result = await otherincomeCreateTool.execute(
          { ...validInput, amount: { amount: '1000.00', code: currency } },
          mockClient as any
        );

        expect(result.amount.code).toBe(currency);
      }
    });

    it('should create other income with single tax', async () => {
      const mockResponse = mockOtherIncomeCreateResponse({
        taxes: [{ name: 'GST', amount: '25.00', percent: '5' }],
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await otherincomeCreateTool.execute(
        {
          ...validInput,
          taxes: [{ name: 'GST', amount: '25.00', percent: '5' }],
        },
        mockClient as any
      );

      expect(result.taxes).toHaveLength(1);
      expect(result.taxes![0].name).toBe('GST');
    });

    it('should create other income with multiple taxes', async () => {
      const mockResponse = mockOtherIncomeCreateResponse({
        taxes: [
          { name: 'GST', amount: '25.00', percent: '5' },
          { name: 'PST', amount: '40.00', percent: '8' },
        ],
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await otherincomeCreateTool.execute(
        {
          ...validInput,
          taxes: [
            { name: 'GST', amount: '25.00', percent: '5' },
            { name: 'PST', amount: '40.00', percent: '8' },
          ],
        },
        mockClient as any
      );

      expect(result.taxes).toHaveLength(2);
      expect(result.taxes![0].name).toBe('GST');
      expect(result.taxes![1].name).toBe('PST');
    });

    it('should create other income with tax without percent', async () => {
      const mockResponse = mockOtherIncomeCreateResponse({
        taxes: [{ name: 'Fixed Tax', amount: '50.00' }],
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await otherincomeCreateTool.execute(
        {
          ...validInput,
          taxes: [{ name: 'Fixed Tax', amount: '50.00' }],
        },
        mockClient as any
      );

      expect(result.taxes).toHaveLength(1);
      expect(result.taxes![0].name).toBe('Fixed Tax');
    });

    it('should create other income with different category names', async () => {
      const categories = ['Interest Income', 'Dividend Income', 'Rebates', 'Other Revenue'];

      for (const category of categories) {
        const mockResponse = mockOtherIncomeCreateResponse({ categoryName: category });

        mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
          const client = {
            otherIncomes: {
              create: vi.fn().mockResolvedValue(mockResponse),
            },
          };
          return apiCall(client);
        });

        const result = await otherincomeCreateTool.execute(
          { ...validInput, categoryName: category },
          mockClient as any
        );

        expect(result.categoryName).toBe(category);
      }
    });
  });

  describe('error handling', () => {
    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            create: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        otherincomeCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            create: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        otherincomeCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            create: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        otherincomeCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());

      await expect(
        otherincomeCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle validation error for missing amount', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            create: vi.fn().mockResolvedValue(
              mockOtherIncomeValidationError('amount', 'Amount is required')
            ),
          },
        };
        return apiCall(client);
      });

      await expect(
        otherincomeCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle validation error for invalid category', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            create: vi.fn().mockResolvedValue(
              mockOtherIncomeValidationError('categoryName', 'Invalid category name')
            ),
          },
        };
        return apiCall(client);
      });

      await expect(
        otherincomeCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      const { accountId, ...inputWithoutAccount } = validInput;

      await expect(
        otherincomeCreateTool.execute(inputWithoutAccount as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require amount', async () => {
      const { amount, ...inputWithoutAmount } = validInput;

      await expect(
        otherincomeCreateTool.execute(inputWithoutAmount as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require categoryName', async () => {
      const { categoryName, ...inputWithoutCategory } = validInput;

      await expect(
        otherincomeCreateTool.execute(inputWithoutCategory as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require date', async () => {
      const { date, ...inputWithoutDate } = validInput;

      await expect(
        otherincomeCreateTool.execute(inputWithoutDate as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should accept valid input with all required fields', async () => {
      const mockResponse = mockOtherIncomeCreateResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      // Should not throw
      await expect(
        otherincomeCreateTool.execute(validInput, mockClient as any)
      ).resolves.toBeDefined();
    });
  });
});
