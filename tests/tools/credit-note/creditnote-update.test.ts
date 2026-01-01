/**
 * Tests for creditnote_update tool
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
      const mockResponse = mockCreditNoteUpdateResponse(12345, {
        notes: 'Updated notes',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await creditnoteUpdateTool.execute(validInput, mockClient as any);

      expect(result.id).toBe(12345);
      expect(result.notes).toBe('Updated notes');
    });

    it('should update credit note terms', async () => {
      const mockResponse = mockCreditNoteUpdateResponse(12345, {
        terms: 'New terms and conditions',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await creditnoteUpdateTool.execute(
        { accountId: 'ABC123', creditNoteId: 12345, terms: 'New terms and conditions' },
        mockClient as any
      );

      expect(result.terms).toBe('New terms and conditions');
    });

    it('should update credit note date', async () => {
      const mockResponse = mockCreditNoteUpdateResponse(12345, {
        createDate: '2024-02-01',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await creditnoteUpdateTool.execute(
        { accountId: 'ABC123', creditNoteId: 12345, createDate: '2024-02-01T00:00:00Z' },
        mockClient as any
      );

      expect(result.create_date).toBe('2024-02-01');
    });

    it('should update credit note lines', async () => {
      const mockResponse = mockCreditNoteUpdateResponse(12345, {
        lines: [
          {
            lineid: 1,
            name: 'Updated refund item',
            amount: { amount: '200.00', code: 'USD' },
          },
        ],
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await creditnoteUpdateTool.execute(
        {
          accountId: 'ABC123',
          creditNoteId: 12345,
          lines: [
            { name: 'Updated refund item', amount: { amount: '200.00', code: 'USD' } },
          ],
        },
        mockClient as any
      );

      expect(result.lines[0].name).toBe('Updated refund item');
    });

    it('should update multiple fields at once', async () => {
      const mockResponse = mockCreditNoteUpdateResponse(12345, {
        notes: 'Updated notes',
        terms: 'Updated terms',
        createDate: '2024-02-15',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

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

    it('should call API with correct parameters', async () => {
      const mockResponse = mockCreditNoteUpdateResponse(12345, {});
      const updateFn = vi.fn().mockResolvedValue(mockResponse);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            update: updateFn,
          },
        };
        return apiCall(client);
      });

      await creditnoteUpdateTool.execute(validInput, mockClient as any);

      expect(updateFn).toHaveBeenCalledWith({ notes: 'Updated notes' }, 'ABC123', '12345');
    });
  });

  describe('error handling', () => {
    it('should handle not found error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            update: vi.fn().mockResolvedValue(mockCreditNoteNotFoundError(99999)),
          },
        };
        return apiCall(client);
      });

      await expect(
        creditnoteUpdateTool.execute(
          { accountId: 'ABC123', creditNoteId: 99999, notes: 'Test' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            update: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        creditnoteUpdateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            update: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        creditnoteUpdateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            update: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        creditnoteUpdateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());

      await expect(
        creditnoteUpdateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle validation error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            update: vi.fn().mockResolvedValue(
              mockCreditNoteValidationError('notes', 'Notes too long')
            ),
          },
        };
        return apiCall(client);
      });

      await expect(
        creditnoteUpdateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle already applied credit note error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            update: vi.fn().mockResolvedValue(mockCreditNoteAlreadyAppliedError(12345)),
          },
        };
        return apiCall(client);
      });

      await expect(
        creditnoteUpdateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        creditnoteUpdateTool.execute(
          { creditNoteId: 12345, notes: 'Test' } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should require creditNoteId', async () => {
      await expect(
        creditnoteUpdateTool.execute(
          { accountId: 'ABC123', notes: 'Test' } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject non-numeric creditNoteId', async () => {
      await expect(
        creditnoteUpdateTool.execute(
          { accountId: 'ABC123', creditNoteId: 'invalid', notes: 'Test' } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });
});
