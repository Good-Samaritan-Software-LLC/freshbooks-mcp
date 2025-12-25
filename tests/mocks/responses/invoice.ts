/**
 * Mock Invoice Responses
 *
 * Factory functions for creating mock FreshBooks API responses for invoices.
 */

/**
 * Create a mock line item object
 */
export function createMockLineItem(overrides: Partial<any> = {}): any {
  return {
    name: 'Consulting Services',
    description: 'Professional consulting work',
    qty: 1,
    amount: {
      amount: '100.00',
      code: 'USD',
    },
    taxName1: null,
    taxAmount1: null,
    taxName2: null,
    taxAmount2: null,
    ...overrides,
  };
}

/**
 * Create a mock invoice object
 */
export function createMockInvoice(overrides: Partial<any> = {}): any {
  return {
    id: 12345,
    invoiceNumber: 'INV-0001',
    customerId: 56789,
    createDate: '2024-01-15',
    dueDate: '2024-02-15',
    amount: {
      amount: '1000.00',
      code: 'USD',
    },
    outstanding: {
      amount: '500.00',
      code: 'USD',
    },
    paid: {
      amount: '500.00',
      code: 'USD',
    },
    status: 'sent',
    paymentStatus: 'partial',
    currencyCode: 'USD',
    lines: [createMockLineItem()],
    notes: 'Thank you for your business',
    terms: 'Net 30',
    organization: 'Acme Corporation',
    fName: 'John',
    lName: 'Doe',
    email: 'john.doe@acme.com',
    address: '123 Main Street',
    city: 'New York',
    province: 'NY',
    code: '10001',
    country: 'United States',
    visState: 0,
    createdAt: '2024-01-15T10:00:00Z',
    updated: '2024-01-15T10:00:00Z',
    ...overrides,
  };
}

/**
 * Create a mock list response for invoices
 */
export function mockInvoiceListResponse(
  count: number = 10,
  page: number = 1,
  perPage: number = 30
): any {
  const invoices = Array.from({ length: count }, (_, i) =>
    createMockInvoice({
      id: 10000 + i,
      invoiceNumber: `INV-${String(i + 1).padStart(4, '0')}`,
      customerId: 50000 + i,
      amount: {
        amount: String((i + 1) * 100) + '.00',
        code: 'USD',
      },
    })
  );

  return {
    ok: true,
    data: {
      invoices,
      pages: {
        page,
        pages: Math.ceil(count / perPage),
        perPage,
        per_page: perPage,
        total: count,
      },
    },
  };
}

/**
 * Create an empty list response
 */
export function mockInvoiceEmptyListResponse(): any {
  return {
    ok: true,
    data: {
      invoices: [],
      pages: {
        page: 1,
        pages: 0,
        perPage: 30,
        per_page: 30,
        total: 0,
      },
    },
  };
}

/**
 * Create a mock single invoice response
 */
export function mockInvoiceSingleResponse(overrides: Partial<any> = {}): any {
  return {
    ok: true,
    data: {
      invoice: createMockInvoice(overrides),
    },
  };
}

/**
 * Create a mock create invoice response
 */
export function mockInvoiceCreateResponse(input: Partial<any> = {}): any {
  return {
    ok: true,
    data: {
      invoice: createMockInvoice({
        id: 99999,
        invoiceNumber: 'INV-9999',
        status: 'draft',
        paymentStatus: 'unpaid',
        outstanding: input.amount || { amount: '100.00', code: 'USD' },
        paid: { amount: '0.00', code: 'USD' },
        createdAt: new Date().toISOString(),
        updated: new Date().toISOString(),
        ...input,
      }),
    },
  };
}

/**
 * Create a mock update invoice response
 */
export function mockInvoiceUpdateResponse(invoiceId: number, updates: Partial<any> = {}): any {
  return {
    ok: true,
    data: {
      invoice: createMockInvoice({
        id: invoiceId,
        updated: new Date().toISOString(),
        ...updates,
      }),
    },
  };
}

/**
 * Create a mock delete invoice response
 */
export function mockInvoiceDeleteResponse(): any {
  return {
    ok: true,
    data: {},
  };
}

/**
 * Create a mock invoice with share link
 */
export function mockInvoiceWithShareLink(invoiceId: number): any {
  return {
    ok: true,
    data: {
      invoice: createMockInvoice({
        id: invoiceId,
        v3_status: {
          share_link: `https://my.freshbooks.com/view/${invoiceId}`,
        },
        links: {
          client_view: `https://my.freshbooks.com/view/${invoiceId}`,
        },
      }),
    },
  };
}

/**
 * Create a mock not found error
 */
export function mockInvoiceNotFoundError(invoiceId: number): any {
  return {
    ok: false,
    error: {
      code: 'NOT_FOUND',
      message: `Invoice with id ${invoiceId} was not found`,
      statusCode: 404,
    },
  };
}

/**
 * Create a mock validation error
 */
export function mockInvoiceValidationError(field: string, message: string): any {
  return {
    ok: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: `${field}: ${message}`,
      statusCode: 400,
    },
  };
}

/**
 * Create a mock invoice with no share link (fallback scenario)
 */
export function mockInvoiceNoShareLink(invoiceId: number): any {
  return {
    ok: true,
    data: {
      invoice: createMockInvoice({
        id: invoiceId,
        invoiceNumber: `INV-${invoiceId}`,
        // No v3_status, links, shareLink, or share_link fields
      }),
    },
  };
}
