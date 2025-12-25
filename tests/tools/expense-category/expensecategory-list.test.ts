/**
 * Tests for expensecategory_list tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { expensecategoryListTool } from '../../../src/tools/expense-category/expensecategory-list.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockExpenseCategoryListResponse,
  mockExpenseCategoryEmptyListResponse,
} from '../../mocks/responses/expense-category.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
  mockNetworkTimeoutError,
} from '../../mocks/errors/freshbooks-errors.js';

// Mock the FreshBooks SDK query builders
vi.mock('@freshbooks/api/dist/models/builders/index.js', () => ({
  PaginationQueryBuilder: class {
    private _page: number = 1;
    private _perPage: number = 30;
    page(value: number) {
      this._page = value;
      return this;
    }
    perPage(value: number) {
      this._perPage = value;
      return this;
    }
    build() {
      return { page: this._page, perPage: this._perPage };
    }
  },
}));

describe('expensecategory_list tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should return expense categories with default pagination', async () => {
      const mockResponse = mockExpenseCategoryListResponse(10);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenseCategories: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await expensecategoryListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.categories).toHaveLength(10);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.perPage).toBe(30);
      expect(result.pagination.total).toBe(10);
    });

    it('should return expense categories with custom pagination', async () => {
      const mockResponse = mockExpenseCategoryListResponse(5, 2, 5);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenseCategories: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await expensecategoryListTool.execute(
        { accountId: 'ABC123', page: 2, perPage: 5 },
        mockClient as any
      );

      expect(result.categories).toHaveLength(5);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.perPage).toBe(5);
    });

    it('should return empty array when no categories exist', async () => {
      const mockResponse = mockExpenseCategoryEmptyListResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenseCategories: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await expensecategoryListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.categories).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should include category details in response', async () => {
      const mockResponse = mockExpenseCategoryListResponse(3);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenseCategories: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await expensecategoryListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.categories).toHaveLength(3);
      expect(result.categories[0]).toHaveProperty('id');
      expect(result.categories[0]).toHaveProperty('category');
    });

    it('should handle page 1 explicitly', async () => {
      const mockResponse = mockExpenseCategoryListResponse(10, 1, 30);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenseCategories: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await expensecategoryListTool.execute(
        { accountId: 'ABC123', page: 1 },
        mockClient as any
      );

      expect(result.pagination.page).toBe(1);
    });

    it('should handle maximum perPage value', async () => {
      const mockResponse = mockExpenseCategoryListResponse(50, 1, 100);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenseCategories: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await expensecategoryListTool.execute(
        { accountId: 'ABC123', perPage: 100 },
        mockClient as any
      );

      expect(result.pagination.perPage).toBe(100);
    });
  });

  describe('error handling', () => {
    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenseCategories: {
            list: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        expensecategoryListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenseCategories: {
            list: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        expensecategoryListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenseCategories: {
            list: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        expensecategoryListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());

      await expect(
        expensecategoryListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        expensecategoryListTool.execute({} as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should reject invalid page number', async () => {
      await expect(
        expensecategoryListTool.execute(
          { accountId: 'ABC123', page: 0 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject perPage exceeding maximum', async () => {
      await expect(
        expensecategoryListTool.execute(
          { accountId: 'ABC123', perPage: 101 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject negative page number', async () => {
      await expect(
        expensecategoryListTool.execute(
          { accountId: 'ABC123', page: -1 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject negative perPage', async () => {
      await expect(
        expensecategoryListTool.execute(
          { accountId: 'ABC123', perPage: -1 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });
});
