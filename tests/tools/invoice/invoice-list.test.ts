/**
 * Tests for invoice_list tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { invoiceListTool } from '../../../src/tools/invoice/invoice-list.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockInvoiceListResponse,
  mockInvoiceEmptyListResponse,
} from '../../mocks/responses/invoice.js';
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
    like(field: string, value: string) {
      this.filters.push({ type: 'like', field, value });
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

describe('invoice_list tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should return invoices with default pagination', async () => {
      const mockResponse = mockInvoiceListResponse(10);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.invoices).toHaveLength(10);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.perPage).toBe(30);
      expect(result.pagination.total).toBe(10);
    });

    it('should return invoices with custom pagination', async () => {
      const mockResponse = mockInvoiceListResponse(5, 2, 5);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceListTool.execute(
        { accountId: 'ABC123', page: 2, perPage: 5 },
        mockClient as any
      );

      expect(result.invoices).toHaveLength(5);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.perPage).toBe(5);
    });

    it('should return empty array when no invoices exist', async () => {
      const mockResponse = mockInvoiceEmptyListResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.invoices).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should apply customerId filter correctly', async () => {
      const mockResponse = mockInvoiceListResponse(3);
      let capturedQueryBuilders: any[] = [];

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            list: vi.fn((accountId, queryBuilders) => {
              capturedQueryBuilders = queryBuilders;
              return Promise.resolve(mockResponse);
            }),
          },
        };
        return apiCall(client);
      });

      await invoiceListTool.execute(
        { accountId: 'ABC123', customerId: 12345 },
        mockClient as any
      );

      expect(capturedQueryBuilders).toBeDefined();
      expect(capturedQueryBuilders.length).toBeGreaterThan(0);
    });

    it('should apply status filter correctly', async () => {
      const mockResponse = mockInvoiceListResponse(5);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceListTool.execute(
        { accountId: 'ABC123', status: 'sent' },
        mockClient as any
      );

      expect(result.invoices).toHaveLength(5);
    });

    it('should apply paymentStatus filter correctly', async () => {
      const mockResponse = mockInvoiceListResponse(3);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceListTool.execute(
        { accountId: 'ABC123', paymentStatus: 'unpaid' },
        mockClient as any
      );

      expect(result.invoices).toHaveLength(3);
    });

    it('should apply date range filters correctly', async () => {
      const mockResponse = mockInvoiceListResponse(2);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceListTool.execute(
        { accountId: 'ABC123', dateMin: '2024-01-01', dateMax: '2024-12-31' },
        mockClient as any
      );

      expect(result.invoices).toHaveLength(2);
    });

    it('should apply updatedSince filter correctly', async () => {
      const mockResponse = mockInvoiceListResponse(4);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceListTool.execute(
        { accountId: 'ABC123', updatedSince: '2024-01-01T00:00:00Z' },
        mockClient as any
      );

      expect(result.invoices).toHaveLength(4);
    });

    it('should apply multiple filters together', async () => {
      const mockResponse = mockInvoiceListResponse(2);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceListTool.execute(
        {
          accountId: 'ABC123',
          customerId: 12345,
          status: 'sent',
          paymentStatus: 'unpaid',
          page: 1,
          perPage: 10,
        },
        mockClient as any
      );

      expect(result.invoices).toHaveLength(2);
    });
  });

  describe('error handling', () => {
    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            list: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        invoiceListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            list: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        invoiceListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            list: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        invoiceListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());

      await expect(
        invoiceListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        invoiceListTool.execute({} as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should reject invalid page number (zero)', async () => {
      await expect(
        invoiceListTool.execute(
          { accountId: 'ABC123', page: 0 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject invalid page number (negative)', async () => {
      await expect(
        invoiceListTool.execute(
          { accountId: 'ABC123', page: -1 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject perPage exceeding maximum', async () => {
      await expect(
        invoiceListTool.execute(
          { accountId: 'ABC123', perPage: 101 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject perPage less than 1', async () => {
      await expect(
        invoiceListTool.execute(
          { accountId: 'ABC123', perPage: 0 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle maximum pagination values', async () => {
      const mockResponse = mockInvoiceListResponse(100, 1, 100);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceListTool.execute(
        { accountId: 'ABC123', perPage: 100 },
        mockClient as any
      );

      expect(result.invoices).toHaveLength(100);
    });

    it('should handle invoices with null optional fields', async () => {
      const mockResponse = mockInvoiceListResponse(1);
      mockResponse.data.invoices[0].dueDate = null;
      mockResponse.data.invoices[0].notes = null;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.invoices[0].dueDate).toBeNull();
    });

    it('should handle request beyond last page', async () => {
      const mockResponse = mockInvoiceListResponse(0, 999, 30);
      mockResponse.data.invoices = [];

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceListTool.execute(
        { accountId: 'ABC123', page: 999 },
        mockClient as any
      );

      expect(result.invoices).toHaveLength(0);
    });
  });
});
