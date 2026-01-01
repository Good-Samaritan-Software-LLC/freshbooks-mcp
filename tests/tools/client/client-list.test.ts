/**
 * Tests for client_list tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clientListTool } from '../../../src/tools/client/client-list.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockClientListResponse,
  mockClientEmptyListResponse,
} from '../../mocks/responses/client.js';
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

describe('client_list tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should return clients with default pagination', async () => {
      const mockResponse = mockClientListResponse(10);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await clientListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.clients).toHaveLength(10);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.perPage).toBe(30);
      expect(result.pagination.total).toBe(10);
    });

    it('should return clients with custom pagination', async () => {
      const mockResponse = mockClientListResponse(5, 2, 5);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await clientListTool.execute(
        { accountId: 'ABC123', page: 2, perPage: 5 },
        mockClient as any
      );

      expect(result.clients).toHaveLength(5);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.perPage).toBe(5);
    });

    it('should return empty array when no clients exist', async () => {
      const mockResponse = mockClientEmptyListResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await clientListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.clients).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should apply email filter correctly', async () => {
      const mockResponse = mockClientListResponse(1);
      let capturedQueryBuilders: any[] = [];

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            list: vi.fn((accountId, queryBuilders) => {
              capturedQueryBuilders = queryBuilders;
              return Promise.resolve(mockResponse);
            }),
          },
        };
        return apiCall(client);
      });

      await clientListTool.execute(
        { accountId: 'ABC123', email: 'test@example.com' },
        mockClient as any
      );

      expect(capturedQueryBuilders).toBeDefined();
      expect(capturedQueryBuilders.length).toBeGreaterThan(0);
    });

    it('should apply organization filter correctly', async () => {
      const mockResponse = mockClientListResponse(3);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await clientListTool.execute(
        { accountId: 'ABC123', organization: 'Acme' },
        mockClient as any
      );

      expect(result.clients).toHaveLength(3);
    });

    it('should apply name filters correctly', async () => {
      const mockResponse = mockClientListResponse(2);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await clientListTool.execute(
        { accountId: 'ABC123', fName: 'John', lName: 'Doe' },
        mockClient as any
      );

      expect(result.clients).toHaveLength(2);
    });

    it('should apply visState filter correctly', async () => {
      const mockResponse = mockClientListResponse(5);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await clientListTool.execute(
        { accountId: 'ABC123', visState: 0 },
        mockClient as any
      );

      expect(result.clients).toHaveLength(5);
    });

    it('should apply multiple filters together', async () => {
      const mockResponse = mockClientListResponse(2);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await clientListTool.execute(
        {
          accountId: 'ABC123',
          organization: 'Acme',
          visState: 0,
          page: 1,
          perPage: 10,
        },
        mockClient as any
      );

      expect(result.clients).toHaveLength(2);
    });
  });

  describe('error handling', () => {
    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            list: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        clientListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            list: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        clientListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            list: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        clientListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());

      await expect(
        clientListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        clientListTool.execute({} as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should reject invalid page number (zero)', async () => {
      await expect(
        clientListTool.execute(
          { accountId: 'ABC123', page: 0 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject invalid page number (negative)', async () => {
      await expect(
        clientListTool.execute(
          { accountId: 'ABC123', page: -1 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject perPage exceeding maximum', async () => {
      await expect(
        clientListTool.execute(
          { accountId: 'ABC123', perPage: 101 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject perPage less than 1', async () => {
      await expect(
        clientListTool.execute(
          { accountId: 'ABC123', perPage: 0 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle maximum pagination values', async () => {
      const mockResponse = mockClientListResponse(100, 1, 100);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await clientListTool.execute(
        { accountId: 'ABC123', perPage: 100 },
        mockClient as any
      );

      expect(result.clients).toHaveLength(100);
    });

    it('should handle clients with null optional fields', async () => {
      const mockResponse = mockClientListResponse(1);
      mockResponse.data.clients[0].homePhone = null;
      mockResponse.data.clients[0].note = null;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await clientListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.clients[0].homePhone).toBeNull();
      expect(result.clients[0].note).toBeNull();
    });

    it('should handle unicode in text fields', async () => {
      const mockResponse = mockClientListResponse(1);
      mockResponse.data.clients[0].organization = '日本株式会社 🏢 Company';

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await clientListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.clients[0].organization).toBe('日本株式会社 🏢 Company');
    });

    it('should handle request beyond last page', async () => {
      const mockResponse = mockClientListResponse(0, 999, 30);
      mockResponse.data.clients = [];

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          clients: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await clientListTool.execute(
        { accountId: 'ABC123', page: 999 },
        mockClient as any
      );

      expect(result.clients).toHaveLength(0);
    });
  });
});
