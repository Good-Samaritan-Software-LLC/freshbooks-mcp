/**
 * Tests for item_create tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { itemCreateTool } from '../../../src/tools/item/item-create.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockItemCreateResponse,
  mockItemValidationError,
} from '../../mocks/responses/item.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('item_create tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  const validInput = {
    accountId: 'ABC123',
    name: 'New Service Item',
  };

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should create item with required fields only', async () => {
      const mockResponse = mockItemCreateResponse({
        name: 'New Service Item',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await itemCreateTool.execute(validInput, mockClient as any);

      expect(result.id).toBe(99999);
      expect(result.name).toBe('New Service Item');
    });

    it('should create item with description', async () => {
      const mockResponse = mockItemCreateResponse({
        name: 'Consulting Service',
        description: 'Professional consulting at hourly rate',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await itemCreateTool.execute(
        { ...validInput, description: 'Professional consulting at hourly rate' },
        mockClient as any
      );

      expect(result.description).toBe('Professional consulting at hourly rate');
    });

    it('should create item with rate', async () => {
      const mockResponse = mockItemCreateResponse({
        rate: { amount: '150.00', code: 'USD' },
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await itemCreateTool.execute(
        { ...validInput, rate: { amount: '150.00', code: 'USD' } },
        mockClient as any
      );

      expect(result.rate.amount).toBe('150.00');
      expect(result.rate.code).toBe('USD');
    });

    it('should create product item with inventory', async () => {
      const mockResponse = mockItemCreateResponse({
        name: 'Widget',
        type: 'product',
        inventory: 100,
        sku: 'WDG-001',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await itemCreateTool.execute(
        {
          ...validInput,
          name: 'Widget',
          type: 'product',
          inventory: 100,
          sku: 'WDG-001',
        },
        mockClient as any
      );

      expect(result.type).toBe('product');
      expect(result.inventory).toBe(100);
      expect(result.sku).toBe('WDG-001');
    });

    it('should create item with tax settings', async () => {
      const mockResponse = mockItemCreateResponse({
        taxable: true,
        tax1: 'GST',
        tax2: 'PST',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await itemCreateTool.execute(
        {
          ...validInput,
          taxable: true,
          tax1: 'GST',
          tax2: 'PST',
        },
        mockClient as any
      );

      expect(result.taxable).toBe(true);
      expect(result.tax1).toBe('GST');
      expect(result.tax2).toBe('PST');
    });

    it('should create item with all optional fields', async () => {
      const mockResponse = mockItemCreateResponse({
        name: 'Premium Package',
        description: 'All-inclusive package',
        type: 'service',
        rate: { amount: '500.00', code: 'USD' },
        quantity: 1,
        taxable: true,
        tax1: 'GST',
        sku: 'PKG-001',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await itemCreateTool.execute(
        {
          ...validInput,
          name: 'Premium Package',
          description: 'All-inclusive package',
          type: 'service',
          rate: { amount: '500.00', code: 'USD' },
          quantity: 1,
          taxable: true,
          tax1: 'GST',
          sku: 'PKG-001',
        },
        mockClient as any
      );

      expect(result.name).toBe('Premium Package');
      expect(result.rate.amount).toBe('500.00');
      expect(result.sku).toBe('PKG-001');
    });
  });

  describe('error handling', () => {
    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            create: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        itemCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            create: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        itemCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            create: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        itemCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle validation error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          items: {
            create: vi.fn().mockResolvedValue(
              mockItemValidationError('name', 'Name is required')
            ),
          },
        };
        return apiCall(client);
      });

      await expect(
        itemCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      const input = { name: 'Test Item' };

      await expect(
        itemCreateTool.execute(input as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require name', async () => {
      const input = { accountId: 'ABC123' };

      await expect(
        itemCreateTool.execute(input as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should reject empty name', async () => {
      await expect(
        itemCreateTool.execute(
          { accountId: 'ABC123', name: '' },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });
});
