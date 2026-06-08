/**
 * Transform-allowlist guard tests (audit Phase 3 — the durable fix).
 *
 * THE BUG CLASS THIS GUARDS AGAINST: every SDK-routed write goes through
 * @freshbooks/api's transform*Request(), which maps an explicit allowlist of
 * camelCase fields to the snake_case wire JSON. Any payload key the transform
 * does not map is SILENTLY DROPPED while the tool returns success. This is how
 * invoice dueDate, billvendor contact fields, paymentoptions gateway, expense
 * visState and friends all broke.
 *
 * METHOD: run each tool's execute() with an input exercising every advertised
 * optional field, capture the payload the tool hands to the SDK, push it
 * through the REAL transform (imported from @freshbooks/api/dist — NOT the
 * global mock, which only covers the bare '@freshbooks/api' specifier), parse
 * the emitted wire JSON, and assert each advertised field actually reached the
 * wire.
 *
 * KNOWN-DROPPED FIELDS (audit findings 6-11, deliberately NOT fixed yet) are
 * encoded as `it.fails(...)` so the suite stays green while loudly documenting
 * the gap: the day someone fixes one, the `it.fails` starts failing and must be
 * flipped to a positive assertion. Each carries its audit finding number.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
// Real SDK transforms (dist subpath imports bypass the tests/setup.ts mock of
// the bare '@freshbooks/api' specifier).
import { transformInvoiceRequest } from '@freshbooks/api/dist/models/Invoices.js';
import { transformExpenseRequest } from '@freshbooks/api/dist/models/Expense.js';
import { transformBillVendorsRequest } from '@freshbooks/api/dist/models/BillVendors.js';
import { transformPaymentOptionsRequest } from '@freshbooks/api/dist/models/PaymentOptions.js';
import { transformBillsRequest } from '@freshbooks/api/dist/models/Bills.js';
import { transformOtherIncomeRequest } from '@freshbooks/api/dist/models/OtherIncome.js';
import { transformPaymentRequest } from '@freshbooks/api/dist/models/Payment.js';
import { transformItemRequest } from '@freshbooks/api/dist/models/Item.js';

import {
  BillVendorCreateInputSchema,
  BillVendorUpdateInputSchema,
} from '../../src/tools/bill-vendor/schemas.js';
import { invoiceCreateTool } from '../../src/tools/invoice/invoice-create.js';
import { expenseCreateTool } from '../../src/tools/expense/expense-create.js';
import { billvendorCreateTool } from '../../src/tools/bill-vendor/billvendor-create.js';
import { billvendorUpdateTool } from '../../src/tools/bill-vendor/billvendor-update.js';
import { paymentOptionsCreateTool } from '../../src/tools/payment-options/paymentoptions-create.js';
import { billCreateTool } from '../../src/tools/bill/bill-create.js';
import { BillCreateInputSchema } from '../../src/tools/bill/schemas.js';
import { otherincomeCreateTool } from '../../src/tools/other-income/otherincome-create.js';
import { OtherIncomeCreateInputSchema } from '../../src/tools/other-income/schemas.js';
import { paymentCreateTool } from '../../src/tools/payment/payment-create.js';
import { PaymentCreateInputSchema } from '../../src/tools/payment/schemas.js';
import { itemCreateTool } from '../../src/tools/item/item-create.js';
import { ItemCreateInputSchema } from '../../src/tools/item/schemas.js';
import { journalEntryCreateTool } from '../../src/tools/journal-entry/journalentry-create.js';
import { JournalEntryCreateInputSchema } from '../../src/tools/journal-entry/schemas.js';
import { createMockClientWrapper } from '../mocks/client.js';

type AnyRecord = Record<string, any>;

let mockClient: ReturnType<typeof createMockClientWrapper>;
beforeEach(() => {
  mockClient = createMockClientWrapper();
});

/**
 * Run `tool.execute(input)` with the SDK entity create method stubbed to
 * capture its payload, then push the captured payload through the REAL
 * transform and return the parsed wire object (unwrapped from `wrapperKey`).
 *
 * `argIndex` selects which create-arg is the payload — SDK arg order varies
 * per resource: most are (data, accountId); items/payments are
 * (accountId, data); paymentOptions is (accountId, entityId, data).
 */
