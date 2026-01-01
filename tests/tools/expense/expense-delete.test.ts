/**
 * Tests for expense_delete tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { expenseDeleteTool } from '../../../src/tools/expense/expense-delete.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockExpenseDeleteResponse,
  mockExpenseNotFoundError,
} from '../../mocks/responses/expense.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('expense_delete tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should delete expense and return success', async () => {
      const mockResponse = mockExpenseDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await expenseDeleteTool.execute(
        { accountId: 'ABC123', expenseId: 12345 },
        mockClient as any
      );

      expect(result.success).toBe(true);
      expect(result.expenseId).toBe(12345);
    });

    it('should delete expense with large ID', async () => {
      const mockResponse = mockExpenseDeleteResponse();
      const largeExpenseId = 9999999;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await expenseDeleteTool.execute(
        { accountId: 'ABC123', expenseId: largeExpenseId },
        mockClient as any
      );

      expect(result.success).toBe(true);
      expect(result.expenseId).toBe(largeExpenseId);
    });

    it('should call executeWithRetry with correct operation name', async () => {
      const mockResponse = mockExpenseDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        expect(operation).toBe('expense_delete');
        const client = {
          expenses: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      await expenseDeleteTool.execute(
        { accountId: 'ABC123', expenseId: 12345 },
        mockClient as any
      );

      expect(mockClient.executeWithRetry).toHaveBeenCalledTimes(1);
    });

    it('should pass string expenseId to FreshBooks API', async () => {
      const mockResponse = mockExpenseDeleteResponse();
      let capturedExpenseId: string | undefined;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            delete: vi.fn().mockImplementation((accountId: string, expenseId: string) => {
              capturedExpenseId = expenseId;
              return Promise.resolve(mockResponse);
            }),
          },
        };
        return apiCall(client);
      });

      await expenseDeleteTool.execute(
        { accountId: 'ABC123', expenseId: 12345 },
        mockClient as any
      );

      expect(capturedExpenseId).toBe('12345');
    });
  });

  describe('error handling', () => {
    it('should handle expense not found error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            delete: vi.fn().mockResolvedValue(mockExpenseNotFoundError(99999)),
          },
        };
        return apiCall(client);
      });

      await expect(
        expenseDeleteTool.execute(
          { accountId: 'ABC123', expenseId: 99999 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            delete: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        expenseDeleteTool.execute(
          { accountId: 'ABC123', expenseId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            delete: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        expenseDeleteTool.execute(
          { accountId: 'ABC123', expenseId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            delete: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        expenseDeleteTool.execute(
          { accountId: 'ABC123', expenseId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(new Error('Network timeout'));

      await expect(
        expenseDeleteTool.execute(
          { accountId: 'ABC123', expenseId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle already deleted expense', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            delete: vi.fn().mockResolvedValue({
              ok: false,
              error: {
                code: 'ALREADY_DELETED',
                message: 'Expense has already been deleted',
                statusCode: 400,
              },
            }),
          },
        };
        return apiCall(client);
      });

      await expect(
        expenseDeleteTool.execute(
          { accountId: 'ABC123', expenseId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle invoiced expense that cannot be deleted', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            delete: vi.fn().mockResolvedValue({
              ok: false,
              error: {
                code: 'CANNOT_DELETE',
                message: 'Cannot delete expense that has been invoiced',
                statusCode: 400,
              },
            }),
          },
        };
        return apiCall(client);
      });

      await expect(
        expenseDeleteTool.execute(
          { accountId: 'ABC123', expenseId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        expenseDeleteTool.execute(
          { expenseId: 12345 } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should require expenseId', async () => {
      await expect(
        expenseDeleteTool.execute(
          { accountId: 'ABC123' } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject negative expenseId', async () => {
      await expect(
        expenseDeleteTool.execute(
          { accountId: 'ABC123', expenseId: -1 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject zero expenseId', async () => {
      await expect(
        expenseDeleteTool.execute(
          { accountId: 'ABC123', expenseId: 0 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject non-integer expenseId', async () => {
      await expect(
        expenseDeleteTool.execute(
          { accountId: 'ABC123', expenseId: 12.5 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject empty accountId', async () => {
      await expect(
        expenseDeleteTool.execute(
          { accountId: '', expenseId: 12345 } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });
});
