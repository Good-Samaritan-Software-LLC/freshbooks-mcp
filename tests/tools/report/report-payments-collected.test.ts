/**
 * Tests for report_payments_collected tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { paymentsCollectedReportTool } from '../../../src/tools/report/report-payments-collected.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockPaymentsCollectedReportResponse,
  mockEmptyPaymentsCollectedReportResponse,
} from '../../mocks/responses/report.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
  mockNetworkTimeoutError,
  mockValidationError,
  mockInvalidAccountError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('report_payments_collected tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should return payments collected report with default date range', async () => {
      const mockResponse = mockPaymentsCollectedReportResponse(5, '2024-01-01', '2024-01-31');

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            paymentsCollected: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentsCollectedReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        mockClient as any
      );

      expect(result.payments).toHaveLength(5);
      expect(result.startDate).toBe('2024-01-01');
      expect(result.endDate).toBe('2024-01-31');
      expect(result.totalAmount).toBeDefined();
      expect(result.totalAmount.code).toBe('USD');
    });

    it('should return payments with various payment types', async () => {
      const mockResponse = mockPaymentsCollectedReportResponse(10, '2024-01-01', '2024-01-31');

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            paymentsCollected: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentsCollectedReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        mockClient as any
      );

      expect(result.payments).toHaveLength(10);
      const paymentTypes = result.payments.map((p: any) => p.paymentType);
      expect(paymentTypes).toContain('Credit Card');
      expect(paymentTypes).toContain('Check');
      expect(paymentTypes).toContain('Cash');
    });

    it('should return empty array when no payments exist', async () => {
      const mockResponse = mockEmptyPaymentsCollectedReportResponse('2024-01-01', '2024-01-31');

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            paymentsCollected: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentsCollectedReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        mockClient as any
      );

      expect(result.payments).toHaveLength(0);
      expect(result.totalAmount.amount).toBe('0.00');
    });

    it('should handle single day date range', async () => {
      const mockResponse = mockPaymentsCollectedReportResponse(2, '2024-01-15', '2024-01-15');

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            paymentsCollected: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentsCollectedReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-15',
          endDate: '2024-01-15',
        },
        mockClient as any
      );

      expect(result.payments).toHaveLength(2);
      expect(result.startDate).toBe('2024-01-15');
      expect(result.endDate).toBe('2024-01-15');
    });

    it('should handle large date range (full year)', async () => {
      const mockResponse = mockPaymentsCollectedReportResponse(50, '2024-01-01', '2024-12-31');

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            paymentsCollected: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentsCollectedReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        },
        mockClient as any
      );

      expect(result.payments).toHaveLength(50);
      expect(result.startDate).toBe('2024-01-01');
      expect(result.endDate).toBe('2024-12-31');
    });

    it('should handle quarterly date range', async () => {
      const mockResponse = mockPaymentsCollectedReportResponse(15, '2024-01-01', '2024-03-31');

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            paymentsCollected: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentsCollectedReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-01',
          endDate: '2024-03-31',
        },
        mockClient as any
      );

      expect(result.payments).toHaveLength(15);
    });

    it('should include payment notes when present', async () => {
      const mockResponse = mockPaymentsCollectedReportResponse(3, '2024-01-01', '2024-01-31');

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            paymentsCollected: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentsCollectedReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        mockClient as any
      );

      // Some payments should have notes (based on mock)
      const paymentsWithNotes = result.payments.filter((p: any) => p.notes);
      expect(paymentsWithNotes.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            paymentsCollected: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentsCollectedReportTool.execute(
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
            paymentsCollected: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentsCollectedReportTool.execute(
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
            paymentsCollected: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentsCollectedReportTool.execute(
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
        paymentsCollectedReportTool.execute(
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
            paymentsCollected: vi.fn().mockResolvedValue(mockInvalidAccountError('ABC123')),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentsCollectedReportTool.execute(
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
        paymentsCollectedReportTool.execute(
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
        paymentsCollectedReportTool.execute(
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
        paymentsCollectedReportTool.execute(
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
        paymentsCollectedReportTool.execute(
          {
            accountId: 'ABC123',
            startDate: 'not-a-date',
            endDate: '2024-01-31',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject invalid date format for endDate', async () => {
      await expect(
        paymentsCollectedReportTool.execute(
          {
            accountId: 'ABC123',
            startDate: '2024-01-01',
            endDate: 'invalid-date',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject startDate after endDate', async () => {
      await expect(
        paymentsCollectedReportTool.execute(
          {
            accountId: 'ABC123',
            startDate: '2024-01-31',
            endDate: '2024-01-01',
          },
          mockClient as any
        )
      ).rejects.toThrow(/start date must be before or equal to end date/i);
    });

    it('should accept dates in correct YYYY-MM-DD format', async () => {
      const mockResponse = mockPaymentsCollectedReportResponse(1, '2024-01-01', '2024-01-31');

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            paymentsCollected: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      // Should not throw
      await expect(
        paymentsCollectedReportTool.execute(
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
      const mockResponse = mockPaymentsCollectedReportResponse(1, '2024-02-29', '2024-02-29');

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            paymentsCollected: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentsCollectedReportTool.execute(
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
      const mockResponse = mockPaymentsCollectedReportResponse(2, '2023-12-31', '2024-01-01');

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            paymentsCollected: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentsCollectedReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2023-12-31',
          endDate: '2024-01-01',
        },
        mockClient as any
      );

      expect(result.payments).toHaveLength(2);
    });

    it('should handle payments with zero amount', async () => {
      const mockResponse = mockPaymentsCollectedReportResponse(0, '2024-01-01', '2024-01-31');
      mockResponse.data.payments = [
        {
          date: '2024-01-15',
          clientName: 'Test Client',
          invoiceNumber: 'INV-1001',
          amount: { amount: '0.00', code: 'USD' },
          paymentType: 'Credit Card',
        },
      ];
      mockResponse.data.totalAmount = { amount: '0.00', code: 'USD' };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            paymentsCollected: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentsCollectedReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        mockClient as any
      );

      expect(result.payments).toHaveLength(1);
      expect(result.payments[0].amount.amount).toBe('0.00');
    });

    it('should handle payments with large amounts', async () => {
      const mockResponse = mockPaymentsCollectedReportResponse(1, '2024-01-01', '2024-01-31');
      mockResponse.data.payments = [
        {
          date: '2024-01-15',
          clientName: 'Enterprise Client',
          invoiceNumber: 'INV-1001',
          amount: { amount: '999999.99', code: 'USD' },
          paymentType: 'Wire Transfer',
        },
      ];
      mockResponse.data.totalAmount = { amount: '999999.99', code: 'USD' };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            paymentsCollected: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentsCollectedReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        mockClient as any
      );

      expect(result.payments[0].amount.amount).toBe('999999.99');
    });

    it('should handle different currency codes', async () => {
      const mockResponse = mockPaymentsCollectedReportResponse(2, '2024-01-01', '2024-01-31');
      mockResponse.data.payments = [
        {
          date: '2024-01-15',
          clientName: 'US Client',
          invoiceNumber: 'INV-1001',
          amount: { amount: '100.00', code: 'USD' },
          paymentType: 'Credit Card',
        },
        {
          date: '2024-01-16',
          clientName: 'Canadian Client',
          invoiceNumber: 'INV-1002',
          amount: { amount: '150.00', code: 'CAD' },
          paymentType: 'Credit Card',
        },
      ];
      mockResponse.data.totalAmount = { amount: '250.00', code: 'USD' };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          reports: {
            paymentsCollected: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentsCollectedReportTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        mockClient as any
      );

      expect(result.payments[0].amount.code).toBe('USD');
      expect(result.payments[1].amount.code).toBe('CAD');
    });
  });
});
