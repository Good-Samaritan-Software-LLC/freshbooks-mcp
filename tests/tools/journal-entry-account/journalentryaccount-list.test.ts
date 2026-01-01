/**
 * Tests for journalentryaccount_list tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { journalEntryAccountListTool } from '../../../src/tools/journal-entry-account/journalentryaccount-list.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockJournalEntryAccountListResponse,
  mockJournalEntryAccountEmptyListResponse,
  mockJournalEntryAccountListByTypeResponse,
  mockJournalEntryAccountWithNullFields,
  mockJournalEntryAccountWithManySubAccounts,
  mockJournalEntryAccountWithZeroBalance,
  mockJournalEntryAccountWithNegativeBalance,
  mockJournalEntryAccountWithMultipleCurrencies,
  mockJournalEntryAccountLargePaginationResponse,
  mockJournalEntryAccountWithUnicode,
} from '../../mocks/responses/journal-entry-account.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
  mockNetworkTimeoutError,
  mockForbiddenError,
  mockInvalidAccountError,
  mockServiceUnavailableError,
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

describe('journalentryaccount_list tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should return chart of accounts with default pagination', async () => {
      const mockResponse = mockJournalEntryAccountListResponse(5);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          journalEntryAccounts: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await journalEntryAccountListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.accounts).toHaveLength(5);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.perPage).toBe(30);
      expect(result.pagination.total).toBe(5);
    });

    it('should return chart of accounts with custom pagination', async () => {
      const mockResponse = mockJournalEntryAccountListResponse(10, 2, 10);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          journalEntryAccounts: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await journalEntryAccountListTool.execute(
        { accountId: 'ABC123', page: 2, perPage: 10 },
        mockClient as any
      );

      expect(result.accounts).toHaveLength(10);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.perPage).toBe(10);
    });

    it('should return empty array when no accounts exist', async () => {
      const mockResponse = mockJournalEntryAccountEmptyListResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          journalEntryAccounts: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await journalEntryAccountListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.accounts).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should filter by asset account type', async () => {
      const mockResponse = mockJournalEntryAccountListByTypeResponse('asset', 3);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          journalEntryAccounts: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await journalEntryAccountListTool.execute(
        { accountId: 'ABC123', accountType: 'asset' },
        mockClient as any
      );

      expect(result.accounts).toHaveLength(3);
      expect(result.accounts.every(acc => acc.accountType === 'asset')).toBe(true);
    });

    it('should filter by liability account type', async () => {
      const mockResponse = mockJournalEntryAccountListByTypeResponse('liability', 2);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          journalEntryAccounts: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await journalEntryAccountListTool.execute(
        { accountId: 'ABC123', accountType: 'liability' },
        mockClient as any
      );

      expect(result.accounts).toHaveLength(2);
      expect(result.accounts.every(acc => acc.accountType === 'liability')).toBe(true);
    });

    it('should filter by equity account type', async () => {
      const mockResponse = mockJournalEntryAccountListByTypeResponse('equity', 1);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          journalEntryAccounts: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await journalEntryAccountListTool.execute(
        { accountId: 'ABC123', accountType: 'equity' },
        mockClient as any
      );

      expect(result.accounts).toHaveLength(1);
      expect(result.accounts[0].accountType).toBe('equity');
    });

    it('should filter by revenue account type', async () => {
      const mockResponse = mockJournalEntryAccountListByTypeResponse('revenue', 4);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          journalEntryAccounts: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await journalEntryAccountListTool.execute(
        { accountId: 'ABC123', accountType: 'revenue' },
        mockClient as any
      );

      expect(result.accounts).toHaveLength(4);
      expect(result.accounts.every(acc => acc.accountType === 'revenue')).toBe(true);
    });

    it('should filter by expense account type', async () => {
      const mockResponse = mockJournalEntryAccountListByTypeResponse('expense', 5);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          journalEntryAccounts: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await journalEntryAccountListTool.execute(
        { accountId: 'ABC123', accountType: 'expense' },
        mockClient as any
      );

      expect(result.accounts).toHaveLength(5);
      expect(result.accounts.every(acc => acc.accountType === 'expense')).toBe(true);
    });

    it('should apply pagination and account type filter together', async () => {
      const mockResponse = mockJournalEntryAccountListByTypeResponse('asset', 5, 1, 5);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          journalEntryAccounts: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await journalEntryAccountListTool.execute(
        {
          accountId: 'ABC123',
          accountType: 'asset',
          page: 1,
          perPage: 5,
        },
        mockClient as any
      );

      expect(result.accounts).toHaveLength(5);
      expect(result.accounts.every(acc => acc.accountType === 'asset')).toBe(true);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.perPage).toBe(5);
    });

    it('should return accounts with sub-accounts', async () => {
      const mockResponse = mockJournalEntryAccountListResponse(2);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          journalEntryAccounts: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await journalEntryAccountListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.accounts).toHaveLength(2);
      expect(result.accounts[0].subAccounts).toBeDefined();
      expect(Array.isArray(result.accounts[0].subAccounts)).toBe(true);
      expect(result.accounts[0].subAccounts.length).toBeGreaterThan(0);
    });

    it('should include sub-account details', async () => {
      const mockResponse = mockJournalEntryAccountListResponse(1);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          journalEntryAccounts: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await journalEntryAccountListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      const subAccount = result.accounts[0].subAccounts[0];
      expect(subAccount).toHaveProperty('id');
      expect(subAccount).toHaveProperty('accountId');
      expect(subAccount).toHaveProperty('name');
      expect(subAccount).toHaveProperty('accountType');
    });
  });

  describe('error handling', () => {
    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          journalEntryAccounts: {
            list: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        journalEntryAccountListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle forbidden error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          journalEntryAccounts: {
            list: vi.fn().mockResolvedValue(mockForbiddenError('journal entry accounts')),
          },
        };
        return apiCall(client);
      });

      await expect(
        journalEntryAccountListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle invalid account error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          journalEntryAccounts: {
            list: vi.fn().mockResolvedValue(mockInvalidAccountError('ABC123')),
          },
        };
        return apiCall(client);
      });

      await expect(
        journalEntryAccountListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          journalEntryAccounts: {
            list: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        journalEntryAccountListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          journalEntryAccounts: {
            list: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        journalEntryAccountListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle service unavailable error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          journalEntryAccounts: {
            list: vi.fn().mockResolvedValue(mockServiceUnavailableError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        journalEntryAccountListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());

      await expect(
        journalEntryAccountListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        journalEntryAccountListTool.execute({} as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should reject invalid page number (zero)', async () => {
      await expect(
        journalEntryAccountListTool.execute(
          { accountId: 'ABC123', page: 0 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject negative page number', async () => {
      await expect(
        journalEntryAccountListTool.execute(
          { accountId: 'ABC123', page: -1 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject perPage exceeding maximum (101)', async () => {
      await expect(
        journalEntryAccountListTool.execute(
          { accountId: 'ABC123', perPage: 101 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject zero perPage', async () => {
      await expect(
        journalEntryAccountListTool.execute(
          { accountId: 'ABC123', perPage: 0 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject negative perPage', async () => {
      await expect(
        journalEntryAccountListTool.execute(
          { accountId: 'ABC123', perPage: -5 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject invalid account type', async () => {
      await expect(
        journalEntryAccountListTool.execute(
          { accountId: 'ABC123', accountType: 'invalid' as any },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should accept valid optional parameters', async () => {
      const mockResponse = mockJournalEntryAccountListResponse(1);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          journalEntryAccounts: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      // Should not throw
      await expect(
        journalEntryAccountListTool.execute(
          {
            accountId: 'ABC123',
            page: 1,
            perPage: 50,
            accountType: 'asset',
          },
          mockClient as any
        )
      ).resolves.toBeDefined();
    });

    it('should accept all valid account types', async () => {
      const accountTypes: Array<'asset' | 'liability' | 'equity' | 'revenue' | 'expense'> = [
        'asset',
        'liability',
        'equity',
        'revenue',
        'expense',
      ];

      for (const accountType of accountTypes) {
        const mockResponse = mockJournalEntryAccountListByTypeResponse(accountType, 1);

        mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
          const client = {
            journalEntryAccounts: {
              list: vi.fn().mockResolvedValue(mockResponse),
            },
          };
          return apiCall(client);
        });

        await expect(
          journalEntryAccountListTool.execute(
            { accountId: 'ABC123', accountType },
            mockClient as any
          )
        ).resolves.toBeDefined();
      }
    });
  });

  describe('edge cases', () => {
    it('should handle maximum pagination values', async () => {
      const mockResponse = mockJournalEntryAccountLargePaginationResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          journalEntryAccounts: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await journalEntryAccountListTool.execute(
        { accountId: 'ABC123', perPage: 100 },
        mockClient as any
      );

      expect(result.accounts).toHaveLength(100);
      expect(result.pagination.perPage).toBe(100);
    });

    it('should handle accounts with null optional fields', async () => {
      const mockResponse = mockJournalEntryAccountWithNullFields();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          journalEntryAccounts: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await journalEntryAccountListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      const subAccount = result.accounts[0].subAccounts[0];
      expect(subAccount.accountNumber).toBeNull();
      expect(subAccount.description).toBeNull();
      expect(subAccount.balance).toBeNull();
      expect(subAccount.customName).toBeNull();
      expect(subAccount.subName).toBeNull();
    });

    it('should handle accounts with many sub-accounts', async () => {
      const mockResponse = mockJournalEntryAccountWithManySubAccounts();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          journalEntryAccounts: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await journalEntryAccountListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.accounts).toHaveLength(1);
      expect(result.accounts[0].subAccounts).toHaveLength(50);
    });

    it('should handle account with zero balance', async () => {
      const mockResponse = mockJournalEntryAccountWithZeroBalance();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          journalEntryAccounts: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await journalEntryAccountListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      const balance = result.accounts[0].subAccounts[0].balance;
      expect(balance?.amount).toBe('0.00');
    });

    it('should handle account with negative balance', async () => {
      const mockResponse = mockJournalEntryAccountWithNegativeBalance();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          journalEntryAccounts: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await journalEntryAccountListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      const balance = result.accounts[0].subAccounts[0].balance;
      expect(balance?.amount).toBe('-5000.00');
    });

    it('should handle accounts with multiple currencies', async () => {
      const mockResponse = mockJournalEntryAccountWithMultipleCurrencies();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          journalEntryAccounts: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await journalEntryAccountListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      const subAccounts = result.accounts[0].subAccounts;
      expect(subAccounts).toHaveLength(3);
      expect(subAccounts[0].balance?.code).toBe('USD');
      expect(subAccounts[1].balance?.code).toBe('CAD');
      expect(subAccounts[2].balance?.code).toBe('EUR');
    });

    it('should handle unicode in account names', async () => {
      const mockResponse = mockJournalEntryAccountWithUnicode();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          journalEntryAccounts: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await journalEntryAccountListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.accounts[0].name).toContain('日本語');
      expect(result.accounts[0].name).toContain('🏦');
      expect(result.accounts[0].subAccounts[0].name).toContain('文房具');
      expect(result.accounts[0].subAccounts[0].description).toContain('émojis');
    });

    it('should handle request beyond last page', async () => {
      const mockResponse = mockJournalEntryAccountEmptyListResponse();
      mockResponse.data.pages.page = 999;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          journalEntryAccounts: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await journalEntryAccountListTool.execute(
        { accountId: 'ABC123', page: 999 },
        mockClient as any
      );

      expect(result.accounts).toHaveLength(0);
      expect(result.pagination.page).toBe(999);
    });

    it('should handle very long account numbers', async () => {
      const mockResponse = mockJournalEntryAccountListResponse(1);
      mockResponse.data.accounts[0].subAccounts[0].accountNumber = '9999-8888-7777-6666-5555';

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          journalEntryAccounts: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await journalEntryAccountListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.accounts[0].subAccounts[0].accountNumber).toBe('9999-8888-7777-6666-5555');
    });

    it('should handle very large balance amounts', async () => {
      const mockResponse = mockJournalEntryAccountListResponse(1);
      mockResponse.data.accounts[0].subAccounts[0].balance = {
        amount: '999999999999.99',
        code: 'USD',
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          journalEntryAccounts: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await journalEntryAccountListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.accounts[0].subAccounts[0].balance?.amount).toBe('999999999999.99');
    });

    it('should handle account with empty sub-accounts array', async () => {
      const mockResponse = mockJournalEntryAccountListResponse(1);
      mockResponse.data.accounts[0].subAccounts = [];

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          journalEntryAccounts: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await journalEntryAccountListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.accounts[0].subAccounts).toHaveLength(0);
    });

    it('should handle alternative response structure (journalEntryAccounts)', async () => {
      const mockResponse = mockJournalEntryAccountListResponse(3);
      // Simulate alternative API response structure
      mockResponse.data.journalEntryAccounts = mockResponse.data.accounts;
      delete mockResponse.data.accounts;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          journalEntryAccounts: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await journalEntryAccountListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.accounts).toHaveLength(3);
    });

    it('should handle missing pages metadata', async () => {
      const mockResponse = mockJournalEntryAccountListResponse(2);
      delete mockResponse.data.pages;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          journalEntryAccounts: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await journalEntryAccountListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.accounts).toHaveLength(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.total).toBe(2);
    });
  });
});
