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

    it('should create item with unitCost', async () => {
      const mockResponse = mockItemCreateResponse({
        unitCost: { amount: '150.00', code: 'USD' },
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
        { ...validInput, unitCost: { amount: '150.00', code: 'USD' } },
        mockClient as any
      );

      expect(result.unitCost.amount).toBe('150.00');
      expect(result.unitCost.code).toBe('USD');
    });

    // Contract test: proves the tool forwards the SDK-recognized wire fields.
    // This is the assertion the old return-shape tests lacked — without it, the
    // bug where the tool sent `rate`/`quantity` (silently dropped by the SDK,
    // so items were created with no price) passed every test.
    it('forwards unitCost/qty/tax as the SDK-recognized fields (wire contract)', async () => {
      const createSpy = vi
        .fn()
        .mockResolvedValue(mockItemCreateResponse({ name: 'Consulting' }));

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) =>
        apiCall({ items: { create: createSpy } } as any)
      );

      await itemCreateTool.execute(
        {
          accountId: 'ABC123',
          name: 'Consulting',
          unitCost: { amount: '150.00', code: 'USD' },
          qty: '2',
          tax1: 5,
        },
        mockClient as any
      );

      expect(createSpy).toHaveBeenCalledTimes(1);
      // SDK signature: items.create(accountId, payload)
      const [accountIdArg, payload] = createSpy.mock.calls[0];
      expect(accountIdArg).toBe('ABC123');
      expect(payload).toMatchObject({
        unitCost: { amount: '150.00', code: 'USD' },
        qty: '2',
        tax1: 5,
      });
      // Regression guard: the legacy names the SDK ignores must NOT be sent.
      expect(payload).not.toHaveProperty('rate');
      expect(payload).not.toHaveProperty('quantity');
    });

    it('should create product item with inventory', async () => {
      const mockResponse = mockItemCreateResponse({
        name: 'Widget',
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
          inventory: 100,
          sku: 'WDG-001',
        },
        mockClient as any
      );

      expect(result.inventory).toBe(100);
      expect(result.sku).toBe('WDG-001');
    });

    it('should create item with tax settings (taxability is via tax ids)', async () => {
      // Input tax ids are integers; the SDK returns them as strings. The item
      // has no `taxable` boolean — taxability is controlled by tax1/tax2.
      const mockResponse = mockItemCreateResponse({
        tax1: '5',
        tax2: '6',
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
          tax1: 5,
          tax2: 6,
        },
        mockClient as any
      );

      expect(result.tax1).toBe('5');
      expect(result.tax2).toBe('6');
    });

    it('should create item with all optional fields', async () => {
      const mockResponse = mockItemCreateResponse({
        name: 'Premium Package',
        description: 'All-inclusive package',
        unitCost: { amount: '500.00', code: 'USD' },
        qty: '1',
        tax1: '5',
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
          unitCost: { amount: '500.00', code: 'USD' },
          qty: '1',
          tax1: 5,
          sku: 'PKG-001',
        },
        mockClient as any
      );

      expect(result.name).toBe('Premium Package');
      expect(result.unitCost.amount).toBe('500.00');
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
