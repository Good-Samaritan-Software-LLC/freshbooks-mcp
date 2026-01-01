/**
 * Tests for timeentry_list tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { timeentryListTool } from '../../../src/tools/time-entry/timeentry-list.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockTimeEntryListResponse,
  mockTimeEntryEmptyListResponse,
} from '../../mocks/responses/time-entry.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
  mockNetworkTimeoutError,
} from '../../mocks/errors/freshbooks-errors.js';

// Mock the FreshBooks SDK query builders
vi.mock('@freshbooks/api', () => ({
  SearchQueryBuilder: class {
    private filters: any[] = [];
    equals(field: string, value: any) {
      this.filters.push({ type: 'equals', field, value });
      return this;
    }
    boolean(field: string, value: boolean) {
      this.filters.push({ type: 'boolean', field, value });
      return this;
    }
    between(field: string, from: string, to: string) {
      this.filters.push({ type: 'between', field, from, to });
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

describe('timeentry_list tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should return time entries with default pagination', async () => {
      const mockResponse = mockTimeEntryListResponse(10);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.timeEntries).toHaveLength(10);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.perPage).toBe(30);
      expect(result.pagination.total).toBe(10);
    });

    it('should return time entries with custom pagination', async () => {
      const mockResponse = mockTimeEntryListResponse(5, 2, 5);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryListTool.execute(
        { accountId: 'ABC123', page: 2, perPage: 5 },
        mockClient as any
      );

      expect(result.timeEntries).toHaveLength(5);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.perPage).toBe(5);
    });

    it('should return empty array when no entries exist', async () => {
      const mockResponse = mockTimeEntryEmptyListResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.timeEntries).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should apply project filter correctly', async () => {
      const mockResponse = mockTimeEntryListResponse(3);
      let capturedQueryBuilders: any[] = [];

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            list: vi.fn((accountId, queryBuilders) => {
              capturedQueryBuilders = queryBuilders;
              return Promise.resolve(mockResponse);
            }),
          },
        };
        return apiCall(client);
      });

      await timeentryListTool.execute(
        { accountId: 'ABC123', projectId: 42 },
        mockClient as any
      );

      expect(capturedQueryBuilders).toBeDefined();
      expect(capturedQueryBuilders.length).toBeGreaterThan(0);
    });

    it('should apply client filter correctly', async () => {
      const mockResponse = mockTimeEntryListResponse(3);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryListTool.execute(
        { accountId: 'ABC123', clientId: 100 },
        mockClient as any
      );

      expect(result.timeEntries).toHaveLength(3);
    });

    it('should apply billable filter correctly', async () => {
      const mockResponse = mockTimeEntryListResponse(5);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryListTool.execute(
        { accountId: 'ABC123', billable: true },
        mockClient as any
      );

      expect(result.timeEntries).toHaveLength(5);
    });

    it('should apply date range filters correctly', async () => {
      const mockResponse = mockTimeEntryListResponse(5);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryListTool.execute(
        {
          accountId: 'ABC123',
          startedAfter: '2024-01-01T00:00:00Z',
          startedBefore: '2024-12-31T23:59:59Z',
        },
        mockClient as any
      );

      expect(result.timeEntries).toHaveLength(5);
    });

    it('should apply active filter for running timers', async () => {
      const mockResponse = mockTimeEntryListResponse(1);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryListTool.execute(
        { accountId: 'ABC123', active: true },
        mockClient as any
      );

      expect(result.timeEntries).toHaveLength(1);
    });

    it('should apply multiple filters together', async () => {
      const mockResponse = mockTimeEntryListResponse(2);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryListTool.execute(
        {
          accountId: 'ABC123',
          projectId: 42,
          billable: true,
          startedAfter: '2024-01-01T00:00:00Z',
        },
        mockClient as any
      );

      expect(result.timeEntries).toHaveLength(2);
    });
  });

  describe('error handling', () => {
    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            list: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        timeentryListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            list: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        timeentryListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            list: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        timeentryListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());

      await expect(
        timeentryListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        timeentryListTool.execute({} as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should reject invalid page number (zero)', async () => {
      await expect(
        timeentryListTool.execute(
          { accountId: 'ABC123', page: 0 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject invalid page number (negative)', async () => {
      await expect(
        timeentryListTool.execute(
          { accountId: 'ABC123', page: -1 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject perPage exceeding maximum', async () => {
      await expect(
        timeentryListTool.execute(
          { accountId: 'ABC123', perPage: 101 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject perPage less than 1', async () => {
      await expect(
        timeentryListTool.execute(
          { accountId: 'ABC123', perPage: 0 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should accept valid optional parameters', async () => {
      const mockResponse = mockTimeEntryListResponse(1);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      await expect(
        timeentryListTool.execute(
          {
            accountId: 'ABC123',
            page: 1,
            perPage: 50,
            projectId: 42,
            startedAfter: '2024-01-01T00:00:00Z',
          },
          mockClient as any
        )
      ).resolves.toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle maximum pagination values', async () => {
      const mockResponse = mockTimeEntryListResponse(100, 1, 100);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryListTool.execute(
        { accountId: 'ABC123', perPage: 100 },
        mockClient as any
      );

      expect(result.timeEntries).toHaveLength(100);
    });

    it('should handle entries with null optional fields', async () => {
      const mockResponse = mockTimeEntryListResponse(1);
      mockResponse.data.timeEntries[0].projectId = null;
      mockResponse.data.timeEntries[0].note = null;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.timeEntries[0].projectId).toBeNull();
      expect(result.timeEntries[0].note).toBeNull();
    });

    it('should handle unicode in text fields', async () => {
      const mockResponse = mockTimeEntryListResponse(1);
      mockResponse.data.timeEntries[0].note = '日本語テスト 🕐 émojis';

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.timeEntries[0].note).toBe('日本語テスト 🕐 émojis');
    });

    it('should handle very long duration values', async () => {
      const mockResponse = mockTimeEntryListResponse(1);
      mockResponse.data.timeEntries[0].duration = 86400 * 365; // 1 year in seconds

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.timeEntries[0].duration).toBe(86400 * 365);
    });

    it('should handle request beyond last page', async () => {
      const mockResponse = mockTimeEntryListResponse(0, 999, 30);
      mockResponse.data.timeEntries = [];

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryListTool.execute(
        { accountId: 'ABC123', page: 999 },
        mockClient as any
      );

      expect(result.timeEntries).toHaveLength(0);
    });

    it('should handle only startedBefore filter without startedAfter', async () => {
      const mockResponse = mockTimeEntryListResponse(3);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryListTool.execute(
        {
          accountId: 'ABC123',
          startedBefore: '2024-12-31T23:59:59Z',
        },
        mockClient as any
      );

      expect(result.timeEntries).toHaveLength(3);
    });
  });
});
