/**
 * Tests for payment_list tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { paymentListTool } from '../../../src/tools/payment/payment-list.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockPaymentListResponse,
  mockPaymentEmptyListResponse,
} from '../../mocks/responses/payment.js';
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
    between(field: string, range: { min: string; max: string }) {
      this.filters.push({ type: 'between', field, range });
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

describe('payment_list tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should return payments with default pagination', async () => {
      const mockResponse = mockPaymentListResponse(10);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.payments).toHaveLength(10);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.perPage).toBe(30);
      expect(result.pagination.total).toBe(10);
    });

    it('should return payments with custom pagination', async () => {
      const mockResponse = mockPaymentListResponse(5, 2, 5);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentListTool.execute(
        { accountId: 'ABC123', page: 2, perPage: 5 },
        mockClient as any
      );

      expect(result.payments).toHaveLength(5);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.perPage).toBe(5);
    });

    it('should return empty array when no payments exist', async () => {
      const mockResponse = mockPaymentEmptyListResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.payments).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should apply invoiceId filter correctly', async () => {
      const mockResponse = mockPaymentListResponse(3);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentListTool.execute(
        { accountId: 'ABC123', invoiceId: 12345 },
        mockClient as any
      );

      expect(result.payments).toHaveLength(3);
    });

    it('should apply clientId filter correctly', async () => {
      const mockResponse = mockPaymentListResponse(5);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentListTool.execute(
        { accountId: 'ABC123', clientId: 56789 },
        mockClient as any
      );

      expect(result.payments).toHaveLength(5);
    });

    it('should apply date range filters correctly', async () => {
      const mockResponse = mockPaymentListResponse(2);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentListTool.execute(
        { accountId: 'ABC123', dateFrom: '2024-01-01', dateTo: '2024-12-31' },
        mockClient as any
      );

      expect(result.payments).toHaveLength(2);
    });

    it('should apply multiple filters together', async () => {
      const mockResponse = mockPaymentListResponse(2);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentListTool.execute(
        {
          accountId: 'ABC123',
          invoiceId: 12345,
          clientId: 56789,
          page: 1,
          perPage: 10,
        },
        mockClient as any
      );

      expect(result.payments).toHaveLength(2);
    });
  });

  describe('error handling', () => {
    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            list: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            list: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          payments: {
            list: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());

      await expect(
        paymentListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        paymentListTool.execute({} as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should reject invalid page number', async () => {
      await expect(
        paymentListTool.execute(
          { accountId: 'ABC123', page: 0 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject perPage exceeding maximum', async () => {
      await expect(
        paymentListTool.execute(
          { accountId: 'ABC123', perPage: 101 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });
});
