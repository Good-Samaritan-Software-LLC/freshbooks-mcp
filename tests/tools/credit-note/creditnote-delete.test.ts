/**
 * Tests for creditnote_delete tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { creditnoteDeleteTool } from '../../../src/tools/credit-note/creditnote-delete.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockCreditNoteDeleteResponse,
  mockCreditNoteNotFoundError,
  mockCreditNoteAlreadyAppliedError,
} from '../../mocks/responses/credit-note.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
  mockNetworkTimeoutError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('creditnote_delete tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should delete a credit note by ID', async () => {
      const mockResponse = mockCreditNoteDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await creditnoteDeleteTool.execute(
        { accountId: 'ABC123', creditNoteId: 12345 },
        mockClient as any
      );

      expect(result.success).toBe(true);
      expect(result.creditNoteId).toBe(12345);
    });

    it('should return success with the correct credit note ID', async () => {
      const mockResponse = mockCreditNoteDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await creditnoteDeleteTool.execute(
        { accountId: 'XYZ789', creditNoteId: 67890 },
        mockClient as any
      );

      expect(result.success).toBe(true);
      expect(result.creditNoteId).toBe(67890);
    });

    it('should call API with correct parameters', async () => {
      const mockResponse = mockCreditNoteDeleteResponse();
      const deleteFn = vi.fn().mockResolvedValue(mockResponse);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            delete: deleteFn,
          },
        };
        return apiCall(client);
      });

      await creditnoteDeleteTool.execute(
        { accountId: 'ABC123', creditNoteId: 12345 },
        mockClient as any
      );

      expect(deleteFn).toHaveBeenCalledWith('ABC123', '12345');
    });
  });

  describe('error handling', () => {
    it('should handle not found error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            delete: vi.fn().mockResolvedValue(mockCreditNoteNotFoundError(99999)),
          },
        };
        return apiCall(client);
      });

      await expect(
        creditnoteDeleteTool.execute(
          { accountId: 'ABC123', creditNoteId: 99999 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            delete: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        creditnoteDeleteTool.execute(
          { accountId: 'ABC123', creditNoteId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            delete: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        creditnoteDeleteTool.execute(
          { accountId: 'ABC123', creditNoteId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            delete: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        creditnoteDeleteTool.execute(
          { accountId: 'ABC123', creditNoteId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());

      await expect(
        creditnoteDeleteTool.execute(
          { accountId: 'ABC123', creditNoteId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle already applied credit note error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            delete: vi.fn().mockResolvedValue(mockCreditNoteAlreadyAppliedError(12345)),
          },
        };
        return apiCall(client);
      });

      await expect(
        creditnoteDeleteTool.execute(
          { accountId: 'ABC123', creditNoteId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        creditnoteDeleteTool.execute({ creditNoteId: 12345 } as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require creditNoteId', async () => {
      await expect(
        creditnoteDeleteTool.execute({ accountId: 'ABC123' } as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should reject non-numeric creditNoteId', async () => {
      await expect(
        creditnoteDeleteTool.execute(
          { accountId: 'ABC123', creditNoteId: 'invalid' } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject empty accountId', async () => {
      await expect(
        creditnoteDeleteTool.execute(
          { accountId: '', creditNoteId: 12345 } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject negative creditNoteId', async () => {
      await expect(
        creditnoteDeleteTool.execute(
          { accountId: 'ABC123', creditNoteId: -1 } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });
});
