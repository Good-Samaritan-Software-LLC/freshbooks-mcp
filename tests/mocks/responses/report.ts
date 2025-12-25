/**
 * Mock responses for Report entity
 */

/**
 * Create a mock payment item for payments collected report
 */
export function createMockPaymentItem(overrides: Record<string, unknown> = {}) {
  const id = (overrides.id as number) || 1;
  return {
    date: overrides.date || '2024-01-15',
    clientName: overrides.clientName || 'Test Client',
    invoiceNumber: overrides.invoiceNumber || `INV-${1000 + id}`,
    amount: overrides.amount || { amount: '250.00', code: 'USD' },
    paymentType: overrides.paymentType || 'Credit Card',
    notes: overrides.notes || undefined,
    ...overrides,
  };
}

/**
 * Mock response for payments collected report
 */
export function mockPaymentsCollectedReportResponse(
  paymentCount: number = 5,
  startDate: string = '2024-01-01',
  endDate: string = '2024-01-31'
) {
  const payments = Array.from({ length: paymentCount }, (_, i) => {
    const dayOffset = Math.floor((i / paymentCount) * 30);
    const date = new Date(startDate);
    date.setDate(date.getDate() + dayOffset);

    return createMockPaymentItem({
      id: i + 1,
      date: date.toISOString().split('T')[0],
      clientName: `Client ${i + 1}`,
      invoiceNumber: `INV-${1000 + i}`,
      amount: { amount: (100 + i * 50).toFixed(2), code: 'USD' },
      paymentType: i % 3 === 0 ? 'Credit Card' : i % 3 === 1 ? 'Check' : 'Cash',
      notes: i % 2 === 0 ? `Payment note ${i}` : undefined,
    });
  });

  const totalAmount = payments.reduce((sum, p) => {
    return sum + parseFloat((p.amount as any).amount);
  }, 0);

  return {
    ok: true,
    data: {
      payments,
      totalAmount: { amount: totalAmount.toFixed(2), code: 'USD' },
      total: { amount: totalAmount.toFixed(2), code: 'USD' },
    },
  };
}

/**
 * Mock response for empty payments collected report
 */
export function mockEmptyPaymentsCollectedReportResponse(
  startDate: string = '2024-01-01',
  endDate: string = '2024-01-31'
) {
  return {
    ok: true,
    data: {
      payments: [],
      totalAmount: { amount: '0.00', code: 'USD' },
      total: { amount: '0.00', code: 'USD' },
    },
  };
}

/**
 * Create a mock profit/loss line item
 */
export function createMockProfitLossLine(overrides: Record<string, unknown> = {}) {
  return {
    category: overrides.category || 'Revenue',
    amount: overrides.amount || { amount: '1000.00', code: 'USD' },
    children: overrides.children || undefined,
    ...overrides,
  };
}

/**
 * Mock response for profit/loss report
 */
export function mockProfitLossReportResponse(
  revenueAmount: number = 5000,
  expensesAmount: number = 3000,
  startDate: string = '2024-01-01',
  endDate: string = '2024-01-31',
  includeLines: boolean = false
) {
  const netIncome = revenueAmount - expensesAmount;

  const data: any = {
    revenue: { amount: revenueAmount.toFixed(2), code: 'USD' },
    expenses: { amount: expensesAmount.toFixed(2), code: 'USD' },
    netIncome: { amount: netIncome.toFixed(2), code: 'USD' },
    net_income: { amount: netIncome.toFixed(2), code: 'USD' },
  };

  if (includeLines) {
    data.lines = [
      createMockProfitLossLine({
        category: 'Revenue',
        amount: { amount: revenueAmount.toFixed(2), code: 'USD' },
        children: [
          { category: 'Sales', amount: { amount: (revenueAmount * 0.7).toFixed(2), code: 'USD' } },
          { category: 'Services', amount: { amount: (revenueAmount * 0.3).toFixed(2), code: 'USD' } },
        ],
      }),
      createMockProfitLossLine({
        category: 'Expenses',
        amount: { amount: expensesAmount.toFixed(2), code: 'USD' },
        children: [
          { category: 'Operating', amount: { amount: (expensesAmount * 0.6).toFixed(2), code: 'USD' } },
          { category: 'Overhead', amount: { amount: (expensesAmount * 0.4).toFixed(2), code: 'USD' } },
        ],
      }),
    ];
    data.categories = data.lines;
  }

  return {
    ok: true,
    data,
  };
}

