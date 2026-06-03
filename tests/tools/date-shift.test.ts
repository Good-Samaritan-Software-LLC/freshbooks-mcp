/**
 * Regression tests for #76: tools must hand the SDK a LOCAL-midnight Date for
 * user-provided date fields (not a raw "YYYY-MM-DD" string, which the SDK
 * transform shifts back a day in negative-UTC zones).
 *
 * These capture the exact object passed to the SDK create/update method and
 * assert the date field is a Date at the intended local calendar day. Covers the
 * three application patterns: spread (bill, billpayment), inline payload
 * (expense), and update overlay (payment).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { billCreateTool } from '../../src/tools/bill/bill-create.js';
import { billpaymentCreateTool } from '../../src/tools/bill-payment/billpayment-create.js';
import { expenseCreateTool } from '../../src/tools/expense/expense-create.js';
import { paymentUpdateTool } from '../../src/tools/payment/payment-update.js';
import { createMockClientWrapper } from '../mocks/client.js';

function expectLocalDay(value: unknown, ymd: string) {
  expect(value).toBeInstanceOf(Date);
  const d = value as Date;
  const [y, m, day] = ymd.split('-').map(Number);
  expect(d.getFullYear()).toBe(y);
  expect(d.getMonth()).toBe(m - 1);
  expect(d.getDate()).toBe(day);
}

describe('#76 date-shift: tools pass local-midnight Dates to the SDK', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  /** Run the tool's apiCall against a fake fbClient that captures the call args. */
  function capture(resource: string, method: string, ret: any) {
    const fn = vi.fn().mockResolvedValue(ret);
    mockClient.executeWithRetry.mockImplementation(
      async (_op: string, apiCall: (c: any) => Promise<any>) => apiCall({ [resource]: { [method]: fn } })
    );
    return fn;
  }

  it('bill_create: issueDate + dueDate become local-midnight Dates (spread pattern)', async () => {
    const create = capture('bills', 'create', { ok: true, data: { bill: { id: 1 } } });

    await billCreateTool.execute(
      { accountId: 'ABC123', vendorId: 7, issueDate: '2026-03-15', dueDate: '2026-04-15' } as any,
      mockClient as any
    );

    const sent = create.mock.calls[0][0];
    expectLocalDay(sent.issueDate, '2026-03-15');
    expectLocalDay(sent.dueDate, '2026-04-15');
  });

  it('billpayment_create: paidDate becomes a local-midnight Date (spread pattern)', async () => {
    const create = capture('billPayments', 'create', { ok: true, data: { bill_payment: { id: 1 } } });

    await billpaymentCreateTool.execute(
      { accountId: 'ABC123', billId: 9, amount: { amount: '5.00', code: 'USD' }, paymentType: 'Check', paidDate: '2026-03-15' } as any,
      mockClient as any
    );

    expectLocalDay(create.mock.calls[0][0].paidDate, '2026-03-15');
  });

  it('expense_create: date becomes a local-midnight Date (inline payload)', async () => {
    const create = capture('expenses', 'create', { ok: true, data: { expense: { id: 1 } } });

    await expenseCreateTool.execute(
      { accountId: 'ABC123', categoryId: 3, staffId: 5, date: '2026-03-15', amount: { amount: '12.00', code: 'USD' } } as any,
      mockClient as any
    );

    expectLocalDay(create.mock.calls[0][0].date, '2026-03-15');
  });

  it('payment_update: date becomes a local-midnight Date (update overlay)', async () => {
    // payments.update(accountId, paymentId, payment) -> 3rd arg holds the date.
    const update = capture('payments', 'update', { ok: true, data: { payment: { id: 1 } } });

    await paymentUpdateTool.execute(
      { accountId: 'ABC123', paymentId: 11, date: '2026-07-20' } as any,
      mockClient as any
    );

    expectLocalDay(update.mock.calls[0][2].date, '2026-07-20');
  });
});
