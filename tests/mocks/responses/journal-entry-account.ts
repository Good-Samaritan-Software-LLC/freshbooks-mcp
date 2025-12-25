/**
 * Mock responses for JournalEntryAccount entity
 */

/**
 * Create a mock sub-account object
 */
export function createMockSubAccount(overrides: Record<string, unknown> = {}) {
  const id = (overrides.id as number) || 12345;
  const accountId = (overrides.accountId as number) || 10000;
  const accountType = (overrides.accountType as string) || 'asset';

  return {
    id,
    accountId,
    name: overrides.name || `Sub Account ${id}`,
    accountNumber: overrides.accountNumber || `${accountId + id}`,
    description: overrides.description || `Description for sub account ${id}`,
    accountType,
    balance: overrides.balance || {
      amount: '1000.00',
      code: 'USD',
    },
    customName: overrides.customName || null,
    subName: overrides.subName || null,
    ...overrides,
  };
}

/**
 * Create a mock journal entry account (chart of accounts category)
 */
export function createMockJournalEntryAccount(overrides: Record<string, unknown> = {}) {
  const id = (overrides.id as number) || 10000;
  const accountType = (overrides.accountType as string) || 'asset';
  const subAccountCount = (overrides.subAccountCount as number) || 3;

  // Generate sub-accounts
  const subAccounts = overrides.subAccounts || Array.from({ length: subAccountCount }, (_, i) =>
    createMockSubAccount({
      id: 12345 + i,
      accountId: id,
      accountType,
      name: `${accountType.charAt(0).toUpperCase() + accountType.slice(1)} Sub Account ${i + 1}`,
      accountNumber: `${id + i + 1}`,
    })
  );

  return {
    id,
    accountType,
    name: overrides.name || `${accountType.charAt(0).toUpperCase() + accountType.slice(1)} Account`,
    subAccounts,
    ...overrides,
  };
}

/**
 * Mock response for journal entry account list
 */
export function mockJournalEntryAccountListResponse(
  count: number = 5,
  page: number = 1,
  perPage: number = 30
) {
  const accountTypes = ['asset', 'liability', 'equity', 'revenue', 'expense'];

  const accounts = Array.from({ length: count }, (_, i) => {
    const accountType = accountTypes[i % accountTypes.length];
    return createMockJournalEntryAccount({
      id: 10000 + i,
      accountType,
      name: `${accountType.charAt(0).toUpperCase() + accountType.slice(1)} Account ${i + 1}`,
      subAccountCount: 2 + (i % 3), // Vary sub-account count
    });
  });

  return {
    ok: true,
    data: {
      accounts,
      pages: {
        page,
        pages: Math.ceil(count / perPage),
        per_page: perPage,
        total: count,
      },
    },
  };
}

/**
 * Mock response for empty journal entry account list
 */
export function mockJournalEntryAccountEmptyListResponse() {
  return {
    ok: true,
    data: {
      accounts: [],
      pages: {
        page: 1,
        pages: 1,
        per_page: 30,
        total: 0,
      },
    },
  };
}

/**
 * Mock response for journal entry account list filtered by type
 */
export function mockJournalEntryAccountListByTypeResponse(
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense',
  count: number = 3,
  page: number = 1,
  perPage: number = 30
) {
  const accounts = Array.from({ length: count }, (_, i) =>
    createMockJournalEntryAccount({
      id: 10000 + i,
      accountType,
      name: `${accountType.charAt(0).toUpperCase() + accountType.slice(1)} Account ${i + 1}`,
      subAccountCount: 2 + (i % 4),
    })
  );

  return {
    ok: true,
    data: {
      accounts,
      pages: {
        page,
        pages: Math.ceil(count / perPage),
        per_page: perPage,
        total: count,
      },
    },
  };
}

/**
 * Mock response with accounts having null optional fields
 */
export function mockJournalEntryAccountWithNullFields() {
  const account = createMockJournalEntryAccount({
    id: 99999,
    accountType: 'asset',
    name: 'Asset Account with Nulls',
    subAccounts: [
      createMockSubAccount({
        id: 88888,
        accountId: 99999,
        accountType: 'asset',
        accountNumber: null,
        description: null,
        balance: null,
        customName: null,
        subName: null,
      }),
    ],
  });

  return {
    ok: true,
    data: {
      accounts: [account],
      pages: {
        page: 1,
        pages: 1,
        per_page: 30,
        total: 1,
      },
    },
  };
}

