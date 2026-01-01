/**
 * Mock responses for CreditNote entity
 */

/**
 * Create a mock credit note object
 */
export function createMockCreditNote(overrides: Record<string, unknown> = {}) {
  const id = (overrides.id as number) || 12345;
  return {
    id,
    credit_note_number: overrides.creditNoteNumber || `CN-${id}`,
    creditid: id,
    clientid: overrides.clientId || 67890,
    create_date: overrides.createDate || '2024-01-15',
    amount: overrides.amount || { amount: '100.00', code: 'USD' },
    currency_code: overrides.currencyCode || 'USD',
    status: overrides.status || 'created',
    display_status: overrides.displayStatus || 'created',
    dispute_status: overrides.disputeStatus || null,
    lines: overrides.lines || [
      {
        lineid: 1,
        name: 'Refund for service',
        description: 'Credit for returned product',
        qty: 1,
        unit_cost: { amount: '100.00', code: 'USD' },
        amount: { amount: '100.00', code: 'USD' },
        taxName1: null,
        taxAmount1: null,
        taxName2: null,
        taxAmount2: null,
      },
    ],
    notes: overrides.notes || 'Test credit note',
    terms: overrides.terms || 'Net 30',
    language: overrides.language || 'en',
    organization: overrides.organization || 'Test Company',
    fname: overrides.fName || 'John',
    lname: overrides.lName || 'Doe',
    email: overrides.email || 'john@example.com',
    address: overrides.address || '123 Main St',
    city: overrides.city || 'Toronto',
    province: overrides.province || 'ON',
    code: overrides.code || 'M5V 2H1',
    country: overrides.country || 'Canada',
    vis_state: overrides.visState || 0,
    created_at: overrides.createdAt || '2024-01-15T10:00:00Z',
    updated: overrides.updated || '2024-01-15T10:00:00Z',
    ...overrides,
  };
}

/**
 * Mock response for credit note list
 */
export function mockCreditNoteListResponse(
  count: number = 5,
  page: number = 1,
  perPage: number = 30
) {
  const creditNotes = Array.from({ length: count }, (_, i) =>
    createMockCreditNote({
      id: 12345 + i,
      creditNoteNumber: `CN-${12345 + i}`,
      clientId: 67890 + i,
    })
  );

  return {
    ok: true,
    data: {
      credit_notes: creditNotes,
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
 * Mock response for empty credit note list
 */
export function mockCreditNoteEmptyListResponse() {
  return {
    ok: true,
    data: {
      credit_notes: [],
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
 * Mock response for single credit note
 * NOTE: SDK returns CreditNote directly (not wrapped in { credit_note: ... })
 */
export function mockCreditNoteSingleResponse(overrides: Record<string, unknown> = {}) {
  return {
    ok: true,
    data: createMockCreditNote(overrides),
  };
}

/**
 * Mock response for credit note create
 */
export function mockCreditNoteCreateResponse(overrides: Record<string, unknown> = {}) {
  return {
    ok: true,
    data: {
      credit_note: createMockCreditNote({
        id: 99999,
        creditNoteNumber: 'CN-99999',
        status: 'created',
        ...overrides,
      }),
    },
  };
}

/**
 * Mock response for credit note update
 */
export function mockCreditNoteUpdateResponse(
  creditNoteId: number,
  updates: Record<string, unknown> = {}
) {
  return {
    ok: true,
    data: {
      credit_note: createMockCreditNote({
        id: creditNoteId,
        ...updates,
      }),
    },
  };
}

/**
 * Mock response for credit note delete
 */
export function mockCreditNoteDeleteResponse() {
  return {
    ok: true,
    data: {},
  };
}

/**
 * Mock not found error
 */
export function mockCreditNoteNotFoundError(creditNoteId: number) {
  return {
    ok: false,
    error: {
      code: 'NOT_FOUND',
      message: `Credit note ${creditNoteId} not found`,
      statusCode: 404,
    },
  };
}

/**
 * Mock validation error
 */
export function mockCreditNoteValidationError(field: string, message: string) {
  return {
    ok: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: `Validation error: ${field} - ${message}`,
      statusCode: 400,
      details: {
        field,
        message,
      },
    },
  };
}

/**
 * Mock credit note already applied error
 */
export function mockCreditNoteAlreadyAppliedError(creditNoteId: number) {
  return {
    ok: false,
    error: {
      code: 'CREDIT_NOTE_APPLIED',
      message: `Credit note ${creditNoteId} has already been applied and cannot be modified`,
      statusCode: 400,
    },
  };
}
