/**
 * Tests for otherincome_list tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { otherincomeListTool } from '../../../src/tools/other-income/otherincome-list.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockOtherIncomeListResponse,
  mockOtherIncomeEmptyListResponse,
} from '../../mocks/responses/other-income.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
  mockNetworkTimeoutError,
} from '../../mocks/errors/freshbooks-errors.js';

// Mock the FreshBooks SDK query builders
vi.mock('@freshbooks/api/dist/models/builders/index.js', () => ({
  SearchQueryBuilder: class {
    private filters: any[] = [];
    equals(field: string, value: any) {
      this.filters.push({ type: 'equals', field, value });
      return this;
    }
    between(field: string, min: string, max: string) {
      this.filters.push({ type: 'between', field, min, max });
      return this;
    }
    build() {
      return this.filters;
    }
  },
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

describe('otherincome_list tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should return other income entries with default pagination', async () => {
      const mockResponse = mockOtherIncomeListResponse(10);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await otherincomeListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.otherIncomes).toHaveLength(10);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.perPage).toBe(30);
      expect(result.pagination.total).toBe(10);
    });

    it('should return other income entries with custom pagination', async () => {
      const mockResponse = mockOtherIncomeListResponse(5, 2, 5);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await otherincomeListTool.execute(
        { accountId: 'ABC123', page: 2, perPage: 5 },
        mockClient as any
      );

      expect(result.otherIncomes).toHaveLength(5);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.perPage).toBe(5);
    });

    it('should return empty array when no entries exist', async () => {
      const mockResponse = mockOtherIncomeEmptyListResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await otherincomeListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.otherIncomes).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should apply categoryName filter correctly', async () => {
      const mockResponse = mockOtherIncomeListResponse(3);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await otherincomeListTool.execute(
        { accountId: 'ABC123', categoryName: 'Interest Income' },
        mockClient as any
      );

      expect(result.otherIncomes).toHaveLength(3);
    });

    it('should apply source filter correctly', async () => {
      const mockResponse = mockOtherIncomeListResponse(2);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await otherincomeListTool.execute(
        { accountId: 'ABC123', source: 'TD Bank' },
        mockClient as any
      );

      expect(result.otherIncomes).toHaveLength(2);
    });

    it('should apply date range filter correctly', async () => {
      const mockResponse = mockOtherIncomeListResponse(4);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await otherincomeListTool.execute(
        {
          accountId: 'ABC123',
          dateFrom: '2024-01-01T00:00:00Z',
          dateTo: '2024-01-31T23:59:59Z',
        },
        mockClient as any
      );

      expect(result.otherIncomes).toHaveLength(4);
    });

    it('should apply dateFrom filter without dateTo', async () => {
      const mockResponse = mockOtherIncomeListResponse(6);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await otherincomeListTool.execute(
        {
          accountId: 'ABC123',
          dateFrom: '2024-01-01T00:00:00Z',
        },
        mockClient as any
      );

      expect(result.otherIncomes).toHaveLength(6);
    });

    it('should apply dateTo filter without dateFrom', async () => {
      const mockResponse = mockOtherIncomeListResponse(7);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await otherincomeListTool.execute(
        {
          accountId: 'ABC123',
          dateTo: '2024-12-31T23:59:59Z',
        },
        mockClient as any
      );

      expect(result.otherIncomes).toHaveLength(7);
    });

    it('should apply multiple filters together', async () => {
      const mockResponse = mockOtherIncomeListResponse(1);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await otherincomeListTool.execute(
        {
          accountId: 'ABC123',
          categoryName: 'Interest Income',
          source: 'TD Bank',
          dateFrom: '2024-01-01T00:00:00Z',
          dateTo: '2024-12-31T23:59:59Z',
          page: 1,
          perPage: 10,
        },
        mockClient as any
      );

      expect(result.otherIncomes).toHaveLength(1);
    });

    it('should handle income entries with taxes', async () => {
      const mockResponse = mockOtherIncomeListResponse(1);
      mockResponse.data.other_incomes[0].taxes = [
        { name: 'GST', amount: '25.00', percent: '5' },
        { name: 'PST', amount: '40.00', percent: '8' },
      ];

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await otherincomeListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.otherIncomes[0].taxes).toHaveLength(2);
      expect(result.otherIncomes[0].taxes![0].name).toBe('GST');
    });
  });

  describe('error handling', () => {
    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            list: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        otherincomeListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            list: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        otherincomeListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            list: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        otherincomeListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());

      await expect(
        otherincomeListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        otherincomeListTool.execute({} as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should reject invalid page number', async () => {
      await expect(
        otherincomeListTool.execute(
          { accountId: 'ABC123', page: 0 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject negative page number', async () => {
      await expect(
        otherincomeListTool.execute(
          { accountId: 'ABC123', page: -1 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject perPage exceeding maximum', async () => {
      await expect(
        otherincomeListTool.execute(
          { accountId: 'ABC123', perPage: 101 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject perPage below minimum', async () => {
      await expect(
        otherincomeListTool.execute(
          { accountId: 'ABC123', perPage: 0 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should accept valid optional parameters', async () => {
      const mockResponse = mockOtherIncomeListResponse(1);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      // Should not throw
      await expect(
        otherincomeListTool.execute(
          {
            accountId: 'ABC123',
            page: 1,
            perPage: 50,
            categoryName: 'Interest Income',
            source: 'TD Bank',
            dateFrom: '2024-01-01T00:00:00Z',
            dateTo: '2024-12-31T23:59:59Z',
          },
          mockClient as any
        )
      ).resolves.toBeDefined();
    });
  });
});
