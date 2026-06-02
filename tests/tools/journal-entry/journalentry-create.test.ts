/**
 * Tests for journalentry_create tool
 *
 * journalentry_create POSTs the wire payload directly (executeRawWithRetry),
 * NOT via the SDK transform, because the SDK omits currency_code (a journal
 * entry without it 500s with "error accessing your account data", #70) and
 * shifts the date back a day in negative-UTC timezones. These tests drive that
 * raw path and assert the wire body the tool builds.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { journalEntryCreateTool } from '../../../src/tools/journal-entry/journalentry-create.js';
import { JournalEntryCreateInputSchema } from '../../../src/tools/journal-entry/schemas.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import { mockJournalEntryCreateRawResponse } from '../../mocks/responses/journal-entry.js';

describe('journalentry_create tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  const validInput = {
    accountId: 'ABC123',
    name: 'Monthly Depreciation',
    date: '2024-01-31',
    description: 'Record monthly equipment depreciation',
    currencyCode: 'USD',
    details: [
      { subAccountId: 100, debit: '1000.00', description: 'Depreciation expense' },
      { subAccountId: 200, credit: '1000.00', description: 'Accumulated depreciation' },
    ],
  };

  /** The wire body (3rd arg) the tool passed to executeRawWithRetry. */
  const sentBody = () => mockClient.executeRawWithRetry.mock.calls[0][2] as any;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should create a journal entry with required fields', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue(
        mockJournalEntryCreateRawResponse({ name: 'Monthly Depreciation', date: '2024-01-31' })
      );

      const result = await journalEntryCreateTool.execute(validInput, mockClient as any);

      expect(result.id).toBe(99999);
      expect(result.name).toBe('Monthly Depreciation');
      expect(result.details).toHaveLength(2);
    });

    it('should POST to the accounting journal_entries endpoint', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue(mockJournalEntryCreateRawResponse());

      await journalEntryCreateTool.execute(validInput, mockClient as any);

      const [method, path] = mockClient.executeRawWithRetry.mock.calls[0];
      expect(method).toBe('POST');
      expect(path).toBe('/accounting/account/ABC123/journal_entries/journal_entries');
    });

    it('should map detail lines to sub_accountid wire fields', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue(mockJournalEntryCreateRawResponse());

      await journalEntryCreateTool.execute(validInput, mockClient as any);

      const details = sentBody().journal_entry.details;
      expect(details).toEqual([
        { sub_accountid: 100, debit: '1000.00' },
        { sub_accountid: 200, credit: '1000.00' },
      ]);
    });

    it('should create with multiple detail lines', async () => {
      const details = [
        { subAccountId: 100, debit: '250.00' },
        { subAccountId: 101, debit: '250.00' },
        { subAccountId: 200, credit: '300.00' },
        { subAccountId: 201, credit: '200.00' },
      ];
      mockClient.executeRawWithRetry.mockResolvedValue(
        mockJournalEntryCreateRawResponse({ details })
      );

      const result = await journalEntryCreateTool.execute(
        { ...validInput, details },
        mockClient as any
      );

      expect(result.details).toHaveLength(4);
    });

    it('should preserve decimal precision in the wire body', async () => {
      const details = [
        { subAccountId: 100, debit: '123.45' },
        { subAccountId: 200, credit: '123.45' },
      ];
      mockClient.executeRawWithRetry.mockResolvedValue(
        mockJournalEntryCreateRawResponse({ details })
      );

      await journalEntryCreateTool.execute({ ...validInput, details }, mockClient as any);

      expect(sentBody().journal_entry.details[0].debit).toBe('123.45');
      expect(sentBody().journal_entry.details[1].credit).toBe('123.45');
    });

    it('should pass through a custom currency', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue(
        mockJournalEntryCreateRawResponse({ currencyCode: 'EUR' })
      );

      const result = await journalEntryCreateTool.execute(
        { ...validInput, currencyCode: 'EUR' },
        mockClient as any
      );

      expect(sentBody().journal_entry.currency_code).toBe('EUR');
      expect(result.currencyCode).toBe('EUR');
    });
  });

  describe('#70 regressions', () => {
    it('should send currency_code=USD even when currencyCode is omitted', async () => {
      // A journal entry without currency_code 500s. The handler defaults it
      // defensively (and wrapHandler also applies the schema default at the
      // boundary) — so a missing currencyCode still yields currency_code=USD.
      const { currencyCode, ...noCurrency } = validInput;
      mockClient.executeRawWithRetry.mockResolvedValue(mockJournalEntryCreateRawResponse());

      await journalEntryCreateTool.execute(noCurrency as any, mockClient as any);

      expect(sentBody().journal_entry.currency_code).toBe('USD');
    });

    it('should send the date unshifted (no UTC off-by-one)', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue(
        mockJournalEntryCreateRawResponse({ date: '2026-06-02' })
      );

      await journalEntryCreateTool.execute(
        { ...validInput, date: '2026-06-02' },
        mockClient as any
      );

      // Raw "YYYY-MM-DD" must be sent verbatim — not run through the SDK's
      // timezone-shifting transformDateRequest.
      expect(sentBody().journal_entry.user_entered_date).toBe('2026-06-02');
    });

    it('should not send per-line description (the API ignores it)', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue(mockJournalEntryCreateRawResponse());

      await journalEntryCreateTool.execute(validInput, mockClient as any);

      for (const d of sentBody().journal_entry.details) {
        expect(d).not.toHaveProperty('description');
      }
    });
  });

  describe('error handling', () => {
    it('should throw when the raw request fails', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue({
        ok: false,
        status: 500,
        error: new Error('HTTP 500: There was an error accessing your account data.'),
      });

      await expect(
        journalEntryCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should throw a default error when none is provided', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue({ ok: false, status: 500 });

      await expect(
        journalEntryCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow('Journal entry creation failed');
    });

    it('should propagate a rejected raw request', async () => {
      mockClient.executeRawWithRetry.mockRejectedValueOnce(new Error('network timeout'));

      await expect(
        journalEntryCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });
  });

  describe('balance validation', () => {
    // These reject BEFORE any network call, so no raw mock is needed.
    it('should reject when debits exceed credits', async () => {
      await expect(
        journalEntryCreateTool.execute(
          {
            ...validInput,
            details: [
              { subAccountId: 100, debit: '1000.00' },
              { subAccountId: 200, credit: '500.00' },
            ],
          },
          mockClient as any
        )
      ).rejects.toThrow(/must balance/i);
      expect(mockClient.executeRawWithRetry).not.toHaveBeenCalled();
    });

    it('should reject when credits exceed debits', async () => {
      await expect(
        journalEntryCreateTool.execute(
          {
            ...validInput,
            details: [
              { subAccountId: 100, debit: '500.00' },
              { subAccountId: 200, credit: '1000.00' },
            ],
          },
          mockClient as any
        )
      ).rejects.toThrow(/must balance/i);
    });

    it('should accept a balanced entry with multiple debits and credits', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue(mockJournalEntryCreateRawResponse());

      await expect(
        journalEntryCreateTool.execute(
          {
            ...validInput,
            details: [
              { subAccountId: 100, debit: '600.00' },
              { subAccountId: 101, debit: '400.00' },
              { subAccountId: 200, credit: '700.00' },
              { subAccountId: 201, credit: '300.00' },
            ],
          },
          mockClient as any
        )
      ).resolves.toBeDefined();
    });

    it('should tolerate floating point (0.10 + 0.20 = 0.30)', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue(mockJournalEntryCreateRawResponse());

      await expect(
        journalEntryCreateTool.execute(
          {
            ...validInput,
            details: [
              { subAccountId: 100, debit: '0.10' },
              { subAccountId: 101, debit: '0.20' },
              { subAccountId: 200, credit: '0.30' },
            ],
          },
          mockClient as any
        )
      ).resolves.toBeDefined();
    });

    it('should reject imbalance beyond the 0.01 tolerance', async () => {
      await expect(
        journalEntryCreateTool.execute(
          {
            ...validInput,
            details: [
              { subAccountId: 100, debit: '1000.00' },
              { subAccountId: 200, credit: '1000.02' },
            ],
          },
          mockClient as any
        )
      ).rejects.toThrow(/must balance/i);
    });

    it('should accept imbalance exactly at the 0.01 tolerance', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue(mockJournalEntryCreateRawResponse());

      await expect(
        journalEntryCreateTool.execute(
          {
            ...validInput,
            details: [
              { subAccountId: 100, debit: '1000.00' },
              { subAccountId: 200, credit: '1000.01' },
            ],
          },
          mockClient as any
        )
      ).resolves.toBeDefined();
    });

    it('should report a detailed message for an unbalanced entry', async () => {
      await expect(
        journalEntryCreateTool.execute(
          {
            ...validInput,
            details: [
              { subAccountId: 100, debit: '1500.00' },
              { subAccountId: 200, credit: '1000.00' },
            ],
          },
          mockClient as any
        )
      ).rejects.toThrow(/Debits: 1500\.00, Credits: 1000\.00, Difference: 500\.00/);
    });
  });

  describe('input schema validation', () => {
    // Boundary validation runs in wrapHandler (and in the hosted registry). Here
    // we assert the schema contract directly — the source of truth both layers
    // enforce.
    const parse = (input: unknown) => JournalEntryCreateInputSchema.safeParse(input);

    it('should accept valid input', () => {
      expect(parse(validInput).success).toBe(true);
    });

    it('should require accountId', () => {
      const { accountId, ...rest } = validInput;
      expect(parse(rest).success).toBe(false);
    });

    it('should require name', () => {
      const { name, ...rest } = validInput;
      expect(parse(rest).success).toBe(false);
    });

    it('should reject empty name', () => {
      expect(parse({ ...validInput, name: '' }).success).toBe(false);
    });

    it('should require date', () => {
      const { date, ...rest } = validInput;
      expect(parse(rest).success).toBe(false);
    });

    it('should reject a non-YYYY-MM-DD date', () => {
      expect(parse({ ...validInput, date: '2024/01/31' }).success).toBe(false);
      expect(parse({ ...validInput, date: '2024-01-31T10:00:00Z' }).success).toBe(false);
    });

    it('should require at least 2 detail lines', () => {
      expect(parse({ ...validInput, details: [{ subAccountId: 100, debit: '1000.00' }] }).success).toBe(false);
    });

    it('should require subAccountId in each detail', () => {
      expect(
        parse({
          ...validInput,
          details: [{ debit: '1000.00' }, { subAccountId: 200, credit: '1000.00' }],
        }).success
      ).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle unicode in name', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue(
        mockJournalEntryCreateRawResponse({ name: '日本語テスト Entry 🔢' })
      );

      const result = await journalEntryCreateTool.execute(
        { ...validInput, name: '日本語テスト Entry 🔢' },
        mockClient as any
      );

      expect(result.name).toBe('日本語テスト Entry 🔢');
    });

    it('should handle a leap-year date', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue(
        mockJournalEntryCreateRawResponse({ date: '2024-02-29' })
      );

      const result = await journalEntryCreateTool.execute(
        { ...validInput, date: '2024-02-29' },
        mockClient as any
      );

      expect(result.date).toBe('2024-02-29');
    });

    it('should return an empty details array when the response omits details', async () => {
      const resp = mockJournalEntryCreateRawResponse();
      delete resp.data.response.result.journal_entry.details;
      mockClient.executeRawWithRetry.mockResolvedValue(resp);

      const result = await journalEntryCreateTool.execute(validInput, mockClient as any);

      expect(result.details).toEqual([]);
    });

    it('should fall back across response-shape variations', async () => {
      // A defensively-handled shape: no response envelope (data IS the entry),
      // entryid instead of id, no user_entered_date, and a per-detail description.
      mockClient.executeRawWithRetry.mockResolvedValue({
        ok: true,
        status: 200,
        data: {
          entryid: 4242,
          name: 'flat shape',
          user_entered_date: undefined,
          currency_code: 'USD',
          details: [
            { sub_accountid: 100, debit: '1.00', description: 'd-desc' },
            { sub_accountid: 200, credit: '1.00' },
          ],
        },
      });

      const result = await journalEntryCreateTool.execute(
        { ...validInput, date: '2024-01-31', details: [
          { subAccountId: 100, debit: '1.00' },
          { subAccountId: 200, credit: '1.00' },
        ] },
        mockClient as any
      );

      expect(result.id).toBe(4242); // id ?? entryid
      expect(result.date).toBe('2024-01-31'); // user_entered_date ?? input date
      expect(result.details[0].description).toBe('d-desc');
    });

    it('should surface a description returned by the API', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue(
        mockJournalEntryCreateRawResponse({ description: 'API-stored description' })
      );

      const result = await journalEntryCreateTool.execute(validInput, mockClient as any);

      expect(result.description).toBe('API-stored description');
    });

    it('should handle many detail lines', async () => {
      const manyDetails = Array.from({ length: 50 }, (_, i) => ({
        subAccountId: 100 + i,
        debit: i % 2 === 0 ? '20.00' : undefined,
        credit: i % 2 === 1 ? '20.00' : undefined,
      }));
      mockClient.executeRawWithRetry.mockResolvedValue(
        mockJournalEntryCreateRawResponse({ details: manyDetails })
      );

      const result = await journalEntryCreateTool.execute(
        { ...validInput, details: manyDetails },
        mockClient as any
      );

      expect(result.details).toHaveLength(50);
    });
  });
});
