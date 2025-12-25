/**
 * Tests for service_rate_get tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { serviceRateGetTool } from '../../../src/tools/service/service-rate-get.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import { createServiceRate } from '../../mocks/factories/service.factory.js';

describe('service_rate_get tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should retrieve service rate', async () => {
      const rate = createServiceRate({ rate: '125.00', code: 'USD' });
      const mockResponse = {
        ok: true,
        data: rate,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          services: {
            rate: {
              single: vi.fn().mockResolvedValue(mockResponse),
            },
          },
        };
        return apiCall(client);
      });

      const result = await serviceRateGetTool.execute(
        { businessId: 12345, serviceId: 123 },
        mockClient as any
      );

      expect(result.rate).toBe('125.00');
      expect(result.code).toBe('USD');
    });

    it('should retrieve rate with different currency', async () => {
      const rate = createServiceRate({ rate: '95.00', code: 'EUR' });
      const mockResponse = {
        ok: true,
        data: rate,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          services: {
            rate: {
              single: vi.fn().mockResolvedValue(mockResponse),
            },
          },
        };
        return apiCall(client);
      });

      const result = await serviceRateGetTool.execute(
        { businessId: 12345, serviceId: 456 },
        mockClient as any
      );

      expect(result.code).toBe('EUR');
    });

    it('should retrieve rate with decimal precision', async () => {
      const rate = createServiceRate({ rate: '149.75' });
      const mockResponse = {
        ok: true,
        data: rate,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          services: {
            rate: {
              single: vi.fn().mockResolvedValue(mockResponse),
            },
          },
        };
        return apiCall(client);
      });

      const result = await serviceRateGetTool.execute(
        { businessId: 12345, serviceId: 789 },
        mockClient as any
      );

      expect(result.rate).toBe('149.75');
    });
  });

  describe('error handling', () => {
    it('should handle rate not found error', async () => {
      const mockResponse = {
        ok: false,
        error: new Error('Rate not found'),
      } as any;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          services: {
            rate: {
              single: vi.fn().mockResolvedValue(mockResponse),
            },
          },
        };
        return apiCall(client);
      });

      await expect(
        serviceRateGetTool.execute(
          { businessId: 12345, serviceId: 99999 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle service not found error', async () => {
      const mockResponse = {
        ok: false,
        error: new Error('Service not found'),
      } as any;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          services: {
            rate: {
              single: vi.fn().mockResolvedValue(mockResponse),
            },
          },
        };
        return apiCall(client);
      });

      await expect(
        serviceRateGetTool.execute(
          { businessId: 12345, serviceId: 88888 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(
        new Error('Unauthorized')
      );

      await expect(
        serviceRateGetTool.execute(
          { businessId: 12345, serviceId: 123 },
          mockClient as any
        )
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('edge cases', () => {
    it('should handle very large rate values', async () => {
      const rate = createServiceRate({ rate: '9999.99' });
      const mockResponse = {
        ok: true,
        data: rate,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          services: {
            rate: {
              single: vi.fn().mockResolvedValue(mockResponse),
            },
          },
        };
        return apiCall(client);
      });

      const result = await serviceRateGetTool.execute(
        { businessId: 12345, serviceId: 111 },
        mockClient as any
      );

      expect(result.rate).toBe('9999.99');
    });

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
              single: vi.fn().mockResolvedValue(mockResponse),
            },
          },
        };
        return apiCall(client);
      });

      const result = await serviceRateGetTool.execute(
        { businessId: 12345, serviceId: 222 },
        mockClient as any
      );

      expect(result.rate).toBe('0.00');
    });
  });
});
