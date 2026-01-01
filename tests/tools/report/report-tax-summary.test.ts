/**
 * Tests for report_tax_summary tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { taxSummaryReportTool } from '../../../src/tools/report/report-tax-summary.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockTaxSummaryReportResponse,
  mockEmptyTaxSummaryReportResponse,
} from '../../mocks/responses/report.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
  mockNetworkTimeoutError,
  mockInvalidAccountError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('report_tax_summary tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should return tax summary report with multiple tax types', async () => {
      const mockResponse = mockTaxSummaryReportResponse(2, '2024-01-01', '2024-01-31');

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            taxSummary: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taxSummaryReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        mockClient as any
      );

      expect(result.taxes).toHaveLength(2);
      expect(result.startDate).toBe('2024-01-01');
      expect(result.endDate).toBe('2024-01-31');
      expect(result.totalTaxCollected).toBeDefined();
      expect(result.totalTaxCollected.code).toBe('USD');
    });

    it('should return tax summary with Sales Tax and GST', async () => {
      const mockResponse = mockTaxSummaryReportResponse(2, '2024-01-01', '2024-01-31');

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            taxSummary: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taxSummaryReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        mockClient as any
      );

      const taxNames = result.taxes.map((t: any) => t.taxName);
      expect(taxNames).toContain('Sales Tax');
      expect(taxNames).toContain('GST');
    });

    it('should return empty array when no taxes collected', async () => {
      const mockResponse = mockEmptyTaxSummaryReportResponse('2024-01-01', '2024-01-31');

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            taxSummary: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taxSummaryReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        mockClient as any
      );

      expect(result.taxes).toHaveLength(0);
      expect(result.totalTaxCollected.amount).toBe('0.00');
    });

    it('should include tax rates for each tax type', async () => {
      const mockResponse = mockTaxSummaryReportResponse(3, '2024-01-01', '2024-01-31');

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            taxSummary: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taxSummaryReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        mockClient as any
      );

      expect(result.taxes).toHaveLength(3);
      result.taxes.forEach((tax: any) => {
        expect(tax.taxRate).toBeDefined();
        expect(tax.taxName).toBeDefined();
        expect(tax.taxableAmount).toBeDefined();
        expect(tax.taxCollected).toBeDefined();
      });
    });

    it('should include tax paid when available', async () => {
      const mockResponse = mockTaxSummaryReportResponse(2, '2024-01-01', '2024-01-31');

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            taxSummary: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taxSummaryReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        mockClient as any
      );

      // Based on mock, some taxes should have taxPaid
      const taxesWithPaid = result.taxes.filter((t: any) => t.taxPaid);
      expect(taxesWithPaid.length).toBeGreaterThan(0);
    });

    it('should handle single day date range', async () => {
      const mockResponse = mockTaxSummaryReportResponse(1, '2024-01-15', '2024-01-15');

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            taxSummary: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taxSummaryReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-15',
          endDate: '2024-01-15',
        },
        mockClient as any
      );

      expect(result.startDate).toBe('2024-01-15');
      expect(result.endDate).toBe('2024-01-15');
    });

    it('should handle quarterly date range', async () => {
      const mockResponse = mockTaxSummaryReportResponse(2, '2024-01-01', '2024-03-31');

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            taxSummary: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taxSummaryReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-01',
          endDate: '2024-03-31',
        },
        mockClient as any
      );

      expect(result.startDate).toBe('2024-01-01');
      expect(result.endDate).toBe('2024-03-31');
      expect(result.taxes).toHaveLength(2);
    });

    it('should handle full year date range', async () => {
      const mockResponse = mockTaxSummaryReportResponse(3, '2024-01-01', '2024-12-31');

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            taxSummary: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taxSummaryReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        },
        mockClient as any
      );

      expect(result.startDate).toBe('2024-01-01');
      expect(result.endDate).toBe('2024-12-31');
      expect(result.taxes).toHaveLength(3);
    });

    it('should calculate correct total tax collected', async () => {
      const mockResponse = mockTaxSummaryReportResponse(2, '2024-01-01', '2024-01-31');

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            taxSummary: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taxSummaryReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        mockClient as any
      );

      // Verify total matches sum of individual taxes
      const sumOfTaxes = result.taxes.reduce((sum: number, tax: any) => {
        return sum + parseFloat(tax.taxCollected.amount);
      }, 0);

      expect(parseFloat(result.totalTaxCollected.amount)).toBe(sumOfTaxes);
    });

    it('should handle single tax type', async () => {
      const mockResponse = mockTaxSummaryReportResponse(1, '2024-01-01', '2024-01-31');

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            taxSummary: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taxSummaryReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        mockClient as any
      );

      expect(result.taxes).toHaveLength(1);
      expect(result.taxes[0].taxName).toBe('Sales Tax');
    });
  });

  describe('error handling', () => {
    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            taxSummary: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        taxSummaryReportTool.execute(
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
            taxSummary: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        taxSummaryReportTool.execute(
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
            taxSummary: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        taxSummaryReportTool.execute(
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
        taxSummaryReportTool.execute(
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
            taxSummary: vi.fn().mockResolvedValue(mockInvalidAccountError('ABC123')),
          },
        };
        return apiCall(client);
      });

      await expect(
        taxSummaryReportTool.execute(
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
        taxSummaryReportTool.execute(
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
        taxSummaryReportTool.execute(
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
        taxSummaryReportTool.execute(
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
        taxSummaryReportTool.execute(
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
        taxSummaryReportTool.execute(
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
        taxSummaryReportTool.execute(
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
      const mockResponse = mockTaxSummaryReportResponse(1, '2024-01-01', '2024-01-31');

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            taxSummary: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      // Should not throw
      await expect(
        taxSummaryReportTool.execute(
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
      const mockResponse = mockTaxSummaryReportResponse(1, '2024-02-29', '2024-02-29');

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            taxSummary: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taxSummaryReportTool.execute(
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
      const mockResponse = mockTaxSummaryReportResponse(1, '2023-12-31', '2024-01-01');

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            taxSummary: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taxSummaryReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2023-12-31',
          endDate: '2024-01-01',
        },
        mockClient as any
      );

      expect(result.taxes).toHaveLength(1);
    });

    it('should handle zero tax collected', async () => {
      const mockResponse = mockEmptyTaxSummaryReportResponse('2024-01-01', '2024-01-31');

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            taxSummary: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taxSummaryReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        mockClient as any
      );

      expect(result.totalTaxCollected.amount).toBe('0.00');
    });

    it('should handle very large tax amounts', async () => {
      const mockResponse = mockTaxSummaryReportResponse(1, '2024-01-01', '2024-12-31');
      mockResponse.data.taxes[0].taxableAmount = { amount: '10000000.00', code: 'USD' };
      mockResponse.data.taxes[0].taxCollected = { amount: '1300000.00', code: 'USD' };
      mockResponse.data.totalTaxCollected = { amount: '1300000.00', code: 'USD' };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            taxSummary: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taxSummaryReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        },
        mockClient as any
      );

      expect(result.taxes[0].taxCollected.amount).toBe('1300000.00');
    });

    it('should handle different currency codes', async () => {
      const mockResponse = mockTaxSummaryReportResponse(2, '2024-01-01', '2024-01-31');
      mockResponse.data.taxes[0].taxableAmount.code = 'CAD';
      mockResponse.data.taxes[0].taxCollected.code = 'CAD';
      mockResponse.data.totalTaxCollected.code = 'CAD';

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            taxSummary: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taxSummaryReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        mockClient as any
      );

      expect(result.taxes[0].taxCollected.code).toBe('CAD');
    });

    it('should handle decimal tax rates', async () => {
      const mockResponse = mockTaxSummaryReportResponse(1, '2024-01-01', '2024-01-31');
      mockResponse.data.taxes[0].taxRate = '13.50';

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            taxSummary: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taxSummaryReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        mockClient as any
      );

      expect(result.taxes[0].taxRate).toBe('13.50');
    });

    it('should handle taxes without taxPaid field', async () => {
      const mockResponse = mockTaxSummaryReportResponse(1, '2024-01-01', '2024-01-31');
      delete mockResponse.data.taxes[0].taxPaid;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            taxSummary: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taxSummaryReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        mockClient as any
      );

      expect(result.taxes[0].taxPaid).toBeUndefined();
    });

    it('should handle multiple taxes with same rate but different names', async () => {
      const mockResponse = mockTaxSummaryReportResponse(2, '2024-01-01', '2024-01-31');
      mockResponse.data.taxes[0].taxName = 'Provincial Sales Tax';
      mockResponse.data.taxes[0].taxRate = '8.00';
      mockResponse.data.taxes[1].taxName = 'Municipal Tax';
      mockResponse.data.taxes[1].taxRate = '8.00';

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            taxSummary: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taxSummaryReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        mockClient as any
      );

      expect(result.taxes).toHaveLength(2);
      expect(result.taxes[0].taxName).not.toBe(result.taxes[1].taxName);
      expect(result.taxes[0].taxRate).toBe(result.taxes[1].taxRate);
    });
  });
});