/**
 * Mock response for account with many sub-accounts (edge case)
 */
export function mockJournalEntryAccountWithManySubAccounts() {
  const account = createMockJournalEntryAccount({
    id: 77777,
    accountType: 'expense',
    name: 'Expense Account with Many Sub-Accounts',
    subAccountCount: 50, // Large number of sub-accounts
  });

  return {
    ok: true,
    data: {
      accounts: [account],
      pages: {
        page: 1,
        pages: 1,
        per_page: 30,
        total: 1,
      },
    },
  };
}

/**
 * Mock response for account with zero balance
 */
export function mockJournalEntryAccountWithZeroBalance() {
  const account = createMockJournalEntryAccount({
    id: 66666,
    accountType: 'revenue',
    name: 'Revenue Account with Zero Balance',
    subAccounts: [
      createMockSubAccount({
        id: 55555,
        accountId: 66666,
        accountType: 'revenue',
        balance: {
          amount: '0.00',
          code: 'USD',
        },
      }),
    ],
  });

  return {
    ok: true,
    data: {
      accounts: [account],
      pages: {
        page: 1,
        pages: 1,
        per_page: 30,
        total: 1,
      },
    },
  };
}

/**
 * Mock response for account with negative balance
 */
export function mockJournalEntryAccountWithNegativeBalance() {
  const account = createMockJournalEntryAccount({
    id: 44444,
    accountType: 'liability',
    name: 'Liability Account with Negative Balance',
    subAccounts: [
      createMockSubAccount({
        id: 33333,
        accountId: 44444,
        accountType: 'liability',
        balance: {
          amount: '-5000.00',
          code: 'USD',
        },
      }),
    ],
  });

  return {
    ok: true,
    data: {
      accounts: [account],
      pages: {
        page: 1,
        pages: 1,
        per_page: 30,
        total: 1,
      },
    },
  };
}

/**
 * Mock response for account with multiple currencies (edge case)
 */
export function mockJournalEntryAccountWithMultipleCurrencies() {
  const account = createMockJournalEntryAccount({
    id: 22222,
    accountType: 'asset',
    name: 'Multi-Currency Asset Account',
    subAccounts: [
      createMockSubAccount({
        id: 11111,
        accountId: 22222,
        accountType: 'asset',
        name: 'USD Cash',
        balance: { amount: '10000.00', code: 'USD' },
      }),
      createMockSubAccount({
        id: 11112,
        accountId: 22222,
        accountType: 'asset',
        name: 'CAD Cash',
        balance: { amount: '15000.00', code: 'CAD' },
      }),
      createMockSubAccount({
        id: 11113,
        accountId: 22222,
        accountType: 'asset',
        name: 'EUR Cash',
        balance: { amount: '8000.00', code: 'EUR' },
      }),
    ],
  });

  return {
    ok: true,
    data: {
      accounts: [account],
      pages: {
        page: 1,
        pages: 1,
        per_page: 30,
        total: 1,
      },
    },
  };
}

/**
 * Mock response for large pagination scenario
 */
export function mockJournalEntryAccountLargePaginationResponse() {
  return mockJournalEntryAccountListResponse(100, 1, 100);
}

/**
 * Mock response for account with unicode characters in names
 */
export function mockJournalEntryAccountWithUnicode() {
  const account = createMockJournalEntryAccount({
    id: 88888,
    accountType: 'expense',
    name: 'Expense Account 日本語 🏦',
    subAccounts: [
      createMockSubAccount({
        id: 77777,
        accountId: 88888,
        accountType: 'expense',
        name: 'Office Supplies 文房具 📎',
        description: 'Test with émojis and spëcial çharacters',
      }),
    ],
  });

  return {
    ok: true,
    data: {
      accounts: [account],
      pages: {
        page: 1,
        pages: 1,
        per_page: 30,
        total: 1,
      },
    },
  };
}
