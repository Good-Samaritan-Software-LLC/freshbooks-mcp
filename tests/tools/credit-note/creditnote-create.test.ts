/**
 * Tests for creditnote_create tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { creditnoteCreateTool } from '../../../src/tools/credit-note/creditnote-create.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockCreditNoteCreateResponse,
  mockCreditNoteValidationError,
} from '../../mocks/responses/credit-note.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
  mockNetworkTimeoutError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('creditnote_create tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  const validInput = {
    accountId: 'ABC123',
    clientId: 67890,
    createDate: '2024-01-15T00:00:00Z',
    lines: [
      {
        name: 'Refund for service',
        amount: { amount: '100.00', code: 'USD' },
      },
    ],
  };

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should create a credit note with required fields', async () => {
      const mockResponse = mockCreditNoteCreateResponse({
        clientId: 67890,
        createDate: '2024-01-15',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await creditnoteCreateTool.execute(validInput, mockClient as any);

      expect(result.id).toBe(99999);
      expect(result.status).toBe('created');
    });

    it('should create a credit note with multiple line items', async () => {
      const mockResponse = mockCreditNoteCreateResponse({
        lines: [
          {
            lineid: 1,
            name: 'Refund item 1',
            amount: { amount: '50.00', code: 'USD' },
          },
          {
            lineid: 2,
            name: 'Refund item 2',
            amount: { amount: '75.00', code: 'USD' },
          },
        ],
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await creditnoteCreateTool.execute(
        {
          ...validInput,
          lines: [
            { name: 'Refund item 1', amount: { amount: '50.00', code: 'USD' } },
            { name: 'Refund item 2', amount: { amount: '75.00', code: 'USD' } },
          ],
        },
        mockClient as any
      );

      expect(result.lines).toHaveLength(2);
    });

    it('should create a credit note with notes', async () => {
      const mockResponse = mockCreditNoteCreateResponse({
        notes: 'Customer refund for order cancellation',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await creditnoteCreateTool.execute(
        { ...validInput, notes: 'Customer refund for order cancellation' },
        mockClient as any
      );

      expect(result.notes).toBe('Customer refund for order cancellation');
    });

    it('should create a credit note with terms', async () => {
      const mockResponse = mockCreditNoteCreateResponse({
        terms: 'Credit valid for 90 days',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await creditnoteCreateTool.execute(
        { ...validInput, terms: 'Credit valid for 90 days' },
        mockClient as any
      );

      expect(result.terms).toBe('Credit valid for 90 days');
    });

    it('should create a credit note with different currency', async () => {
      const mockResponse = mockCreditNoteCreateResponse({
        currencyCode: 'EUR',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await creditnoteCreateTool.execute(
        { ...validInput, currencyCode: 'EUR' },
        mockClient as any
      );

      expect(result.currency_code).toBe('EUR');
    });

    it('should create a credit note with language', async () => {
      const mockResponse = mockCreditNoteCreateResponse({
        language: 'fr',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await creditnoteCreateTool.execute(
        { ...validInput, language: 'fr' },
        mockClient as any
      );

      expect(result.language).toBe('fr');
    });

    it('should create a credit note with line item details', async () => {
      const mockResponse = mockCreditNoteCreateResponse({
        lines: [
          {
            lineid: 1,
            name: 'Product refund',
            description: 'Returned item',
            qty: 2,
            unit_cost: { amount: '25.00', code: 'USD' },
            amount: { amount: '50.00', code: 'USD' },
          },
        ],
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await creditnoteCreateTool.execute(
        {
          ...validInput,
          lines: [
            {
              name: 'Product refund',
              description: 'Returned item',
              quantity: 2,
              unitCost: { amount: '25.00', code: 'USD' },
              amount: { amount: '50.00', code: 'USD' },
            },
          ],
        },
        mockClient as any
      );

      expect(result.lines[0].qty).toBe(2);
    });
  });

  describe('error handling', () => {
    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            create: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        creditnoteCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            create: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        creditnoteCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            create: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        creditnoteCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());

      await expect(
        creditnoteCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle validation error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          creditNotes: {
            create: vi.fn().mockResolvedValue(
              mockCreditNoteValidationError('lines', 'At least one line item is required')
            ),
          },
        };
        return apiCall(client);
      });

      await expect(
        creditnoteCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      const { accountId, ...inputWithoutAccount } = validInput;

      await expect(
        creditnoteCreateTool.execute(inputWithoutAccount as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require clientId', async () => {
      const { clientId, ...inputWithoutClient } = validInput;

      await expect(
        creditnoteCreateTool.execute(inputWithoutClient as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require createDate', async () => {
      const { createDate, ...inputWithoutDate } = validInput;

      await expect(
        creditnoteCreateTool.execute(inputWithoutDate as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require lines array', async () => {
      const { lines, ...inputWithoutLines } = validInput;

      await expect(
        creditnoteCreateTool.execute(inputWithoutLines as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require at least one line item', async () => {
      await expect(
        creditnoteCreateTool.execute(
          { ...validInput, lines: [] },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });
});
