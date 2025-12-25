/**
 * Tests for expensecategory_single tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { expensecategorySingleTool } from '../../../src/tools/expense-category/expensecategory-single.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockExpenseCategorySingleResponse,
  mockExpenseCategoryNotFoundError,
} from '../../mocks/responses/expense-category.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('expensecategory_single tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should return expense category details by ID', async () => {
      const mockResponse = mockExpenseCategorySingleResponse({ id: 12345 });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenseCategories: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await expensecategorySingleTool.execute(
        { accountId: 'ABC123', categoryId: 12345 },
        mockClient as any
      );

      expect(result.id).toBe(12345);
      expect(result.category).toBe('Office Supplies');
    });

    it('should return category with all fields', async () => {
      const mockResponse = mockExpenseCategorySingleResponse({
        id: 5678,
        category: 'Travel',
        is_cogs: true,
        is_editable: false,
        parentid: 1234,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenseCategories: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await expensecategorySingleTool.execute(
        { accountId: 'ABC123', categoryId: 5678 },
        mockClient as any
      );

      expect(result.id).toBe(5678);
      expect(result.category).toBe('Travel');
      expect(result.is_cogs).toBe(true);
      expect(result.is_editable).toBe(false);
      expect(result.parentid).toBe(1234);
    });

    it('should return category without parent ID', async () => {
      const mockResponse = mockExpenseCategorySingleResponse({
        id: 999,
        category: 'Advertising',
        parentid: null,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenseCategories: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await expensecategorySingleTool.execute(
        { accountId: 'ABC123', categoryId: 999 },
        mockClient as any
      );

      expect(result.parentid).toBeNull();
    });

    it('should call executeWithRetry with correct operation name', async () => {
      const mockResponse = mockExpenseCategorySingleResponse({ id: 12345 });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        expect(operation).toBe('expensecategory_single');
        const client = {
          expenseCategories: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      await expensecategorySingleTool.execute(
        { accountId: 'ABC123', categoryId: 12345 },
        mockClient as any
      );

      expect(mockClient.executeWithRetry).toHaveBeenCalledTimes(1);
    });

    it('should handle different category types', async () => {
      const categories = [
        { id: 1, category: 'Office Supplies' },
        { id: 2, category: 'Travel' },
        { id: 3, category: 'Professional Fees' },
        { id: 4, category: 'Utilities' },
      ];

      for (const cat of categories) {
        const mockResponse = mockExpenseCategorySingleResponse(cat);

        mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
          const client = {
            expenseCategories: {
              single: vi.fn().mockResolvedValue(mockResponse),
            },
          };
          return apiCall(client);
        });

        const result = await expensecategorySingleTool.execute(
          { accountId: 'ABC123', categoryId: cat.id },
          mockClient as any
        );

        expect(result.id).toBe(cat.id);
        expect(result.category).toBe(cat.category);
      }
    });
  });

  describe('error handling', () => {
    it('should handle category not found error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenseCategories: {
            single: vi.fn().mockResolvedValue(mockExpenseCategoryNotFoundError(99999)),
          },
        };
        return apiCall(client);
      });

      await expect(
        expensecategorySingleTool.execute(
          { accountId: 'ABC123', categoryId: 99999 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenseCategories: {
            single: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        expensecategorySingleTool.execute(
          { accountId: 'ABC123', categoryId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenseCategories: {
            single: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        expensecategorySingleTool.execute(
          { accountId: 'ABC123', categoryId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenseCategories: {
            single: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        expensecategorySingleTool.execute(
          { accountId: 'ABC123', categoryId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        expensecategorySingleTool.execute(
          { categoryId: 12345 } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should require categoryId', async () => {
      await expect(
        expensecategorySingleTool.execute(
          { accountId: 'ABC123' } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject negative categoryId', async () => {
      await expect(
        expensecategorySingleTool.execute(
          { accountId: 'ABC123', categoryId: -1 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject zero categoryId', async () => {
      await expect(
        expensecategorySingleTool.execute(
          { accountId: 'ABC123', categoryId: 0 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject non-integer categoryId', async () => {
      await expect(
        expensecategorySingleTool.execute(
          { accountId: 'ABC123', categoryId: 12.5 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });
});
