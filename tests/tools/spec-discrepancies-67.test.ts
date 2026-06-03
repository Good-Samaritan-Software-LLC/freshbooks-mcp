/**
 * Tests for the #67 behavioral type fixes (H1/H4/H5): output schemas must accept
 * the STRING ids the FreshBooks API actually returns, so output validation can't
 * reject a real response. They stay tolerant of numbers for back-compat.
 */
import { describe, it, expect } from 'vitest';
import { PaymentSchema } from '../../src/tools/payment/schemas.js';
import { OtherIncomeSchema } from '../../src/tools/other-income/schemas.js';
import { CreditNoteSchema } from '../../src/tools/credit-note/schemas.js';

describe('#67 H1 — payment id fields accept strings', () => {
  for (const field of ['id', 'invoiceId', 'clientId'] as const) {
    it(`PaymentSchema.${field} accepts a string and a number`, () => {
      const s = (PaymentSchema.shape as any)[field];
      expect(s.safeParse('99999').success).toBe(true);
      expect(s.safeParse(99999).success).toBe(true);
    });
  }
});

describe('#67 H4 — other-income incomeId accepts a string', () => {
  it('OtherIncomeSchema.incomeId accepts a string and a number', () => {
    const s = OtherIncomeSchema.shape.incomeId;
    expect(s.safeParse('12345').success).toBe(true);
    expect(s.safeParse(12345).success).toBe(true);
  });
});

describe('#67 H5 — credit-note clientId accepts a string', () => {
  it('CreditNoteSchema.clientId accepts a string and a number', () => {
    const s = CreditNoteSchema.shape.clientId;
    expect(s.safeParse('67890').success).toBe(true);
    expect(s.safeParse(67890).success).toBe(true);
  });
});
