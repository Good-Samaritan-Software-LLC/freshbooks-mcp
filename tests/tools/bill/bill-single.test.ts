/**
 * Tests for bill_single tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { billSingleTool } from '../../../src/tools/bill/bill-single.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockBillSingleResponse,
  createMockBill,
  mockBillNotFoundError,
} from '../../mocks/responses/bill.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
  mockNetworkTimeoutError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('bill_single tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should retrieve a bill by ID', async () => {
      const mockResponse = mockBillSingleResponse({ id: 12345 });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billSingleTool.execute(
        { accountId: 'ABC123', billId: 12345 },
        mockClient as any
      );

      expect(result.id).toBe(12345);
    });

    it('should return complete bill details', async () => {
      const mockResponse = mockBillSingleResponse({
        id: 12345,
        billNumber: 'BILL-001',
        vendorId: 5001,
        status: 'unpaid',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billSingleTool.execute(
        { accountId: 'ABC123', billId: 12345 },
        mockClient as any
      );

      expect(result.id).toBe(12345);
      expect(result.billNumber).toBe('BILL-001');
      expect(result.vendorId).toBe(5001);
      expect(result.status).toBe('unpaid');
    });

    it('should return bill with amount details', async () => {
      const mockResponse = mockBillSingleResponse({
        amount: { amount: '1500.00', code: 'USD' },
        outstandingAmount: { amount: '1500.00', code: 'USD' },
        paidAmount: { amount: '0.00', code: 'USD' },
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billSingleTool.execute(
        { accountId: 'ABC123', billId: 12345 },
        mockClient as any
      );

      expect(result.amount.amount).toBe('1500.00');
      expect(result.amount.code).toBe('USD');
      expect(result.outstandingAmount.amount).toBe('1500.00');
      expect(result.paidAmount.amount).toBe('0.00');
    });

    it('should return bill with line items', async () => {
      const mockResponse = mockBillSingleResponse({
        lines: [
          { description: 'Office supplies', amount: { amount: '500.00', code: 'USD' } },
          { description: 'Equipment', amount: { amount: '1000.00', code: 'USD' } },
        ],
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billSingleTool.execute(
        { accountId: 'ABC123', billId: 12345 },
        mockClient as any
      );

      expect(result.lines).toHaveLength(2);
      expect(result.lines[0].description).toBe('Office supplies');
      expect(result.lines[1].description).toBe('Equipment');
    });

    it('should return bill with dates', async () => {
      const mockResponse = mockBillSingleResponse({
        issueDate: '2024-01-15T00:00:00Z',
        dueDate: '2024-02-15T00:00:00Z',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billSingleTool.execute(
        { accountId: 'ABC123', billId: 12345 },
        mockClient as any
      );

      expect(result.issueDate).toBe('2024-01-15T00:00:00Z');
      expect(result.dueDate).toBe('2024-02-15T00:00:00Z');
    });

    it('should handle bill with paid status', async () => {
      const mockResponse = mockBillSingleResponse({
        status: 'paid',
        paidAmount: { amount: '1500.00', code: 'USD' },
        outstandingAmount: { amount: '0.00', code: 'USD' },
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billSingleTool.execute(
        { accountId: 'ABC123', billId: 12345 },
        mockClient as any
      );

      expect(result.status).toBe('paid');
    });

    it('should handle bill with partial payment', async () => {
      const mockResponse = mockBillSingleResponse({
        status: 'partial',
        paidAmount: { amount: '500.00', code: 'USD' },
        outstandingAmount: { amount: '1000.00', code: 'USD' },
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billSingleTool.execute(
        { accountId: 'ABC123', billId: 12345 },
        mockClient as any
      );

      expect(result.status).toBe('partial');
    });

    it('should handle bill with notes', async () => {
      const mockResponse = mockBillSingleResponse({
        notes: 'Monthly office supplies order',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billSingleTool.execute(
        { accountId: 'ABC123', billId: 12345 },
        mockClient as any
      );

      expect(result.notes).toBe('Monthly office supplies order');
    });
  });

  describe('error handling', () => {
    it('should handle not found error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            single: vi.fn().mockResolvedValue(mockBillNotFoundError(99999)),
          },
        };
        return apiCall(client);
      });

      await expect(
        billSingleTool.execute(
          { accountId: 'ABC123', billId: 99999 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            single: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        billSingleTool.execute(
          { accountId: 'ABC123', billId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            single: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        billSingleTool.execute(
          { accountId: 'ABC123', billId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            single: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        billSingleTool.execute(
          { accountId: 'ABC123', billId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());

      await expect(
        billSingleTool.execute(
          { accountId: 'ABC123', billId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        billSingleTool.execute({ billId: 12345 } as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require billId', async () => {
      await expect(
        billSingleTool.execute({ accountId: 'ABC123' } as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should reject non-numeric billId', async () => {
      await expect(
        billSingleTool.execute(
          { accountId: 'ABC123', billId: 'invalid' } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });
});
