/**
 * Tests for service_single tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { serviceSingleTool } from '../../../src/tools/service/service-single.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import { createService } from '../../mocks/factories/service.factory.js';

describe('service_single tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should retrieve a single service by ID', async () => {
      const service = createService({ id: 123, name: 'Development' });
      const mockResponse = {
        ok: true,
        data: service,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          services: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await serviceSingleTool.execute(
        { businessId: 12345, serviceId: 123 },
        mockClient as any
      );

      expect(result.id).toBe(123);
      expect(result.name).toBe('Development');
    });

    it('should retrieve billable service', async () => {
      const service = createService({ id: 456, billable: true });
      const mockResponse = {
        ok: true,
        data: service,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          services: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await serviceSingleTool.execute(
        { businessId: 12345, serviceId: 456 },
        mockClient as any
      );

      expect(result.billable).toBe(true);
    });

    it('should retrieve non-billable service', async () => {
      const service = createService({ id: 789, billable: false });
      const mockResponse = {
        ok: true,
        data: service,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          services: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await serviceSingleTool.execute(
        { businessId: 12345, serviceId: 789 },
        mockClient as any
      );

      expect(result.billable).toBe(false);
    });

    it('should retrieve archived service', async () => {
      const service = createService({ id: 999, visState: 2 });
      const mockResponse = {
        ok: true,
        data: service,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          services: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await serviceSingleTool.execute(
        { businessId: 12345, serviceId: 999 },
        mockClient as any
      );

      expect(result.visState).toBe(2);
    });
  });

  describe('error handling', () => {
    it('should throw when service not found', async () => {
      const mockResponse = {
        ok: false,
        error: new Error('Service not found'),
      } as any;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          services: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      await expect(
        serviceSingleTool.execute(
          { businessId: 12345, serviceId: 99999 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(new Error('Unauthorized'));

      await expect(
        serviceSingleTool.execute(
          { businessId: 12345, serviceId: 123 },
          mockClient as any
        )
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('edge cases', () => {
    it('should handle unicode in service name', async () => {
      const service = createService({ id: 111, name: 'コンサルティング 💼' });
      const mockResponse = {
        ok: true,
        data: service,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          services: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await serviceSingleTool.execute(
        { businessId: 12345, serviceId: 111 },
        mockClient as any
      );

      expect(result.name).toBe('コンサルティング 💼');
    });
  });
});