async function captureWire(opts: {
  tool: { execute: (input: any, client: any) => Promise<any> };
  input: AnyRecord;
  entityKey: string; // fbClient.<entityKey>.create
  argIndex: number;
  transform: (payload: any) => string;
  wrapperKey?: string; // key in the emitted JSON ('' = flat)
  responseData: AnyRecord;
}): Promise<AnyRecord> {
  const captured: any[] = [];
  mockClient.executeWithRetry.mockImplementation(async (_op: string, apiCall: any) => {
    const fb: AnyRecord = {
      [opts.entityKey]: {
        create: vi.fn(async (...args: any[]) => {
          captured.push(args[opts.argIndex]);
          return { ok: true, data: opts.responseData };
        }),
      },
    };
    return apiCall(fb);
  });

  await opts.tool.execute(opts.input, mockClient as any);
  expect(captured).toHaveLength(1);
  const wire = JSON.parse(opts.transform(captured[0]));
  return opts.wrapperKey === '' ? wire : wire[opts.wrapperKey!];
}

// ---------------------------------------------------------------------------
// invoice_create — every advertised optional must reach the wire
// ---------------------------------------------------------------------------
describe('invoice_create transform allowlist', () => {
  const input = {
    accountId: 'ABC123',
    customerId: 777,
    createDate: '2026-06-10',
    dueOffsetDays: 14,
    currencyCode: 'USD',
    notes: 'wire-notes',
    terms: 'wire-terms',
    discountPercentage: 10,
    lines: [
      {
        name: 'Line A',
        description: 'desc A',
        qty: 2,
        unitCost: { amount: '100.00', code: 'USD' },
        taxName1: 'HST',
        taxAmount1: '13',
      },
    ],
  };

  it('maps every advertised invoice_create field onto the wire', async () => {
    const wire = await captureWire({
      tool: invoiceCreateTool,
      input,
      entityKey: 'invoices',
      argIndex: 0,
      transform: transformInvoiceRequest,
      wrapperKey: 'invoice',
      responseData: { invoice: { id: 1 } },
    });

    expect(wire.customerid).toBe(777);
    expect(wire.create_date).toBe('2026-06-10');
    expect(wire.due_offset_days).toBe(14);
    expect(wire.currency_code).toBe('USD');
    expect(wire.notes).toBe('wire-notes');
    expect(wire.terms).toBe('wire-terms');
    expect(wire.discount_value).toBe('10'); // PERCENT (live-verified, audit F2)
    expect(wire.lines).toHaveLength(1);
    expect(wire.lines[0].name).toBe('Line A');
    expect(wire.lines[0].description).toBe('desc A');
    expect(wire.lines[0].qty).toBe(2);
    expect(wire.lines[0].unit_cost).toEqual({ amount: '100.00', code: 'USD' });
    // Line tax keys are emitted camelCase by the SDK (its own wire contract)
    expect(wire.lines[0].taxName1).toBe('HST');
    expect(wire.lines[0].taxAmount1).toBe('13');
  });
});

// ---------------------------------------------------------------------------
// expense_create
// ---------------------------------------------------------------------------
describe('expense_create transform allowlist', () => {
  it('maps every advertised expense_create field onto the wire', async () => {
    const wire = await captureWire({
      tool: expenseCreateTool,
      input: {
        accountId: 'ABC123',
        categoryId: 11,
        staffId: 22,
        date: '2026-06-10',
        amount: { amount: '50.00', code: 'USD' },
        vendor: 'wire-vendor',
        notes: 'wire-notes',
        clientId: 33,
        projectId: 44,
        markupPercent: 15,
        taxName1: 'HST',
        taxPercent1: '13',
      },
      entityKey: 'expenses',
      argIndex: 0,
      transform: transformExpenseRequest,
      wrapperKey: 'expense',
      responseData: { expense: { id: 1 } },
    });

    expect(wire.categoryid).toBe(11);
    expect(wire.staffid).toBe(22);
    expect(wire.date).toBe('2026-06-10');
    expect(wire.amount).toEqual({ amount: '50.00', code: 'USD' });
    expect(wire.vendor).toBe('wire-vendor');
    expect(wire.notes).toBe('wire-notes');
    expect(wire.clientid).toBe(33);
    expect(wire.projectid).toBe(44);
    expect(wire.markup_percent).toBe(15);
    // tax keys are emitted camelCase by the SDK (its own wire contract)
    expect(wire.taxName1).toBe('HST');
    expect(wire.taxPercent1).toBe('13');
  });
});

