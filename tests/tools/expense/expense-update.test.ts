/**
 * Tests for expense_update tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { expenseUpdateTool } from '../../../src/tools/expense/expense-update.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockExpenseUpdateResponse,
  mockExpenseNotFoundError,
  mockExpenseValidationError,
} from '../../mocks/responses/expense.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('expense_update tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should update expense amount', async () => {
      const mockResponse = mockExpenseUpdateResponse(12345, {
        amount: { amount: '200.00', code: 'USD' },
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await expenseUpdateTool.execute(
        {
          accountId: 'ABC123',
          expenseId: 12345,
          amount: { amount: '200.00', code: 'USD' },
        },
        mockClient as any
      );

      expect(result.id).toBe(12345);
      expect(result.amount.amount).toBe('200.00');
    });

    it('should update expense vendor', async () => {
      const mockResponse = mockExpenseUpdateResponse(12345, {
        vendor: 'New Vendor Inc',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await expenseUpdateTool.execute(
        {
          accountId: 'ABC123',
          expenseId: 12345,
          vendor: 'New Vendor Inc',
        },
        mockClient as any
      );

      expect(result.vendor).toBe('New Vendor Inc');
    });

    it('should update expense notes', async () => {
      const mockResponse = mockExpenseUpdateResponse(12345, {
        notes: 'Updated expense description',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await expenseUpdateTool.execute(
        {
          accountId: 'ABC123',
          expenseId: 12345,
          notes: 'Updated expense description',
        },
        mockClient as any
      );

      expect(result.notes).toBe('Updated expense description');
    });

    it('should update expense category', async () => {
      const mockResponse = mockExpenseUpdateResponse(12345, {
        categoryId: 9999,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await expenseUpdateTool.execute(
        {
          accountId: 'ABC123',
          expenseId: 12345,
          categoryId: 9999,
        },
        mockClient as any
      );

      expect(result.categoryId).toBe(9999);
    });

    it('should update expense date', async () => {
      const mockResponse = mockExpenseUpdateResponse(12345, {
        date: '2024-06-15T00:00:00Z',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await expenseUpdateTool.execute(
        {
          accountId: 'ABC123',
          expenseId: 12345,
          date: '2024-06-15',
        },
        mockClient as any
      );

      // API returns full datetime, but input accepts YYYY-MM-DD
      expect(result.date).toBe('2024-06-15T00:00:00Z');
    });

    it('should update expense client association', async () => {
      const mockResponse = mockExpenseUpdateResponse(12345, {
        clientId: 55555,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await expenseUpdateTool.execute(
        {
          accountId: 'ABC123',
          expenseId: 12345,
          clientId: 55555,
        },
        mockClient as any
      );

      expect(result.clientId).toBe(55555);
    });

    it('should update expense project association', async () => {
      const mockResponse = mockExpenseUpdateResponse(12345, {
        projectId: 66666,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await expenseUpdateTool.execute(
        {
          accountId: 'ABC123',
          expenseId: 12345,
          projectId: 66666,
        },
        mockClient as any
      );

      expect(result.projectId).toBe(66666);
    });

    it('should update expense markup percentage', async () => {
      const mockResponse = mockExpenseUpdateResponse(12345, {
        markupPercent: 25,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await expenseUpdateTool.execute(
        {
          accountId: 'ABC123',
          expenseId: 12345,
          markupPercent: 25,
        },
        mockClient as any
      );

      expect(result.markupPercent).toBe(25);
    });

    it('should update expense tax information', async () => {
      const mockResponse = mockExpenseUpdateResponse(12345, {
        taxName1: 'HST',
        taxPercent1: '13',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await expenseUpdateTool.execute(
        {
          accountId: 'ABC123',
          expenseId: 12345,
          taxName1: 'HST',
          taxPercent1: '13',
        },
        mockClient as any
      );

      expect(result.taxName1).toBe('HST');
      expect(result.taxPercent1).toBe('13');
    });

    it('should archive expense using visState', async () => {
      const mockResponse = mockExpenseUpdateResponse(12345, {
        visState: 2,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await expenseUpdateTool.execute(
        {
          accountId: 'ABC123',
          expenseId: 12345,
          visState: 2,
        },
        mockClient as any
      );

      expect(result.visState).toBe(2);
    });

    it('should update multiple fields at once', async () => {
      const mockResponse = mockExpenseUpdateResponse(12345, {
        vendor: 'Updated Vendor',
        notes: 'Updated notes',
        amount: { amount: '300.00', code: 'USD' },
        markupPercent: 15,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await expenseUpdateTool.execute(
        {
          accountId: 'ABC123',
          expenseId: 12345,
          vendor: 'Updated Vendor',
          notes: 'Updated notes',
          amount: { amount: '300.00', code: 'USD' },
          markupPercent: 15,
        },
        mockClient as any
      );

      expect(result.vendor).toBe('Updated Vendor');
      expect(result.notes).toBe('Updated notes');
      expect(result.amount.amount).toBe('300.00');
      expect(result.markupPercent).toBe(15);
    });
  });

  describe('error handling', () => {
    it('should handle expense not found error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            update: vi.fn().mockResolvedValue(mockExpenseNotFoundError(99999)),
          },
        };
        return apiCall(client);
      });

      await expect(
        expenseUpdateTool.execute(
          { accountId: 'ABC123', expenseId: 99999, notes: 'test' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            update: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        expenseUpdateTool.execute(
          { accountId: 'ABC123', expenseId: 12345, notes: 'test' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            update: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        expenseUpdateTool.execute(
          { accountId: 'ABC123', expenseId: 12345, notes: 'test' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            update: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        expenseUpdateTool.execute(
          { accountId: 'ABC123', expenseId: 12345, notes: 'test' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle validation error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            update: vi.fn().mockResolvedValue(
              mockExpenseValidationError('categoryId', 'Invalid category')
            ),
          },
        };
        return apiCall(client);
      });

      await expect(
        expenseUpdateTool.execute(
          { accountId: 'ABC123', expenseId: 12345, categoryId: 99999 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        expenseUpdateTool.execute(
          { expenseId: 12345, notes: 'test' } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should require expenseId', async () => {
      await expect(
        expenseUpdateTool.execute(
          { accountId: 'ABC123', notes: 'test' } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject negative expenseId', async () => {
      await expect(
        expenseUpdateTool.execute(
          { accountId: 'ABC123', expenseId: -1, notes: 'test' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject zero expenseId', async () => {
      await expect(
        expenseUpdateTool.execute(
          { accountId: 'ABC123', expenseId: 0, notes: 'test' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject markup percent over 100', async () => {
      await expect(
        expenseUpdateTool.execute(
          { accountId: 'ABC123', expenseId: 12345, markupPercent: 101 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject negative markup percent', async () => {
      await expect(
        expenseUpdateTool.execute(
          { accountId: 'ABC123', expenseId: 12345, markupPercent: -10 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });
});
