/**
 * Tests for service_rate_set tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { serviceRateSetTool } from '../../../src/tools/service/service-rate-set.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import { createServiceRate } from '../../mocks/factories/service.factory.js';

describe('service_rate_set tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should create new service rate', async () => {
      const rate = createServiceRate({ rate: '150.00', code: 'USD' });
      const mockResponse = {
        ok: true,
        data: rate,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          services: {
            rate: {
              create: vi.fn().mockResolvedValue(mockResponse),
            },
          },
        };
        return apiCall(client);
      });

      const result = await serviceRateSetTool.execute(
        { businessId: 12345, serviceId: 123, rate: '150.00', code: 'USD' },
        mockClient as any
      );

      expect(result.rate).toBe('150.00');
      expect(result.code).toBe('USD');
    });

    it('should update existing service rate when create fails', async () => {
      const rate = createServiceRate({ rate: '175.00' });
      const createMock = vi.fn();
      const updateMock = vi.fn();

      // First call (create) fails
      createMock.mockResolvedValueOnce({
        ok: false,
        error: { message: 'Rate already exists' },
      } as any);

      // Second call (update) succeeds
      updateMock.mockResolvedValueOnce({
        ok: true,
        data: rate,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          services: {
            rate: {
              create: createMock,
              update: updateMock,
            },
          },
        };
        return apiCall(client);
      });

      const result = await serviceRateSetTool.execute(
        { businessId: 12345, serviceId: 456, rate: '175.00' },
        mockClient as any
      );

      expect(result.rate).toBe('175.00');
      expect(createMock).toHaveBeenCalled();
      expect(updateMock).toHaveBeenCalled();
    });

    it('should set rate with custom currency', async () => {
      const rate = createServiceRate({ rate: '100.00', code: 'EUR' });
      const mockResponse = {
        ok: true,
        data: rate,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          services: {
            rate: {
              create: vi.fn().mockResolvedValue(mockResponse),
            },
          },
        };
        return apiCall(client);
      });

      const result = await serviceRateSetTool.execute(
        { businessId: 12345, serviceId: 789, rate: '100.00', code: 'EUR' },
        mockClient as any
      );

      expect(result.code).toBe('EUR');
    });

    it('should set rate with decimal values', async () => {
      const rate = createServiceRate({ rate: '125.75' });
      const mockResponse = {
        ok: true,
        data: rate,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          services: {
            rate: {
              create: vi.fn().mockResolvedValue(mockResponse),
            },
          },
        };
        return apiCall(client);
      });

      const result = await serviceRateSetTool.execute(
        { businessId: 12345, serviceId: 111, rate: '125.75' },
        mockClient as any
      );

      expect(result.rate).toBe('125.75');
    });

    it('should use USD as default currency', async () => {
      const rate = createServiceRate({ rate: '95.00', code: 'USD' });
      const mockResponse = {
        ok: true,
        data: rate,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          services: {
            rate: {
              create: vi.fn().mockResolvedValue(mockResponse),
            },
          },
        };
        return apiCall(client);
      });

      const result = await serviceRateSetTool.execute(
        { businessId: 12345, serviceId: 222, rate: '95.00' },
        mockClient as any
      );

      expect(result.code).toBe('USD');
    });
  });

  describe('error handling', () => {
    it('should handle service not found error', async () => {
      const createMock = vi.fn();
      const updateMock = vi.fn();

      createMock.mockResolvedValueOnce({
        ok: false,
        error: new Error('Service not found'),
      } as any);

      updateMock.mockResolvedValueOnce({
        ok: false,
        error: new Error('Service not found'),
      } as any);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          services: {
            rate: {
              create: createMock,
              update: updateMock,
            },
          },
        };
        return apiCall(client);
      });

      await expect(
        serviceRateSetTool.execute(
          { businessId: 12345, serviceId: 99999, rate: '100.00' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle invalid rate format', async () => {
      const mockResponse = {
        ok: false,
        error: new Error('Invalid rate format'),
      } as any;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          services: {
            rate: {
              create: vi.fn().mockResolvedValue(mockResponse),
            },
          },
        };
        return apiCall(client);
      });

      await expect(
        serviceRateSetTool.execute(
          { businessId: 12345, serviceId: 123, rate: 'invalid' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(
        new Error('Unauthorized')
      );

      await expect(
        serviceRateSetTool.execute(
          { businessId: 12345, serviceId: 123, rate: '100.00' },
          mockClient as any
        )
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('edge cases', () => {
    it('should handle zero rate', async () => {
      const rate = createServiceRate({ rate: '0.00' });
      const mockResponse = {
        ok: true,
        data: rate,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          services: {
            rate: {
              create: vi.fn().mockResolvedValue(mockResponse),
            },
          },
        };
        return apiCall(client);
      });

      const result = await serviceRateSetTool.execute(
        { businessId: 12345, serviceId: 333, rate: '0.00' },
        mockClient as any
      );

      expect(result.rate).toBe('0.00');
    });

    it('should handle very large rate values', async () => {
      const rate = createServiceRate({ rate: '99999.99' });
      const mockResponse = {
        ok: true,
        data: rate,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          services: {
            rate: {
              create: vi.fn().mockResolvedValue(mockResponse),
            },
          },
        };
        return apiCall(client);
      });

      const result = await serviceRateSetTool.execute(
        { businessId: 12345, serviceId: 444, rate: '99999.99' },
        mockClient as any
      );

      expect(result.rate).toBe('99999.99');
    });

    it('should handle rate with high precision decimals', async () => {
      const rate = createServiceRate({ rate: '125.9999' });
      const mockResponse = {
        ok: true,
        data: rate,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          services: {
            rate: {
              create: vi.fn().mockResolvedValue(mockResponse),
            },
          },
        };
        return apiCall(client);
      });

      const result = await serviceRateSetTool.execute(
        { businessId: 12345, serviceId: 555, rate: '125.9999' },
        mockClient as any
      );

      expect(result.rate).toBe('125.9999');
    });
  });
});