// ---------------------------------------------------------------------------
// billvendor_create — the audit-F3 fields must reach the wire post-fix
// ---------------------------------------------------------------------------
describe('billvendor_create transform allowlist', () => {
  const input = {
    accountId: 'ABC123',
    vendorName: 'Wire Vendor',
    contactName: 'Ada Quality Lovelace',
    email: 'ada@wire.example.com',
    phone: '555-0001',
    website: 'https://wire.example.com',
    address: '1 Wire St',
    city: 'Wiretown',
    province: 'ON',
    postalCode: 'K1A 0A1',
    country: 'Canada',
    currencyCode: 'USD',
    accountNumber: 'ACCT-9',
    note: 'wire-note',
    is1099: true,
    language: 'en',
  };

  async function vendorWire(): Promise<AnyRecord> {
    return captureWire({
      tool: billvendorCreateTool,
      input,
      entityKey: 'billVendors',
      argIndex: 0,
      transform: transformBillVendorsRequest,
      wrapperKey: 'bill_vendor',
      responseData: { bill_vendor: { vendorId: 1 } },
    });
  }

  it('maps the advertised vendor fields (incl. the F3 contact block) onto the wire', async () => {
    const wire = await vendorWire();
    expect(wire.vendor_name).toBe('Wire Vendor');
    // F3: the previously-dropped contact block
    expect(wire.primary_contact_email).toBe('ada@wire.example.com');
    expect(wire.primary_contact_first_name).toBe('Ada');
    expect(wire.primary_contact_last_name).toBe('Quality Lovelace');
    expect(wire.street).toBe('1 Wire St');
    // the rest of the advertised set
    expect(wire.phone).toBe('555-0001');
    expect(wire.website).toBe('https://wire.example.com');
    expect(wire.city).toBe('Wiretown');
    expect(wire.province).toBe('ON');
    expect(wire.postal_code).toBe('K1A 0A1');
    expect(wire.country).toBe('Canada');
    expect(wire.currency_code).toBe('USD');
    expect(wire.account_number).toBe('ACCT-9');
    expect(wire.note).toBe('wire-note');
    expect(wire.is_1099).toBe(true);
    expect(wire.language).toBe('en');
  });

  // AUDIT F3 RESIDUAL — RESOLVED (2026-06-04): the bill_vendor wire object has
  // NO tax-number field (live-verified), so taxNumber was REMOVED from the
  // input schemas rather than silently discarded. Guard both directions: the
  // schema must not advertise it, and a stray value must not invent a wire key.
  it('taxNumber is no longer advertised and never reaches the wire', async () => {
    // not in the input schema...
    expect('taxNumber' in BillVendorCreateInputSchema.shape).toBe(false);
    expect('taxNumber' in BillVendorUpdateInputSchema.shape).toBe(false);
    // ...a stray taxNumber input is stripped by validation (not an error)...
    const parsed = BillVendorCreateInputSchema.parse({
      ...input,
      taxNumber: 'VAT-123',
    } as AnyRecord);
    expect((parsed as AnyRecord).taxNumber).toBeUndefined();
    // ...and nothing tax-number-shaped is emitted on the wire.
    const wire = await vendorWire();
    expect(wire.tax_number).toBeUndefined();
    expect(wire.taxNumber).toBeUndefined();
    expect(wire.vat_number).toBeUndefined();
  });

  // Same mapper + transform as create, but billvendor_update has its own
  // marshalling path (billVendors.update) — pin it independently.
  it('maps the advertised vendor fields onto the wire on the UPDATE path too', async () => {
    const captured: any[] = [];
    mockClient.executeWithRetry.mockImplementation(async (_op: string, apiCall: any) => {
      const fb = {
        billVendors: {
          update: vi.fn(async (data: any, _accountId: string, _vendorId: number) => {
            captured.push(data);
            return { ok: true, data: { bill_vendor: { vendorId: 12345 } } };
          }),
        },
      };
      return apiCall(fb);
    });
    await billvendorUpdateTool.execute(
      { ...input, vendorId: 12345 } as any,
      mockClient as any
    );
    expect(captured).toHaveLength(1);
    const wire = JSON.parse(transformBillVendorsRequest(captured[0])).bill_vendor;
    expect(wire.vendor_name).toBe('Wire Vendor');
    expect(wire.primary_contact_email).toBe('ada@wire.example.com');
    expect(wire.primary_contact_first_name).toBe('Ada');
    expect(wire.primary_contact_last_name).toBe('Quality Lovelace');
    expect(wire.street).toBe('1 Wire St');
    expect(wire.phone).toBe('555-0001');
    expect(wire.website).toBe('https://wire.example.com');
    expect(wire.city).toBe('Wiretown');
    expect(wire.province).toBe('ON');
    expect(wire.postal_code).toBe('K1A 0A1');
    expect(wire.country).toBe('Canada');
    expect(wire.currency_code).toBe('USD');
    expect(wire.account_number).toBe('ACCT-9');
    expect(wire.note).toBe('wire-note');
    expect(wire.is_1099).toBe(true);
    expect(wire.language).toBe('en');
  });

  // BETA-SCOPE BOUNDARY (per https://www.freshbooks.com/api/vendors): the API
  // also accepts street2, tax_defaults[] (associations to existing tax RATES —
  // NOT a place for a vendor tax-registration number) and vis_state on write,
  // but the tools deliberately do NOT expose them (Bill Vendors is beta; don't
  // expand surface). If one of these is ever added to a schema, this test
  // flips — add it to the wire assertions above when you do.
  it('does not advertise the writable-but-unexposed beta fields (street2, taxDefaults, visState)', () => {
    for (const shape of [BillVendorCreateInputSchema.shape, BillVendorUpdateInputSchema.shape]) {
      expect('street2' in shape).toBe(false);
      expect('taxDefaults' in shape).toBe(false);
      expect('visState' in shape).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// paymentoptions_create
// ---------------------------------------------------------------------------
describe('paymentoptions_create transform allowlist', () => {
  const input = {
    accountId: 'ABC123',
    entityId: 555,
    entityType: 'invoice' as const,
    gateway: 'stripe',
    hasAchTransfer: true,
    hasCreditCard: true,
    hasPaypalSmartCheckout: true,
    allowPartialPayments: true,
  };

  async function poWire(): Promise<AnyRecord> {
    const captured: any[] = [];
    mockClient.executeWithRetry.mockImplementation(async (_op: string, apiCall: any) => {
      const fb = {
        paymentOptions: {
          create: vi.fn(async (_accountId: string, _entityId: string, data: any) => {
            captured.push(data);
            return { ok: true, data: { entityId: 555 } };
          }),
        },
      };
      return apiCall(fb);
    });
    await paymentOptionsCreateTool.execute(input as any, mockClient as any);
    expect(captured).toHaveLength(1);
    return JSON.parse(transformPaymentOptionsRequest(captured[0])); // flat, no wrapper
  }

  it('maps gateway (F4 fix) and the boolean toggles onto the wire', async () => {
    const wire = await poWire();
    expect(wire.gateway_name).toBe('stripe'); // F4: was silently dropped
    expect(wire.entity_id).toBe(555);
    expect(wire.entity_type).toBe('invoice');
    expect(wire.has_ach_transfer).toBe(true);
    expect(wire.has_credit_card).toBe(true);
    expect(wire.allow_partial_payments).toBe(true);
  });

  // AUDIT FINDING 9 (FIXED): MCP field `hasPaypalSmartCheckout` (lowercase p)
  // is now mapped to the transform's `hasPayPalSmartCheckout` (capital P), so
  // the toggle reaches the wire instead of being silently dropped.
  it('maps hasPaypalSmartCheckout onto the wire (finding 9 fix)', async () => {
    const wire = await poWire();
    expect(wire.has_paypal_smart_checkout).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// bill_create
// ---------------------------------------------------------------------------
describe('bill_create transform allowlist', () => {
  const input = {
    accountId: 'ABC123',
    vendorId: 99,
    issueDate: '2026-06-10',
    dueOffsetDays: 30,
    currencyCode: 'USD',
    language: 'en',
    billNumber: 'BILL-7',
    lines: [
      { categoryId: 5, description: 'd', quantity: 1, unitCost: { amount: '10.00', code: 'USD' } },
    ],
  };

  async function billWire(): Promise<AnyRecord> {
    return captureWire({
      tool: billCreateTool,
      input,
      entityKey: 'bills',
      argIndex: 0,
      transform: transformBillsRequest,
      wrapperKey: 'bill',
      responseData: { bill: { id: 1 } },
    });
  }

  it('maps the advertised bill_create fields onto the wire', async () => {
    const wire = await billWire();
    expect(wire.vendorid).toBe(99);
    expect(wire.issue_date).toBe('2026-06-10');
    expect(wire.due_offset_days).toBe(30);
    expect(wire.currency_code).toBe('USD');
    expect(wire.language).toBe('en');
    expect(wire.bill_number).toBe('BILL-7');
    expect(wire.lines).toHaveLength(1);
    expect(wire.lines[0].categoryid).toBe(5);
    expect(wire.lines[0].unit_cost).toEqual({ amount: '10.00', code: 'USD' });
  });

  // AUDIT FINDING 8 (RESOLVED): the bills API has no writable notes field —
  // live-verified 2026-06-07 (a sent `notes` did not persist; bill 18833) and
  // `overall_description` is read-only (errno 1038 on write), auto-derived from
  // the line descriptions. So `notes` was removed from the create input schema.
  it('does not advertise or send bill notes (finding 8)', async () => {
    expect('notes' in BillCreateInputSchema.shape).toBe(false);
    const wire = await billWire();
    expect(wire.notes).toBeUndefined();
    expect(wire.overall_description).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// otherincome_create
// ---------------------------------------------------------------------------
describe('otherincome_create transform allowlist', () => {
  const input = {
    accountId: 'ABC123',
    amount: { amount: '100.00', code: 'USD' },
    categoryName: 'online_sales',
    date: '2026-06-10',
    paymentType: 'Cash',
    note: 'wire-note',
    source: 'wire-source',
    taxes: [{ name: 'HST', amount: '13.00' }],
  };

  async function oiWire(): Promise<AnyRecord> {
    return captureWire({
      tool: otherincomeCreateTool,
      input,
      entityKey: 'otherIncomes',
      argIndex: 0,
      transform: transformOtherIncomeRequest,
      wrapperKey: 'other_income',
      responseData: { other_income: { incomeId: 1 } },
    });
  }

  it('maps the advertised otherincome_create fields onto the wire', async () => {
    const wire = await oiWire();
    expect(wire.amount).toEqual({ amount: '100.00', code: 'USD' });
    expect(wire.category_name).toBe('online_sales');
    expect(wire.date).toBe('2026-06-10');
    expect(wire.payment_type).toBe('Cash');
    expect(wire.note).toBe('wire-note');
    expect(wire.source).toBe('wire-source');
    expect(wire.taxes).toHaveLength(1);
    expect(wire.taxes[0].name).toBe('HST');
    expect(wire.taxes[0].amount).toBe('13.00');
  });

  // AUDIT FINDING 7 (RESOLVED): the other_income tax sub-object has no
  // tax-percent field at all — live-verified 2026-06-07 (sent percent/
  // tax_percent/rate; API stored only { name, amount }). So `percent` was
  // removed from the tax schema; a stray value is stripped and never reaches
  // the wire.
  it('does not advertise or send a tax percent (finding 7)', async () => {
    const taxShape = (OtherIncomeCreateInputSchema.shape.taxes as any).unwrap().element.shape;
    expect('percent' in taxShape).toBe(false);
    const wire = await oiWire();
    expect(wire.taxes[0].percent).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// payment_create
// ---------------------------------------------------------------------------
describe('payment_create transform allowlist', () => {
  const input = {
    accountId: 'ABC123',
    invoiceId: 321,
    amount: { amount: '75.00', code: 'USD' },
    date: '2026-06-10',
    type: 'Cash',
    note: 'wire-note',
    sendEmailReceipt: true,
  };

  async function paymentWire(): Promise<AnyRecord> {
    return captureWire({
      tool: paymentCreateTool,
      input,
      entityKey: 'payments',
      argIndex: 1, // payments.create is (accountId, data)
      transform: transformPaymentRequest,
      wrapperKey: 'payment',
      responseData: { payment: { id: 1 } },
    });
  }

  it('maps the advertised payment_create fields onto the wire', async () => {
    const wire = await paymentWire();
    expect(wire.invoiceid).toBe(321);
    expect(wire.amount).toEqual({ amount: '75.00', code: 'USD' });
    expect(wire.date).toBe('2026-06-10');
    expect(wire.type).toBe('Cash');
    expect(wire.note).toBe('wire-note');
  });

  // AUDIT FINDING 10 (RESOLVED): sendEmailReceipt was advertised but never
  // sent (the payments API/SDK transform has no such field in either
  // direction). Removed from the schema rather than faking support.
  it('does not advertise or send sendEmailReceipt (finding 10)', async () => {
    expect('sendEmailReceipt' in PaymentCreateInputSchema.shape).toBe(false);
    const wire = await paymentWire();
    expect(wire.send_email_receipt).toBeUndefined();
    expect(wire.sendEmailReceipt).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// item_create
// ---------------------------------------------------------------------------
describe('item_create transform allowlist', () => {
  const input = {
    accountId: 'ABC123',
    name: 'Wire Item',
    description: 'wire-desc',
    unitCost: { amount: '20.00', code: 'USD' },
    qty: '3',
    tax1: 11,
    inventory: 5,
    sku: 'SKU-1',
  };

  async function itemWire(): Promise<AnyRecord> {
    return captureWire({
      tool: itemCreateTool,
      input,
      entityKey: 'items',
      argIndex: 1, // items.create is (accountId, data)
      transform: transformItemRequest,
      wrapperKey: 'item',
      responseData: { item: { id: 1 } },
    });
  }

  it('maps the advertised item_create fields onto the wire', async () => {
    const wire = await itemWire();
    expect(wire.name).toBe('Wire Item');
    expect(wire.description).toBe('wire-desc');
    expect(wire.unit_cost).toEqual({ amount: '20.00', code: 'USD' });
    expect(wire.qty).toBe('3');
    expect(wire.tax1).toBe(11);
    expect(wire.inventory).toBe(5);
    expect(wire.sku).toBe('SKU-1');
  });

  // AUDIT FINDING 11 (RESOLVED): the item object has no `type` or `taxable`
  // field (live-verified 2026-06-07; the wire item exposes name, description,
  // unit_cost, qty, sku, tax1/tax2, tax_rule_code, inventory, vis_state, …).
  // Taxability is set via tax1/tax2. Both were removed from the item schemas
  // rather than left as defaulted no-ops.
  it('does not advertise or send type / taxable (finding 11)', async () => {
    expect('type' in ItemCreateInputSchema.shape).toBe(false);
    expect('taxable' in ItemCreateInputSchema.shape).toBe(false);
    const wire = await itemWire();
    expect(wire.type).toBeUndefined();
    expect(wire.taxable).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// journalentry_create — RAW HTTP path: guard the hand-built body instead of an
// SDK transform (the tool bypasses the SDK; the body IS the wire).
// ---------------------------------------------------------------------------
describe('journalentry_create raw-body allowlist', () => {
  const input = {
    accountId: 'ABC123',
    name: 'Wire JE',
    description: 'top-level memo',
    date: '2026-06-10',
    currencyCode: 'USD',
    details: [
      { subAccountId: 1, debit: '10.00' },
      { subAccountId: 2, credit: '10.00' },
    ],
  };

  async function jeBody(): Promise<AnyRecord> {
    mockClient.executeRawWithRetry.mockResolvedValue({
      ok: true,
      status: 200,
      data: { response: { result: { journal_entry: { id: 1, details: [] } } } },
    });
    await journalEntryCreateTool.execute(input as any, mockClient as any);
    const call = mockClient.executeRawWithRetry.mock.calls[0];
    expect(call[0]).toBe('POST');
    return (call[2] as AnyRecord).journal_entry;
  }

  it('sends the core journal entry fields on the wire', async () => {
    const body = await jeBody();
    expect(body.name).toBe('Wire JE');
    expect(body.user_entered_date).toBe('2026-06-10');
    expect(body.currency_code).toBe('USD');
    expect(body.details).toEqual([
      { sub_accountid: 1, debit: '10.00' },
      { sub_accountid: 2, credit: '10.00' },
    ]);
  });

  // AUDIT FINDING 6 (FIXED): the raw-HTTP rewrite had dropped the top-level
  // `description` the SDK transform sends (so it was a silent no-op the tool
  // echoed back as if saved). It is now included in the raw body.
  // Live-verified 2026-06-07 (JE 4156475): the API stores it.
  it('sends the top-level description on the wire (finding 6 fix)', async () => {
    const body = await jeBody();
    expect(body.description).toBe('top-level memo');
  });

  // AUDIT FINDING 6b (RESOLVED): there is no independent per-line memo — the
  // API stamps the entry-level description onto every detail line
  // (live-verified 2026-06-07: JE 4156475 stored both lines with the entry
  // memo, not the per-line values sent). So `description` was removed from the
  // detail INPUT schema and is not emitted per line.
  it('does not advertise or send a per-line description (finding 6b)', async () => {
    // not in the detail input schema...
    const detailShape = (JournalEntryCreateInputSchema.shape.details as any).element.shape;
    expect('description' in detailShape).toBe(false);
    // ...and never emitted per line on the wire.
    const body = await jeBody();
    expect(body.details[0].description).toBeUndefined();
  });
});
