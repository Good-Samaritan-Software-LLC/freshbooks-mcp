/**
 * Tests for report_profit_loss tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { profitLossReportTool } from '../../../src/tools/report/report-profit-loss.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockProfitLossReportResponse,
  mockZeroProfitLossReportResponse,
  mockProfitLossReportWithLossResponse,
} from '../../mocks/responses/report.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
  mockNetworkTimeoutError,
  mockInvalidAccountError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('report_profit_loss tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should return profit/loss report with positive net income', async () => {
      const mockResponse = mockProfitLossReportResponse(5000, 3000, '2024-01-01', '2024-01-31');

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            profitLoss: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await profitLossReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        mockClient as any
      );

      expect(result.startDate).toBe('2024-01-01');
      expect(result.endDate).toBe('2024-01-31');
      expect(result.revenue.amount).toBe('5000.00');
      expect(result.expenses.amount).toBe('3000.00');
      expect(result.netIncome.amount).toBe('2000.00');
      expect(result.revenue.code).toBe('USD');
    });

    it('should return profit/loss report with negative net income (loss)', async () => {
      const mockResponse = mockProfitLossReportWithLossResponse(2000, 3000, '2024-01-01', '2024-01-31');

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            profitLoss: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await profitLossReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        mockClient as any
      );

      expect(result.revenue.amount).toBe('2000.00');
      expect(result.expenses.amount).toBe('3000.00');
      expect(result.netIncome.amount).toBe('-1000.00');
    });

    it('should return zero profit/loss when no activity', async () => {
      const mockResponse = mockZeroProfitLossReportResponse('2024-01-01', '2024-01-31');

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            profitLoss: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await profitLossReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        mockClient as any
      );

      expect(result.revenue.amount).toBe('0.00');
      expect(result.expenses.amount).toBe('0.00');
      expect(result.netIncome.amount).toBe('0.00');
    });

    it('should include detailed line items when available', async () => {
      const mockResponse = mockProfitLossReportResponse(10000, 7000, '2024-01-01', '2024-01-31', true);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            profitLoss: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await profitLossReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        mockClient as any
      );

      expect(result.lines).toBeDefined();
      expect(result.lines!.length).toBeGreaterThan(0);

      // Check for revenue category
      const revenueCategory = result.lines!.find((line: any) => line.category === 'Revenue');
      expect(revenueCategory).toBeDefined();
      expect(revenueCategory?.children).toBeDefined();

      // Check for expenses category
      const expensesCategory = result.lines!.find((line: any) => line.category === 'Expenses');
      expect(expensesCategory).toBeDefined();
      expect(expensesCategory?.children).toBeDefined();
    });

    it('should handle single day date range', async () => {
      const mockResponse = mockProfitLossReportResponse(1000, 500, '2024-01-15', '2024-01-15');

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            profitLoss: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await profitLossReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-15',
          endDate: '2024-01-15',
        },
        mockClient as any
      );

      expect(result.startDate).toBe('2024-01-15');
      expect(result.endDate).toBe('2024-01-15');
      expect(result.revenue.amount).toBe('1000.00');
    });

    it('should handle full year date range', async () => {
      const mockResponse = mockProfitLossReportResponse(120000, 85000, '2024-01-01', '2024-12-31');

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            profitLoss: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await profitLossReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        },
        mockClient as any
      );

      expect(result.startDate).toBe('2024-01-01');
      expect(result.endDate).toBe('2024-12-31');
      expect(result.revenue.amount).toBe('120000.00');
      expect(result.netIncome.amount).toBe('35000.00');
    });

    it('should handle quarterly date range', async () => {
      const mockResponse = mockProfitLossReportResponse(30000, 20000, '2024-01-01', '2024-03-31');

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            profitLoss: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await profitLossReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-01',
          endDate: '2024-03-31',
        },
        mockClient as any
      );

      expect(result.revenue.amount).toBe('30000.00');
      expect(result.expenses.amount).toBe('20000.00');
      expect(result.netIncome.amount).toBe('10000.00');
    });

    it('should handle revenue-only scenario (no expenses)', async () => {
      const mockResponse = mockProfitLossReportResponse(5000, 0, '2024-01-01', '2024-01-31');

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            profitLoss: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await profitLossReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        mockClient as any
      );

      expect(result.revenue.amount).toBe('5000.00');
      expect(result.expenses.amount).toBe('0.00');
      expect(result.netIncome.amount).toBe('5000.00');
    });

    it('should handle expenses-only scenario (no revenue)', async () => {
      const mockResponse = mockProfitLossReportResponse(0, 3000, '2024-01-01', '2024-01-31');

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            profitLoss: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await profitLossReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        mockClient as any
      );

      expect(result.revenue.amount).toBe('0.00');
      expect(result.expenses.amount).toBe('3000.00');
      expect(result.netIncome.amount).toBe('-3000.00');
    });
  });

  describe('error handling', () => {
    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            profitLoss: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        profitLossReportTool.execute(
          {
            accountId: 'ABC123',
            startDate: '2024-01-01',
            endDate: '2024-01-31',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            profitLoss: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        profitLossReportTool.execute(
          {
            accountId: 'ABC123',
            startDate: '2024-01-01',
            endDate: '2024-01-31',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            profitLoss: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        profitLossReportTool.execute(
          {
            accountId: 'ABC123',
            startDate: '2024-01-01',
            endDate: '2024-01-31',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());

      await expect(
        profitLossReportTool.execute(
          {
            accountId: 'ABC123',
            startDate: '2024-01-01',
            endDate: '2024-01-31',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle invalid account error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            profitLoss: vi.fn().mockResolvedValue(mockInvalidAccountError('ABC123')),
          },
        };
        return apiCall(client);
      });

      await expect(
        profitLossReportTool.execute(
          {
            accountId: 'ABC123',
            startDate: '2024-01-01',
            endDate: '2024-01-31',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        profitLossReportTool.execute(
          {
            startDate: '2024-01-01',
            endDate: '2024-01-31',
          } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should require startDate', async () => {
      await expect(
        profitLossReportTool.execute(
          {
            accountId: 'ABC123',
            endDate: '2024-01-31',
          } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should require endDate', async () => {
      await expect(
        profitLossReportTool.execute(
          {
            accountId: 'ABC123',
            startDate: '2024-01-01',
          } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject invalid date format for startDate', async () => {
      await expect(
        profitLossReportTool.execute(
          {
            accountId: 'ABC123',
            startDate: 'invalid-date',
            endDate: '2024-01-31',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject invalid date format for endDate', async () => {
      await expect(
        profitLossReportTool.execute(
          {
            accountId: 'ABC123',
            startDate: '2024-01-01',
            endDate: 'not-a-date',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject startDate after endDate', async () => {
      await expect(
        profitLossReportTool.execute(
          {
            accountId: 'ABC123',
            startDate: '2024-12-31',
            endDate: '2024-01-01',
          },
          mockClient as any
        )
      ).rejects.toThrow(/start date must be before or equal to end date/i);
    });

    it('should accept dates in correct YYYY-MM-DD format', async () => {
      const mockResponse = mockProfitLossReportResponse(1000, 500, '2024-01-01', '2024-01-31');

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            profitLoss: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      // Should not throw
      await expect(
        profitLossReportTool.execute(
          {
            accountId: 'ABC123',
            startDate: '2024-01-01',
            endDate: '2024-01-31',
          },
          mockClient as any
        )
      ).resolves.toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle leap year dates', async () => {
      const mockResponse = mockProfitLossReportResponse(1000, 500, '2024-02-29', '2024-02-29');

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            profitLoss: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await profitLossReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-02-29',
          endDate: '2024-02-29',
        },
        mockClient as any
      );

      expect(result.startDate).toBe('2024-02-29');
    });

    it('should handle year boundary dates', async () => {
      const mockResponse = mockProfitLossReportResponse(5000, 3000, '2023-12-31', '2024-01-01');

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            profitLoss: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await profitLossReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2023-12-31',
          endDate: '2024-01-01',
        },
        mockClient as any
      );

      expect(result.revenue.amount).toBe('5000.00');
    });

    it('should handle very large revenue amounts', async () => {
      const mockResponse = mockProfitLossReportResponse(9999999, 5000000, '2024-01-01', '2024-12-31');

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            profitLoss: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await profitLossReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        },
        mockClient as any
      );

      expect(result.revenue.amount).toBe('9999999.00');
      expect(result.netIncome.amount).toBe('4999999.00');
    });

    it('should handle very large loss amounts', async () => {
      const mockResponse = mockProfitLossReportWithLossResponse(100000, 5000000, '2024-01-01', '2024-12-31');

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            profitLoss: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await profitLossReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        },
        mockClient as any
      );

      expect(result.expenses.amount).toBe('5000000.00');
      expect(result.netIncome.amount).toBe('-4900000.00');
    });

    it('should handle different currency codes', async () => {
      const mockResponse = mockProfitLossReportResponse(5000, 3000, '2024-01-01', '2024-01-31');
      mockResponse.data.revenue.code = 'CAD';
      mockResponse.data.expenses.code = 'CAD';
      mockResponse.data.netIncome.code = 'CAD';

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            profitLoss: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await profitLossReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        mockClient as any
      );

      expect(result.revenue.code).toBe('CAD');
      expect(result.expenses.code).toBe('CAD');
      expect(result.netIncome.code).toBe('CAD');
    });

    it('should handle break-even scenario (revenue equals expenses)', async () => {
      const mockResponse = mockProfitLossReportResponse(5000, 5000, '2024-01-01', '2024-01-31');

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            profitLoss: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await profitLossReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        mockClient as any
      );

      expect(result.revenue.amount).toBe('5000.00');
      expect(result.expenses.amount).toBe('5000.00');
      expect(result.netIncome.amount).toBe('0.00');
    });
  });
});
