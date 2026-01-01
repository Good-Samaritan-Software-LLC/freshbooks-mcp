/**
 * Tests for service_list tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { serviceListTool } from '../../../src/tools/service/service-list.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import { createServiceList } from '../../mocks/factories/service.factory.js';

describe('service_list tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should list services with default pagination', async () => {
      const services = createServiceList(10);
      const mockResponse = {
        ok: true,
        data: {
          services,
          pages: { page: 1, pages: 1, perPage: 30, total: 10 },
        },
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          services: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await serviceListTool.execute(
        { businessId: 12345 },
        mockClient as any
      );

      expect(result.services).toHaveLength(10);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.perPage).toBe(30);
    });

    it('should list services with custom pagination', async () => {
      const services = createServiceList(5);
      const mockResponse = {
        ok: true,
        data: {
          services,
          pages: { page: 2, pages: 3, perPage: 5, total: 15 },
        },
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          services: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await serviceListTool.execute(
        { businessId: 12345, page: 2, perPage: 5 },
        mockClient as any
      );

      expect(result.services).toHaveLength(5);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.perPage).toBe(5);
    });

    it('should return empty array when no services exist', async () => {
      const mockResponse = {
        ok: true,
        data: {
          services: [],
          pages: { page: 1, pages: 1, perPage: 30, total: 0 },
        },
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          services: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await serviceListTool.execute(
        { businessId: 12345 },
        mockClient as any
      );

      expect(result.services).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should handle maximum pagination value', async () => {
      const services = createServiceList(100);
      const mockResponse = {
        ok: true,
        data: {
          services,
          pages: { page: 1, pages: 1, perPage: 100, total: 100 },
        },
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          services: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await serviceListTool.execute(
        { businessId: 12345, perPage: 100 },
        mockClient as any
      );

      expect(result.services).toHaveLength(100);
    });
  });

  describe('error handling', () => {
    it('should throw error when API returns not ok', async () => {
      const mockResponse = {
        ok: false,
        error: new Error('API Error'),
      } as any;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          services: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      await expect(
        serviceListTool.execute({ businessId: 12345 }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(new Error('Unauthorized'));

      await expect(
        serviceListTool.execute({ businessId: 12345 }, mockClient as any)
      ).rejects.toThrow('Unauthorized');
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(new Error('ETIMEDOUT'));

      await expect(
        serviceListTool.execute({ businessId: 12345 }, mockClient as any)
      ).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle services with different visStates', async () => {
      const services = [
        ...createServiceList(3, { visState: 0 }), // active
        ...createServiceList(2, { visState: 2 }), // archived
      ];
      const mockResponse = {
        ok: true,
        data: {
          services,
          pages: { page: 1, pages: 1, perPage: 30, total: 5 },
        },
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          services: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await serviceListTool.execute(
        { businessId: 12345 },
        mockClient as any
      );

      expect(result.services).toHaveLength(5);
    });

    it('should handle unicode in service names', async () => {
      const services = createServiceList(1, { name: 'サービス 🔧' });
      const mockResponse = {
        ok: true,
        data: {
          services,
          pages: { page: 1, pages: 1, perPage: 30, total: 1 },
        },
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          services: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await serviceListTool.execute(
        { businessId: 12345 },
        mockClient as any
      );

      expect(result.services[0].name).toBe('サービス 🔧');
    });
  });
});
