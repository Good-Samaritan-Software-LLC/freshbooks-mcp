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
  mockExpenseSingleResponse,
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
      const mockSingleResponse = mockExpenseSingleResponse({ id: 12345 });
      const mockResponse = mockExpenseUpdateResponse(12345, {
        amount: { amount: '200.00', code: 'USD' },
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            single: vi.fn().mockResolvedValue(mockSingleResponse),
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
      const mockSingleResponse = mockExpenseSingleResponse({ id: 12345 });
      const mockResponse = mockExpenseUpdateResponse(12345, {
        vendor: 'New Vendor Inc',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            single: vi.fn().mockResolvedValue(mockSingleResponse),
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
      const mockSingleResponse = mockExpenseSingleResponse({ id: 12345 });
      const mockResponse = mockExpenseUpdateResponse(12345, {
        notes: 'Updated expense description',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            single: vi.fn().mockResolvedValue(mockSingleResponse),
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
      const mockSingleResponse = mockExpenseSingleResponse({ id: 12345 });
      const mockResponse = mockExpenseUpdateResponse(12345, {
        categoryId: 9999,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            single: vi.fn().mockResolvedValue(mockSingleResponse),
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
      const mockSingleResponse = mockExpenseSingleResponse({ id: 12345 });
      const mockResponse = mockExpenseUpdateResponse(12345, {
        date: '2024-06-15T00:00:00Z',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            single: vi.fn().mockResolvedValue(mockSingleResponse),
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
      const mockSingleResponse = mockExpenseSingleResponse({ id: 12345 });
      const mockResponse = mockExpenseUpdateResponse(12345, {
        clientId: 55555,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            single: vi.fn().mockResolvedValue(mockSingleResponse),
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
      const mockSingleResponse = mockExpenseSingleResponse({ id: 12345 });
      const mockResponse = mockExpenseUpdateResponse(12345, {
        projectId: 66666,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            single: vi.fn().mockResolvedValue(mockSingleResponse),
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
      const mockSingleResponse = mockExpenseSingleResponse({ id: 12345 });
      const mockResponse = mockExpenseUpdateResponse(12345, {
        markupPercent: 25,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            single: vi.fn().mockResolvedValue(mockSingleResponse),
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
      const mockSingleResponse = mockExpenseSingleResponse({ id: 12345 });
      const mockResponse = mockExpenseUpdateResponse(12345, {
        taxName1: 'HST',
        taxPercent1: '13',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            single: vi.fn().mockResolvedValue(mockSingleResponse),
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
      const mockSingleResponse = mockExpenseSingleResponse({ id: 12345 });
      const mockResponse = mockExpenseUpdateResponse(12345, {
        visState: 2,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            single: vi.fn().mockResolvedValue(mockSingleResponse),
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
      const mockSingleResponse = mockExpenseSingleResponse({ id: 12345 });
      const mockResponse = mockExpenseUpdateResponse(12345, {
        vendor: 'Updated Vendor',
        notes: 'Updated notes',
        amount: { amount: '300.00', code: 'USD' },
        markupPercent: 15,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            single: vi.fn().mockResolvedValue(mockSingleResponse),
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

    it('should support partial update with only categoryId (no date required)', async () => {
      // This test documents the fix for the bug where updating only categoryId
      // would fail with "Cannot read properties of undefined (reading 'getFullYear')"
      // because the SDK requires all fields. The fix fetches the existing expense first.
      const mockSingleResponse = mockExpenseSingleResponse({
        id: 12345,
        date: '2024-01-15T00:00:00Z', // Existing date from fetched expense
        categoryId: 5678,
      });
      const mockResponse = mockExpenseUpdateResponse(12345, {
        categoryId: 7777, // New category
        date: '2024-01-15T00:00:00Z', // Date preserved from existing
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            single: vi.fn().mockResolvedValue(mockSingleResponse),
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      // Only providing categoryId - no date or other fields
      const result = await expenseUpdateTool.execute(
        {
          accountId: 'ABC123',
          expenseId: 12345,
          categoryId: 7777,
        },
        mockClient as any
      );

      expect(result.categoryId).toBe(7777);
      // Date should be preserved from the existing expense
      expect(result.date).toBe('2024-01-15T00:00:00Z');
    });

    it('should require at least one field to update', async () => {
      await expect(
        expenseUpdateTool.execute(
          { accountId: 'ABC123', expenseId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle expense not found error on fetch', async () => {
      // Error occurs during the initial fetch (before update)
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            single: vi.fn().mockResolvedValue(mockExpenseNotFoundError(99999)),
            update: vi.fn(),
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

    it('should handle expense not found error on update', async () => {
      // Error occurs during the update (after successful fetch)
      const mockSingleResponse = mockExpenseSingleResponse({ id: 12345 });
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            single: vi.fn().mockResolvedValue(mockSingleResponse),
            update: vi.fn().mockResolvedValue(mockExpenseNotFoundError(12345)),
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

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            single: vi.fn().mockResolvedValue(mockUnauthorizedError()),
            update: vi.fn(),
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
            single: vi.fn().mockResolvedValue(mockRateLimitError(60)),
            update: vi.fn(),
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
            single: vi.fn().mockResolvedValue(mockServerError()),
            update: vi.fn(),
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

    it('should handle validation error on update', async () => {
      const mockSingleResponse = mockExpenseSingleResponse({ id: 12345 });
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            single: vi.fn().mockResolvedValue(mockSingleResponse),
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
