/**
 * Tests for expense_single tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { expenseSingleTool } from '../../../src/tools/expense/expense-single.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockExpenseSingleResponse,
  mockExpenseNotFoundError,
} from '../../mocks/responses/expense.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('expense_single tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should return expense details by ID', async () => {
      const mockResponse = mockExpenseSingleResponse({ id: 12345 });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await expenseSingleTool.execute(
        { accountId: 'ABC123', expenseId: 12345 },
        mockClient as any
      );

      expect(result.id).toBe(12345);
      expect(result.vendor).toBe('Office Depot');
      expect(result.notes).toBe('Office supplies for Q1');
    });

    it('should return expense with all optional fields populated', async () => {
      const mockResponse = mockExpenseSingleResponse({
        id: 99999,
        vendor: 'Acme Corp',
        notes: 'Conference travel expenses',
        clientId: 11111,
        projectId: 22222,
        markupPercent: 10,
        taxName1: 'GST',
        taxPercent1: '5',
        taxName2: 'PST',
        taxPercent2: '7',
        status: 'invoiced',
        hasReceipt: true,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await expenseSingleTool.execute(
        { accountId: 'ABC123', expenseId: 99999 },
        mockClient as any
      );

      expect(result.id).toBe(99999);
      expect(result.vendor).toBe('Acme Corp');
      expect(result.clientId).toBe(11111);
      expect(result.projectId).toBe(22222);
      expect(result.markupPercent).toBe(10);
      expect(result.taxName1).toBe('GST');
      expect(result.status).toBe('invoiced');
      expect(result.hasReceipt).toBe(true);
    });

    it('should return expense with null optional fields', async () => {
      const mockResponse = mockExpenseSingleResponse({
        id: 55555,
        vendor: null,
        notes: '',
        clientId: null,
        projectId: null,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await expenseSingleTool.execute(
        { accountId: 'ABC123', expenseId: 55555 },
        mockClient as any
      );

      expect(result.id).toBe(55555);
      expect(result.vendor).toBeNull();
      expect(result.clientId).toBeNull();
      expect(result.projectId).toBeNull();
    });

    it('should handle expense with different statuses', async () => {
      for (const status of ['outstanding', 'invoiced', 'partial', 'paid']) {
        const mockResponse = mockExpenseSingleResponse({ status });

        mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
          const client = {
            expenses: {
              single: vi.fn().mockResolvedValue(mockResponse),
            },
          };
          return apiCall(client);
        });

        const result = await expenseSingleTool.execute(
          { accountId: 'ABC123', expenseId: 12345 },
          mockClient as any
        );

        expect(result.status).toBe(status);
      }
    });
  });

  describe('error handling', () => {
    it('should handle expense not found error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            single: vi.fn().mockResolvedValue(mockExpenseNotFoundError(99999)),
          },
        };
        return apiCall(client);
      });

      await expect(
        expenseSingleTool.execute(
          { accountId: 'ABC123', expenseId: 99999 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            single: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        expenseSingleTool.execute(
          { accountId: 'ABC123', expenseId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            single: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        expenseSingleTool.execute(
          { accountId: 'ABC123', expenseId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            single: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        expenseSingleTool.execute(
          { accountId: 'ABC123', expenseId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        expenseSingleTool.execute({ expenseId: 12345 } as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require expenseId', async () => {
      await expect(
        expenseSingleTool.execute({ accountId: 'ABC123' } as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should reject negative expenseId', async () => {
      await expect(
        expenseSingleTool.execute(
          { accountId: 'ABC123', expenseId: -1 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject zero expenseId', async () => {
      await expect(
        expenseSingleTool.execute(
          { accountId: 'ABC123', expenseId: 0 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });
});
