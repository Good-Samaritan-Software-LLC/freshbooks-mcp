/**
 * Tests for creditnote_single tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { creditnoteSingleTool } from '../../../src/tools/credit-note/creditnote-single.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockCreditNoteSingleResponse,
  mockCreditNoteNotFoundError,
} from '../../mocks/responses/credit-note.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
  mockNetworkTimeoutError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('creditnote_single tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    // Helper to create list response for single credit note (workaround for SDK bug)
    const createListResponseWithCreditNote = (creditNote: Record<string, unknown>) => ({
      ok: true,
      data: {
        creditNotes: [creditNote],
        pages: { page: 1, pages: 1, total: 1, per_page: 30 },
      },
    });

    it('should retrieve a credit note by ID', async () => {
      const creditNote = { id: 12345, credit_note_number: 'CN-12345' };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            list: vi.fn().mockResolvedValue(createListResponseWithCreditNote(creditNote)),
          },
        };
        return apiCall(client);
      });

      const result = await creditnoteSingleTool.execute(
        { accountId: 'ABC123', creditNoteId: 12345 },
        mockClient as any
      );

      expect(result.id).toBe(12345);
    });

    it('should return complete credit note details', async () => {
      const creditNote = {
        id: 12345,
        credit_note_number: 'CN-12345',
        clientid: 67890,
        status: 'created',
        amount: { amount: '150.00', code: 'USD' },
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            list: vi.fn().mockResolvedValue(createListResponseWithCreditNote(creditNote)),
          },
        };
        return apiCall(client);
      });

      const result = await creditnoteSingleTool.execute(
        { accountId: 'ABC123', creditNoteId: 12345 },
        mockClient as any
      );

      expect(result.id).toBe(12345);
      expect(result.credit_note_number).toBe('CN-12345');
      expect(result.status).toBe('created');
    });

    it('should return credit note with line items', async () => {
      const creditNote = {
        id: 12345,
        lines: [
          {
            lineid: 1,
            name: 'Refund for service',
            description: 'Credit for returned product',
            qty: 1,
            amount: { amount: '100.00', code: 'USD' },
          },
          {
            lineid: 2,
            name: 'Discount adjustment',
            description: 'Additional credit',
            qty: 1,
            amount: { amount: '50.00', code: 'USD' },
          },
        ],
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            list: vi.fn().mockResolvedValue(createListResponseWithCreditNote(creditNote)),
          },
        };
        return apiCall(client);
      });

      const result = await creditnoteSingleTool.execute(
        { accountId: 'ABC123', creditNoteId: 12345 },
        mockClient as any
      );

      expect(result.lines).toHaveLength(2);
      expect(result.lines[0].name).toBe('Refund for service');
    });

    it('should return credit note with client info', async () => {
      const creditNote = {
        id: 12345,
        organization: 'Test Corp',
        fname: 'Jane',
        lname: 'Smith',
        email: 'jane@testcorp.com',
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            list: vi.fn().mockResolvedValue(createListResponseWithCreditNote(creditNote)),
          },
        };
        return apiCall(client);
      });

      const result = await creditnoteSingleTool.execute(
        { accountId: 'ABC123', creditNoteId: 12345 },
        mockClient as any
      );

      expect(result.organization).toBe('Test Corp');
      expect(result.fname).toBe('Jane');
      expect(result.lname).toBe('Smith');
    });

    it('should return credit note with different statuses', async () => {
      const creditNote = {
        id: 12345,
        status: 'applied',
        display_status: 'applied',
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            list: vi.fn().mockResolvedValue(createListResponseWithCreditNote(creditNote)),
          },
        };
        return apiCall(client);
      });

      const result = await creditnoteSingleTool.execute(
        { accountId: 'ABC123', creditNoteId: 12345 },
        mockClient as any
      );

      expect(result.status).toBe('applied');
    });
  });

  describe('error handling', () => {
    // Helper for empty list response (not found)
    const createEmptyListResponse = () => ({
      ok: true,
      data: {
        creditNotes: [],
        pages: { page: 1, pages: 1, total: 0, per_page: 30 },
      },
    });

    it('should handle not found error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            list: vi.fn().mockResolvedValue(createEmptyListResponse()),
          },
        };
        return apiCall(client);
      });

      await expect(
        creditnoteSingleTool.execute(
          { accountId: 'ABC123', creditNoteId: 99999 },
          mockClient as any
        )
      ).rejects.toThrow('Credit note 99999 not found');
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            list: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        creditnoteSingleTool.execute(
          { accountId: 'ABC123', creditNoteId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            list: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        creditnoteSingleTool.execute(
          { accountId: 'ABC123', creditNoteId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            list: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        creditnoteSingleTool.execute(
          { accountId: 'ABC123', creditNoteId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());

      await expect(
        creditnoteSingleTool.execute(
          { accountId: 'ABC123', creditNoteId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        creditnoteSingleTool.execute({ creditNoteId: 12345 } as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require creditNoteId', async () => {
      await expect(
        creditnoteSingleTool.execute({ accountId: 'ABC123' } as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should reject non-numeric creditNoteId', async () => {
      await expect(
        creditnoteSingleTool.execute(
          { accountId: 'ABC123', creditNoteId: 'invalid' } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });
});
