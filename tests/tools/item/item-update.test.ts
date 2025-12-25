/**
 * Tests for item_update tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { itemUpdateTool } from '../../../src/tools/item/item-update.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockItemUpdateResponse,
  mockItemNotFoundError,
  mockItemValidationError,
} from '../../mocks/responses/item.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('item_update tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should update item name', async () => {
      const mockResponse = mockItemUpdateResponse(12345, {
        name: 'Updated Service Name',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await itemUpdateTool.execute(
        {
          accountId: 'ABC123',
          itemId: 12345,
          name: 'Updated Service Name',
        },
        mockClient as any
      );

      expect(result.id).toBe(12345);
      expect(result.name).toBe('Updated Service Name');
    });

    it('should update item description', async () => {
      const mockResponse = mockItemUpdateResponse(12345, {
        description: 'Updated description text',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await itemUpdateTool.execute(
        {
          accountId: 'ABC123',
          itemId: 12345,
          description: 'Updated description text',
        },
        mockClient as any
      );

      expect(result.description).toBe('Updated description text');
    });

    it('should update item rate', async () => {
      const mockResponse = mockItemUpdateResponse(12345, {
        rate: { amount: '200.00', code: 'USD' },
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await itemUpdateTool.execute(
        {
          accountId: 'ABC123',
          itemId: 12345,
          rate: { amount: '200.00', code: 'USD' },
        },
        mockClient as any
      );

      expect(result.rate.amount).toBe('200.00');
    });

    it('should update item type', async () => {
      const mockResponse = mockItemUpdateResponse(12345, {
        type: 'product',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await itemUpdateTool.execute(
        {
          accountId: 'ABC123',
          itemId: 12345,
          type: 'product',
        },
        mockClient as any
      );

      expect(result.type).toBe('product');
    });

    it('should update item inventory', async () => {
      const mockResponse = mockItemUpdateResponse(12345, {
        inventory: 75,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await itemUpdateTool.execute(
        {
          accountId: 'ABC123',
          itemId: 12345,
          inventory: 75,
        },
        mockClient as any
      );

      expect(result.inventory).toBe(75);
    });

    it('should update item sku', async () => {
      const mockResponse = mockItemUpdateResponse(12345, {
        sku: 'NEW-SKU-002',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await itemUpdateTool.execute(
        {
          accountId: 'ABC123',
          itemId: 12345,
          sku: 'NEW-SKU-002',
        },
        mockClient as any
      );

      expect(result.sku).toBe('NEW-SKU-002');
    });

    it('should update item tax settings', async () => {
      const mockResponse = mockItemUpdateResponse(12345, {
        taxable: false,
        tax1: null,
        tax2: null,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await itemUpdateTool.execute(
        {
          accountId: 'ABC123',
          itemId: 12345,
          taxable: false,
        },
        mockClient as any
      );

      expect(result.taxable).toBe(false);
    });

    it('should update multiple fields at once', async () => {
      const mockResponse = mockItemUpdateResponse(12345, {
        name: 'Updated Name',
        description: 'Updated Description',
        rate: { amount: '250.00', code: 'USD' },
        type: 'service',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await itemUpdateTool.execute(
        {
          accountId: 'ABC123',
          itemId: 12345,
          name: 'Updated Name',
          description: 'Updated Description',
          rate: { amount: '250.00', code: 'USD' },
          type: 'service',
        },
        mockClient as any
      );

      expect(result.name).toBe('Updated Name');
      expect(result.description).toBe('Updated Description');
      expect(result.rate.amount).toBe('250.00');
      expect(result.type).toBe('service');
    });
  });

  describe('error handling', () => {
    it('should handle item not found error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            update: vi.fn().mockResolvedValue(mockItemNotFoundError(99999)),
          },
        };
        return apiCall(client);
      });

      await expect(
        itemUpdateTool.execute(
          { accountId: 'ABC123', itemId: 99999, name: 'test' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            update: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        itemUpdateTool.execute(
          { accountId: 'ABC123', itemId: 12345, name: 'test' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            update: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        itemUpdateTool.execute(
          { accountId: 'ABC123', itemId: 12345, name: 'test' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            update: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        itemUpdateTool.execute(
          { accountId: 'ABC123', itemId: 12345, name: 'test' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle validation error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            update: vi.fn().mockResolvedValue(
              mockItemValidationError('name', 'Invalid name format')
            ),
          },
        };
        return apiCall(client);
      });

      await expect(
        itemUpdateTool.execute(
          { accountId: 'ABC123', itemId: 12345, name: 'test' },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        itemUpdateTool.execute(
          { itemId: 12345, name: 'test' } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should require itemId', async () => {
      await expect(
        itemUpdateTool.execute(
          { accountId: 'ABC123', name: 'test' } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject negative itemId', async () => {
      await expect(
        itemUpdateTool.execute(
          { accountId: 'ABC123', itemId: -1, name: 'test' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject zero itemId', async () => {
      await expect(
        itemUpdateTool.execute(
          { accountId: 'ABC123', itemId: 0, name: 'test' },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });
});