/**
 * Mock response for zero profit/loss report
 */
export function mockZeroProfitLossReportResponse(
  startDate: string = '2024-01-01',
  endDate: string = '2024-01-31'
) {
  return {
    ok: true,
    data: {
      revenue: { amount: '0.00', code: 'USD' },
      expenses: { amount: '0.00', code: 'USD' },
      netIncome: { amount: '0.00', code: 'USD' },
      net_income: { amount: '0.00', code: 'USD' },
    },
  };
}

/**
 * Mock response for profit/loss report with loss
 */
export function mockProfitLossReportWithLossResponse(
  revenueAmount: number = 2000,
  expensesAmount: number = 3000,
  startDate: string = '2024-01-01',
  endDate: string = '2024-01-31'
) {
  const netIncome = revenueAmount - expensesAmount;

  return {
    ok: true,
    data: {
      revenue: { amount: revenueAmount.toFixed(2), code: 'USD' },
      expenses: { amount: expensesAmount.toFixed(2), code: 'USD' },
      netIncome: { amount: netIncome.toFixed(2), code: 'USD' },
      net_income: { amount: netIncome.toFixed(2), code: 'USD' },
    },
  };
}

/**
 * Create a mock tax summary item
 */
export function createMockTaxSummaryItem(overrides: Record<string, unknown> = {}) {
  return {
    taxName: overrides.taxName || 'Sales Tax',
    taxRate: overrides.taxRate || '13.00',
    taxableAmount: overrides.taxableAmount || { amount: '1000.00', code: 'USD' },
    taxCollected: overrides.taxCollected || { amount: '130.00', code: 'USD' },
    taxPaid: overrides.taxPaid || undefined,
    ...overrides,
  };
}

/**
 * Mock response for tax summary report
 */
export function mockTaxSummaryReportResponse(
  taxCount: number = 2,
  startDate: string = '2024-01-01',
  endDate: string = '2024-01-31'
) {
  const taxes = Array.from({ length: taxCount }, (_, i) => {
    const taxableAmount = 1000 * (i + 1);
    const rate = i === 0 ? 13 : i === 1 ? 5 : 8;
    const collected = (taxableAmount * rate) / 100;

    return createMockTaxSummaryItem({
      taxName: i === 0 ? 'Sales Tax' : i === 1 ? 'GST' : 'PST',
      taxRate: rate.toFixed(2),
      taxableAmount: { amount: taxableAmount.toFixed(2), code: 'USD' },
      taxCollected: { amount: collected.toFixed(2), code: 'USD' },
      taxPaid: i % 2 === 0 ? { amount: (collected * 0.5).toFixed(2), code: 'USD' } : undefined,
    });
  });

  const totalTaxCollected = taxes.reduce((sum, t) => {
    return sum + parseFloat((t.taxCollected as any).amount);
  }, 0);

  return {
    ok: true,
    data: {
      taxes,
      taxSummaries: taxes,
      totalTaxCollected: { amount: totalTaxCollected.toFixed(2), code: 'USD' },
      total: { amount: totalTaxCollected.toFixed(2), code: 'USD' },
    },
  };
}

/**
 * Mock response for empty tax summary report
 */
export function mockEmptyTaxSummaryReportResponse(
  startDate: string = '2024-01-01',
  endDate: string = '2024-01-31'
) {
  return {
    ok: true,
    data: {
      taxes: [],
      taxSummaries: [],
      totalTaxCollected: { amount: '0.00', code: 'USD' },
      total: { amount: '0.00', code: 'USD' },
    },
  };
}

/**
 * Mock error for invalid date range
 */
export function mockInvalidDateRangeError() {
  return {
    ok: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Start date must be before or equal to end date',
      statusCode: 422,
    },
  };
}

/**
 * Mock error for date range too large
 */
export function mockDateRangeTooLargeError() {
  return {
    ok: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Date range cannot exceed 1 year',
      statusCode: 422,
    },
  };
}

/**
 * Mock error for invalid account
 */
export function mockInvalidAccountForReportError(accountId: string) {
  return {
    ok: false,
    error: {
      code: 'INVALID_ACCOUNT',
      message: `Account ${accountId} is invalid or inaccessible`,
      statusCode: 403,
    },
  };
}
