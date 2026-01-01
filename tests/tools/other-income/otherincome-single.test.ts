/**
 * Tests for otherincome_single tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { otherincomeSingleTool } from '../../../src/tools/other-income/otherincome-single.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockOtherIncomeSingleResponse,
  mockOtherIncomeNotFoundError,
} from '../../mocks/responses/other-income.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
  mockNetworkTimeoutError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('otherincome_single tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should return a single other income entry by ID', async () => {
      const mockResponse = mockOtherIncomeSingleResponse({
        incomeId: 12345,
        categoryName: 'Interest Income',
        amount: { amount: '500.00', code: 'USD' },
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await otherincomeSingleTool.execute(
        { accountId: 'ABC123', incomeId: 12345 },
        mockClient as any
      );

      expect(result.incomeId).toBe(12345);
      expect(result.categoryName).toBe('Interest Income');
      expect(result.amount).toEqual({ amount: '500.00', code: 'USD' });
    });

    it('should return other income with all fields populated', async () => {
      const mockResponse = mockOtherIncomeSingleResponse({
        incomeId: 67890,
        amount: { amount: '1000.00', code: 'CAD' },
        categoryName: 'Dividend Income',
        date: '2024-02-15T00:00:00Z',
        note: 'Quarterly dividend payment',
        paymentType: 'Bank Transfer',
        source: 'Investment Account',
        taxes: [
          { name: 'Withholding Tax', amount: '150.00', percent: '15' },
        ],
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await otherincomeSingleTool.execute(
        { accountId: 'ABC123', incomeId: 67890 },
        mockClient as any
      );

      expect(result.incomeId).toBe(67890);
      expect(result.categoryName).toBe('Dividend Income');
      expect(result.note).toBe('Quarterly dividend payment');
      expect(result.source).toBe('Investment Account');
      expect(result.taxes).toHaveLength(1);
      expect(result.taxes![0].name).toBe('Withholding Tax');
    });

    it('should return other income with null optional fields', async () => {
      const mockResponse = mockOtherIncomeSingleResponse({
        incomeId: 11111,
        note: null,
        source: null,
        taxes: [],
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await otherincomeSingleTool.execute(
        { accountId: 'ABC123', incomeId: 11111 },
        mockClient as any
      );

      expect(result.note).toBeNull();
      expect(result.source).toBeNull();
      expect(result.taxes).toEqual([]);
    });

    it('should return other income with different payment types', async () => {
      const paymentTypes = ['Cash', 'Check', 'Credit Card', 'PayPal', 'ACH'];

      for (const paymentType of paymentTypes) {
        const mockResponse = mockOtherIncomeSingleResponse({
          incomeId: 12345,
          paymentType,
        });

        mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
          const client = {
            otherIncomes: {
              single: vi.fn().mockResolvedValue(mockResponse),
            },
          };
          return apiCall(client);
        });

        const result = await otherincomeSingleTool.execute(
          { accountId: 'ABC123', incomeId: 12345 },
          mockClient as any
        );

        expect(result.paymentType).toBe(paymentType);
      }
    });

    it('should return other income with different currencies', async () => {
      const currencies = ['USD', 'CAD', 'EUR', 'GBP', 'AUD'];

      for (const currency of currencies) {
        const mockResponse = mockOtherIncomeSingleResponse({
          incomeId: 12345,
          amount: { amount: '1000.00', code: currency },
        });

        mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
          const client = {
            otherIncomes: {
              single: vi.fn().mockResolvedValue(mockResponse),
            },
          };
          return apiCall(client);
        });

        const result = await otherincomeSingleTool.execute(
          { accountId: 'ABC123', incomeId: 12345 },
          mockClient as any
        );

        expect(result.amount.code).toBe(currency);
      }
    });

    it('should return other income with multiple taxes', async () => {
      const mockResponse = mockOtherIncomeSingleResponse({
        incomeId: 12345,
        taxes: [
          { name: 'GST', amount: '50.00', percent: '5' },
          { name: 'PST', amount: '80.00', percent: '8' },
          { name: 'HST', amount: '130.00', percent: '13' },
        ],
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await otherincomeSingleTool.execute(
        { accountId: 'ABC123', incomeId: 12345 },
        mockClient as any
      );

      expect(result.taxes).toHaveLength(3);
      expect(result.taxes![0].name).toBe('GST');
      expect(result.taxes![1].name).toBe('PST');
      expect(result.taxes![2].name).toBe('HST');
    });
  });

  describe('error handling', () => {
    it('should handle not found error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            single: vi.fn().mockResolvedValue(mockOtherIncomeNotFoundError(99999)),
          },
        };
        return apiCall(client);
      });

      await expect(
        otherincomeSingleTool.execute(
          { accountId: 'ABC123', incomeId: 99999 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            single: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        otherincomeSingleTool.execute(
          { accountId: 'ABC123', incomeId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            single: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        otherincomeSingleTool.execute(
          { accountId: 'ABC123', incomeId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            single: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        otherincomeSingleTool.execute(
          { accountId: 'ABC123', incomeId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());

      await expect(
        otherincomeSingleTool.execute(
          { accountId: 'ABC123', incomeId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        otherincomeSingleTool.execute(
          { incomeId: 12345 } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should require incomeId', async () => {
      await expect(
        otherincomeSingleTool.execute(
          { accountId: 'ABC123' } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject non-numeric incomeId', async () => {
      await expect(
        otherincomeSingleTool.execute(
          { accountId: 'ABC123', incomeId: 'invalid' as any },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should accept valid input', async () => {
      const mockResponse = mockOtherIncomeSingleResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      // Should not throw
      await expect(
        otherincomeSingleTool.execute(
          { accountId: 'ABC123', incomeId: 12345 },
          mockClient as any
        )
      ).resolves.toBeDefined();
    });
  });
});
