/**
 * Tests for creditnote_update tool
 *
 * creditnote_update PUTs the wire payload directly via executeRawWithRetry with
 * the SINGULAR `credit_note` wrapper, because the SDK's creditNotes.update sends
 * the broken PLURAL `credit_notes` wrapper (#81).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { creditnoteUpdateTool } from '../../../src/tools/credit-note/creditnote-update.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockCreditNoteUpdateResponse,
  mockCreditNoteNotFoundError,
  mockCreditNoteValidationError,
  mockCreditNoteAlreadyAppliedError,
} from '../../mocks/responses/credit-note.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
  mockNetworkTimeoutError,
} from '../../mocks/errors/freshbooks-errors.js';

// creditnote_update consumes the raw accounting envelope via executeRawWithRetry;
// wrap a mock note's credit_note into { response: { result: { credit_note } } }.
const toRaw = (r: any) => ({ ok: true, data: { response: { result: { credit_note: r.data.credit_note } } } });

describe('creditnote_update tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  const validInput = {
    accountId: 'ABC123',
    creditNoteId: 12345,
    notes: 'Updated notes',
  };

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should update credit note notes', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue(toRaw(mockCreditNoteUpdateResponse(12345, { notes: 'Updated notes' })));

      const result = await creditnoteUpdateTool.execute(validInput, mockClient as any);

      expect(result.id).toBe(12345);
      expect(result.notes).toBe('Updated notes');
    });

    it('should update credit note terms', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue(toRaw(mockCreditNoteUpdateResponse(12345, { terms: 'New terms and conditions' })));

      const result = await creditnoteUpdateTool.execute(
        { accountId: 'ABC123', creditNoteId: 12345, terms: 'New terms and conditions' },
        mockClient as any
      );

      expect(result.terms).toBe('New terms and conditions');
    });

    it('should update credit note date', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue(toRaw(mockCreditNoteUpdateResponse(12345, { createDate: '2024-02-01' })));

      const result = await creditnoteUpdateTool.execute(
        { accountId: 'ABC123', creditNoteId: 12345, createDate: '2024-02-01T00:00:00Z' },
        mockClient as any
      );

      expect(result.create_date).toBe('2024-02-01');
    });

    it('should send the createDate verbatim (already normalized to ...T00:00:00Z by the schema)', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue(toRaw(mockCreditNoteUpdateResponse(12345, {})));

      await creditnoteUpdateTool.execute(
        { accountId: 'ABC123', creditNoteId: 12345, createDate: '2024-02-01T00:00:00Z' },
        mockClient as any
      );

      const body = mockClient.executeRawWithRetry.mock.calls[0][2] as any;
      expect(body.credit_note.create_date).toBe('2024-02-01T00:00:00Z');
    });

    it('should update credit note lines', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue(
        toRaw(mockCreditNoteUpdateResponse(12345, {
          lines: [{ lineid: 1, name: 'Updated refund item', amount: { amount: '200.00', code: 'USD' } }],
        }))
      );

      const result = await creditnoteUpdateTool.execute(
        {
          accountId: 'ABC123',
          creditNoteId: 12345,
          lines: [{ name: 'Updated refund item', amount: { amount: '200.00', code: 'USD' } }],
        },
        mockClient as any
      );

      expect(result.lines[0].name).toBe('Updated refund item');
    });

    it('should update multiple fields at once', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue(
        toRaw(mockCreditNoteUpdateResponse(12345, { notes: 'Updated notes', terms: 'Updated terms', createDate: '2024-02-15' }))
      );

      const result = await creditnoteUpdateTool.execute(
        {
          accountId: 'ABC123',
          creditNoteId: 12345,
          notes: 'Updated notes',
          terms: 'Updated terms',
          createDate: '2024-02-15T00:00:00Z',
        },
        mockClient as any
      );

      expect(result.notes).toBe('Updated notes');
      expect(result.terms).toBe('Updated terms');
    });

    it('should PUT the singular credit_note wrapper to the right endpoint', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue(toRaw(mockCreditNoteUpdateResponse(12345, {})));

      await creditnoteUpdateTool.execute(validInput, mockClient as any);

      const [method, path, body, op] = mockClient.executeRawWithRetry.mock.calls[0];
      expect(method).toBe('PUT');
      expect(path).toBe('/accounting/account/ABC123/credit_notes/credit_notes/12345');
      expect(body).toEqual({ credit_note: { notes: 'Updated notes' } });
      expect(op).toBe('creditnote_update');
    });
  });

  describe('error handling', () => {
    it('should handle not found error', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue(mockCreditNoteNotFoundError(99999));
      await expect(
        creditnoteUpdateTool.execute({ accountId: 'ABC123', creditNoteId: 99999, notes: 'Test' }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue(mockUnauthorizedError());
      await expect(creditnoteUpdateTool.execute(validInput, mockClient as any)).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue(mockRateLimitError(60));
      await expect(creditnoteUpdateTool.execute(validInput, mockClient as any)).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue(mockServerError());
      await expect(creditnoteUpdateTool.execute(validInput, mockClient as any)).rejects.toThrow();
    });

    it('should throw a default error when the raw request fails without an error', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue({ ok: false, status: 500 });
      await expect(creditnoteUpdateTool.execute(validInput, mockClient as any)).rejects.toThrow('Credit note update failed');
    });

    it('should handle network timeout', async () => {
      mockClient.executeRawWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());
      await expect(creditnoteUpdateTool.execute(validInput, mockClient as any)).rejects.toThrow();
    });

    it('should handle validation error', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue(mockCreditNoteValidationError('notes', 'Notes too long'));
      await expect(creditnoteUpdateTool.execute(validInput, mockClient as any)).rejects.toThrow();
    });

    it('should handle already applied credit note error', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue(mockCreditNoteAlreadyAppliedError(12345));
      await expect(creditnoteUpdateTool.execute(validInput, mockClient as any)).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        creditnoteUpdateTool.execute({ creditNoteId: 12345, notes: 'Test' } as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require creditNoteId', async () => {
      await expect(
        creditnoteUpdateTool.execute({ accountId: 'ABC123', notes: 'Test' } as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should reject non-numeric creditNoteId', async () => {
      await expect(
        creditnoteUpdateTool.execute({ accountId: 'ABC123', creditNoteId: 'invalid', notes: 'Test' } as any, mockClient as any)
      ).rejects.toThrow();
    });
  });
});
