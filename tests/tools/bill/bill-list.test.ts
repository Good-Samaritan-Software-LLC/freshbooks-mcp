/**
 * Tests for bill_list tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { billListTool } from '../../../src/tools/bill/bill-list.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockBillListResponse,
  mockBillEmptyListResponse,
} from '../../mocks/responses/bill.js';
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
    like(field: string, value: string) {
      this.filters.push({ type: 'like', field, value });
      return this;
    }
    between(field: string, range: { min: string; max: string }) {
      this.filters.push({ type: 'between', field, min: range.min, max: range.max });
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

describe('bill_list tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should return bills with default pagination', async () => {
      const mockResponse = mockBillListResponse(10);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.bills).toHaveLength(10);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.perPage).toBe(30);
      expect(result.pagination.total).toBe(10);
    });

    it('should return bills with custom pagination', async () => {
      const mockResponse = mockBillListResponse(5, 2, 5);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billListTool.execute(
        { accountId: 'ABC123', page: 2, perPage: 5 },
        mockClient as any
      );

      expect(result.bills).toHaveLength(5);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.perPage).toBe(5);
    });

    it('should return empty array when no bills exist', async () => {
      const mockResponse = mockBillEmptyListResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.bills).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should apply vendorId filter correctly', async () => {
      const mockResponse = mockBillListResponse(3);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billListTool.execute(
        { accountId: 'ABC123', vendorId: 5001 },
        mockClient as any
      );

      expect(result.bills).toHaveLength(3);
    });

    it('should apply status filter correctly', async () => {
      const mockResponse = mockBillListResponse(5);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billListTool.execute(
        { accountId: 'ABC123', status: 'unpaid' },
        mockClient as any
      );

      expect(result.bills).toHaveLength(5);
    });

    it('should apply date range filter with startDate only', async () => {
      const mockResponse = mockBillListResponse(4);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billListTool.execute(
        { accountId: 'ABC123', startDate: '2024-01-01' },
        mockClient as any
      );

      expect(result.bills).toHaveLength(4);
    });

    it('should apply date range filter with endDate only', async () => {
      const mockResponse = mockBillListResponse(6);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billListTool.execute(
        { accountId: 'ABC123', endDate: '2024-12-31' },
        mockClient as any
      );

      expect(result.bills).toHaveLength(6);
    });

    it('should apply date range filter with both dates', async () => {
      const mockResponse = mockBillListResponse(8);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billListTool.execute(
        {
          accountId: 'ABC123',
          startDate: '2024-01-01',
          endDate: '2024-06-30',
        },
        mockClient as any
      );

      expect(result.bills).toHaveLength(8);
    });

    it('should apply multiple filters together', async () => {
      const mockResponse = mockBillListResponse(2);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billListTool.execute(
        {
          accountId: 'ABC123',
          vendorId: 5001,
          status: 'unpaid',
          page: 1,
          perPage: 10,
        },
        mockClient as any
      );

      expect(result.bills).toHaveLength(2);
    });

    it('should handle all status types', async () => {
      const statuses = ['unpaid', 'partial', 'paid', 'overdue'] as const;

      for (const status of statuses) {
        const mockResponse = mockBillListResponse(1);
        mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
          const client = {
            bills: {
              list: vi.fn().mockResolvedValue(mockResponse),
            },
          };
          return apiCall(client);
        });

        const result = await billListTool.execute(
          { accountId: 'ABC123', status },
          mockClient as any
        );

        expect(result.bills).toHaveLength(1);
      }
    });
  });

  describe('error handling', () => {
    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            list: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        billListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            list: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        billListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            list: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        billListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());

      await expect(
        billListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        billListTool.execute({} as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should reject invalid page number', async () => {
      await expect(
        billListTool.execute(
          { accountId: 'ABC123', page: 0 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject perPage exceeding maximum', async () => {
      await expect(
        billListTool.execute(
          { accountId: 'ABC123', perPage: 101 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject negative page number', async () => {
      await expect(
        billListTool.execute(
          { accountId: 'ABC123', page: -1 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject negative perPage', async () => {
      await expect(
        billListTool.execute(
          { accountId: 'ABC123', perPage: -1 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });
});
