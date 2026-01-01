/**
 * Tests for item_single tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { itemSingleTool } from '../../../src/tools/item/item-single.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockItemSingleResponse,
  mockItemNotFoundError,
} from '../../mocks/responses/item.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('item_single tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should return item details by ID', async () => {
      const mockResponse = mockItemSingleResponse({ id: 12345 });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await itemSingleTool.execute(
        { accountId: 'ABC123', itemId: 12345 },
        mockClient as any
      );

      expect(result.id).toBe(12345);
      expect(result.name).toBe('Consulting Service');
    });

    it('should return item with all fields populated', async () => {
      const mockResponse = mockItemSingleResponse({
        id: 99999,
        name: 'Premium Widget',
        description: 'A high-quality widget',
        type: 'product',
        rate: { amount: '75.00', code: 'USD' },
        quantity: 10,
        taxable: true,
        tax1: 'GST',
        tax2: 'PST',
        inventory: 50,
        sku: 'WDG-001',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await itemSingleTool.execute(
        { accountId: 'ABC123', itemId: 99999 },
        mockClient as any
      );

      expect(result.id).toBe(99999);
      expect(result.name).toBe('Premium Widget');
      expect(result.type).toBe('product');
      expect(result.inventory).toBe(50);
      expect(result.sku).toBe('WDG-001');
    });

    it('should return item with null optional fields', async () => {
      const mockResponse = mockItemSingleResponse({
        id: 55555,
        name: 'Basic Service',
        tax1: null,
        tax2: null,
        inventory: null,
        sku: null,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await itemSingleTool.execute(
        { accountId: 'ABC123', itemId: 55555 },
        mockClient as any
      );

      expect(result.id).toBe(55555);
      expect(result.tax1).toBeNull();
      expect(result.inventory).toBeNull();
      expect(result.sku).toBeNull();
    });

    it('should handle different item types', async () => {
      for (const type of ['service', 'product', 'discount']) {
        const mockResponse = mockItemSingleResponse({ type });

        mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
          const client = {
            items: {
              single: vi.fn().mockResolvedValue(mockResponse),
            },
          };
          return apiCall(client);
        });

        const result = await itemSingleTool.execute(
          { accountId: 'ABC123', itemId: 12345 },
          mockClient as any
        );

        expect(result.type).toBe(type);
      }
    });
  });

  describe('error handling', () => {
    it('should handle item not found error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            single: vi.fn().mockResolvedValue(mockItemNotFoundError(99999)),
          },
        };
        return apiCall(client);
      });

      await expect(
        itemSingleTool.execute(
          { accountId: 'ABC123', itemId: 99999 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            single: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        itemSingleTool.execute(
          { accountId: 'ABC123', itemId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            single: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        itemSingleTool.execute(
          { accountId: 'ABC123', itemId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            single: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        itemSingleTool.execute(
          { accountId: 'ABC123', itemId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        itemSingleTool.execute({ itemId: 12345 } as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require itemId', async () => {
      await expect(
        itemSingleTool.execute({ accountId: 'ABC123' } as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should reject negative itemId', async () => {
      await expect(
        itemSingleTool.execute(
          { accountId: 'ABC123', itemId: -1 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject zero itemId', async () => {
      await expect(
        itemSingleTool.execute(
          { accountId: 'ABC123', itemId: 0 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });
});
