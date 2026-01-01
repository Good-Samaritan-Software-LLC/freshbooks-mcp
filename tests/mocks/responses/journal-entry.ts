/**
 * Mock responses for JournalEntry entity
 */

/**
 * Create a mock journal entry detail line
 */
export function createMockJournalEntryDetail(overrides: Record<string, unknown> = {}) {
  return {
    subAccountId: overrides.subAccountId || 12345,
    debit: overrides.debit || null,
    credit: overrides.credit || null,
    description: overrides.description || 'Test detail line',
    ...overrides,
  };
}

/**
 * Create a mock journal entry object
 */
export function createMockJournalEntry(overrides: Record<string, unknown> = {}) {
  const id = (overrides.id as number) || 98765;
  return {
    id,
    name: overrides.name || 'Test Journal Entry',
    description: overrides.description || 'Test journal entry description',
    date: overrides.date || '2024-01-15',
    currencyCode: overrides.currencyCode || 'USD',
    details: overrides.details || [
      createMockJournalEntryDetail({
        subAccountId: 100,
        debit: '500.00',
        credit: null,
        description: 'Debit entry',
      }),
      createMockJournalEntryDetail({
        subAccountId: 200,
        debit: null,
        credit: '500.00',
        description: 'Credit entry',
      }),
    ],
    createdAt: overrides.createdAt || '2024-01-15T10:00:00Z',
    ...overrides,
  };
}

/**
 * Mock response for journal entry create
 */
export function mockJournalEntryCreateResponse(overrides: Record<string, unknown> = {}) {
  return {
    ok: true,
    data: {
      journalEntry: createMockJournalEntry({
        id: 99999,
        name: 'New Journal Entry',
        ...overrides,
      }),
    },
  };
}

/**
 * Mock validation error for unbalanced entry
 */
export function mockJournalEntryUnbalancedError(debits: string, credits: string) {
  return {
    ok: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: `Journal entry must balance. Debits: ${debits}, Credits: ${credits}`,
      statusCode: 422,
      details: {
        field: 'details',
        debits,
        credits,
      },
    },
  };
}

/**
 * Mock validation error for insufficient detail lines
 */
export function mockJournalEntryInsufficientDetailsError() {
  return {
    ok: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Journal entry must have at least 2 detail lines',
      statusCode: 422,
      details: {
        field: 'details',
        message: 'Minimum 2 detail lines required',
      },
    },
  };
}

/**
 * Mock validation error for invalid sub-account
 */
export function mockJournalEntryInvalidSubAccountError(subAccountId: number) {
  return {
    ok: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: `Invalid sub-account ID: ${subAccountId}`,
      statusCode: 422,
      details: {
        field: 'subAccountId',
        value: subAccountId,
      },
    },
  };
}

/**
 * Mock validation error for invalid date format
 */
export function mockJournalEntryInvalidDateError(date: string) {
  return {
    ok: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: `Invalid date format: ${date}. Expected YYYY-MM-DD`,
      statusCode: 422,
      details: {
        field: 'date',
        value: date,
      },
    },
  };
}

/**
 * Mock validation error for missing debit/credit on detail line
 */
export function mockJournalEntryMissingAmountError() {
  return {
    ok: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Each detail line must have either a debit or credit amount',
      statusCode: 422,
      details: {
        field: 'details',
        message: 'Debit or credit required',
      },
    },
  };
}

/**
 * Mock validation error for negative amounts
 */
export function mockJournalEntryNegativeAmountError(field: string, value: string) {
  return {
    ok: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: `${field} amount cannot be negative: ${value}`,
      statusCode: 422,
      details: {
        field,
        value,
      },
    },
  };
}

/**
 * Mock archived account error
 */
export function mockJournalEntryArchivedAccountError(accountId: string) {
  return {
    ok: false,
    error: {
      code: 'ARCHIVED_ACCOUNT',
      message: `Account ${accountId} is archived and cannot create journal entries`,
      statusCode: 403,
    },
  };
}

/**
 * Mock permission error for accounting features
 */
export function mockJournalEntryPermissionError() {
  return {
    ok: false,
    error: {
      code: 'FORBIDDEN',
      message: 'Insufficient permissions to create journal entries. Accounting features required.',
      statusCode: 403,
    },
  };
}
