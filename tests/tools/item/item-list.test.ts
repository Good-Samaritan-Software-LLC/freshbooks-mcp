/**
 * Tests for item_list tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { itemListTool } from '../../../src/tools/item/item-list.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockItemListResponse,
  mockItemEmptyListResponse,
} from '../../mocks/responses/item.js';
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

describe('item_list tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should return items with default pagination', async () => {
      const mockResponse = mockItemListResponse(10);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await itemListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.items).toHaveLength(10);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.perPage).toBe(30);
      expect(result.pagination.total).toBe(10);
    });

    it('should return items with custom pagination', async () => {
      const mockResponse = mockItemListResponse(5, 2, 5);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await itemListTool.execute(
        { accountId: 'ABC123', page: 2, perPage: 5 },
        mockClient as any
      );

      expect(result.items).toHaveLength(5);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.perPage).toBe(5);
    });

    it('should return empty array when no items exist', async () => {
      const mockResponse = mockItemEmptyListResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await itemListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.items).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should apply name filter correctly', async () => {
      const mockResponse = mockItemListResponse(3);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await itemListTool.execute(
        { accountId: 'ABC123', name: 'Consulting' },
        mockClient as any
      );

      expect(result.items).toHaveLength(3);
    });

    it('should apply type filter correctly', async () => {
      const mockResponse = mockItemListResponse(5);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await itemListTool.execute(
        { accountId: 'ABC123', type: 'service' },
        mockClient as any
      );

      expect(result.items).toHaveLength(5);
    });

    it('should apply sku filter correctly', async () => {
      const mockResponse = mockItemListResponse(1);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await itemListTool.execute(
        { accountId: 'ABC123', sku: 'SKU-001' },
        mockClient as any
      );

      expect(result.items).toHaveLength(1);
    });

    it('should apply multiple filters together', async () => {
      const mockResponse = mockItemListResponse(2);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await itemListTool.execute(
        {
          accountId: 'ABC123',
          name: 'Consulting',
          type: 'service',
          page: 1,
          perPage: 10,
        },
        mockClient as any
      );

      expect(result.items).toHaveLength(2);
    });
  });

  describe('error handling', () => {
    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            list: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        itemListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            list: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        itemListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            list: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        itemListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());

      await expect(
        itemListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        itemListTool.execute({} as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should reject invalid page number', async () => {
      await expect(
        itemListTool.execute(
          { accountId: 'ABC123', page: 0 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject perPage exceeding maximum', async () => {
      await expect(
        itemListTool.execute(
          { accountId: 'ABC123', perPage: 101 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });
});
