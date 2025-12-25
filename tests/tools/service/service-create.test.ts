/**
 * Tests for service_create tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { serviceCreateTool } from '../../../src/tools/service/service-create.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import { createService } from '../../mocks/factories/service.factory.js';

describe('service_create tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful creation', () => {
    it('should create billable service with name', async () => {
      const service = createService({ name: 'Development', billable: true });
      const mockResponse = {
        ok: true,
        data: service,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          services: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await serviceCreateTool.execute(
        { businessId: 12345, name: 'Development', billable: true },
        mockClient as any
      );

      expect(result.name).toBe('Development');
      expect(result.billable).toBe(true);
    });

    it('should create billable service by default', async () => {
      const service = createService({ name: 'Consulting', billable: true });
      const mockResponse = {
        ok: true,
        data: service,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          services: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await serviceCreateTool.execute(
        { businessId: 12345, name: 'Consulting' },
        mockClient as any
      );

      expect(result.billable).toBe(true);
    });

    it('should create non-billable service', async () => {
      const service = createService({ name: 'Internal', billable: false });
      const mockResponse = {
        ok: true,
        data: service,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          services: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await serviceCreateTool.execute(
        { businessId: 12345, name: 'Internal', billable: false },
        mockClient as any
      );

      expect(result.billable).toBe(false);
    });

    it('should create service with unicode name', async () => {
      const service = createService({ name: 'デザイン 🎨' });
      const mockResponse = {
        ok: true,
        data: service,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          services: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await serviceCreateTool.execute(
        { businessId: 12345, name: 'デザイン 🎨' },
        mockClient as any
      );

      expect(result.name).toBe('デザイン 🎨');
    });
  });

  describe('error handling', () => {
    it('should handle validation error for empty name', async () => {
      const mockResponse = {
        ok: false,
        error: new Error('Name is required'),
      } as any;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          services: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      await expect(
        serviceCreateTool.execute(
          { businessId: 12345, name: '' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle duplicate service error', async () => {
      const mockResponse = {
        ok: false,
        error: new Error('Service already exists'),
      } as any;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          services: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      await expect(
        serviceCreateTool.execute(
          { businessId: 12345, name: 'Duplicate' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(new Error('Unauthorized'));

      await expect(
        serviceCreateTool.execute(
          { businessId: 12345, name: 'Test' },
          mockClient as any
        )
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('edge cases', () => {
    it('should handle very long service name', async () => {
      const longName = 'A'.repeat(255);
      const service = createService({ name: longName });
      const mockResponse = {
        ok: true,
        data: service,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          services: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await serviceCreateTool.execute(
        { businessId: 12345, name: longName },
        mockClient as any
      );

      expect(result.name).toBe(longName);
    });
  });
});
