/**
 * Tests for invoice_update tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { invoiceUpdateTool } from '../../../src/tools/invoice/invoice-update.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockInvoiceUpdateResponse,
  mockInvoiceNotFoundError,
  mockInvoiceValidationError,
} from '../../mocks/responses/invoice.js';
import {
  mockUnauthorizedError,
  mockServerError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('invoice_update tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('due date handling', () => {
    // Live-verified: `due_date` is read-only on the wire (403 errno 1038) and
    // the SDK transform drops `dueDate`; the writable field is dueOffsetDays
    // (relative to create_date — fetched when the caller omits createDate).
    function captureUpdate(currentCreateDate?: Date) {
      const captured: { payload?: any; singleCalls: number } = { singleCalls: 0 };
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            single: vi.fn(() => {
              captured.singleCalls += 1;
              return Promise.resolve({
                ok: true,
                data: { invoice: { id: 12345, createDate: currentCreateDate } },
              });
            }),
            update: vi.fn((_accountId: string, _invoiceId: string, payload: any) => {
              captured.payload = payload;
              return Promise.resolve(mockInvoiceUpdateResponse(12345, {}));
            }),
          },
        };
        return apiCall(client);
      });
      return captured;
    }

    it('should derive dueOffsetDays from dueDate using a provided createDate (no fetch)', async () => {
      const captured = captureUpdate();

      await invoiceUpdateTool.execute(
        { accountId: 'ABC123', invoiceId: 12345, createDate: '2024-06-15', dueDate: '2024-07-15' },
        mockClient as any
      );

      expect(captured.payload.dueOffsetDays).toBe(30);
      expect(captured.payload).not.toHaveProperty('dueDate');
      expect(captured.singleCalls).toBe(0);
    });

    it('should fetch the invoice to derive dueOffsetDays when createDate is omitted', async () => {
      const captured = captureUpdate(new Date(2024, 5, 15)); // 2024-06-15 local

      await invoiceUpdateTool.execute(
        { accountId: 'ABC123', invoiceId: 12345, dueDate: '2024-07-15' },
        mockClient as any
      );

      expect(captured.singleCalls).toBe(1);
      expect(captured.payload.dueOffsetDays).toBe(30);
      expect(captured.payload).not.toHaveProperty('dueDate');
    });

    it('should pass an explicit dueOffsetDays through, winning over dueDate', async () => {
      const captured = captureUpdate();

      await invoiceUpdateTool.execute(
        { accountId: 'ABC123', invoiceId: 12345, dueDate: '2024-07-15', dueOffsetDays: 45 },
        mockClient as any
      );

      expect(captured.payload.dueOffsetDays).toBe(45);
      expect(captured.payload).not.toHaveProperty('dueDate');
      expect(captured.singleCalls).toBe(0);
    });
  });

  describe('successful operations', () => {
    it('should update invoice status, sending the NUMERIC wire code', async () => {
      // Live-verified: the API rejects string statuses (422 "must be a number");
      // the tool must translate 'sent' -> 2. The API echoes the numeric code back.
      const mockResponse = mockInvoiceUpdateResponse(12345, { status: 2 });
      let capturedUpdates: any = null;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            update: vi.fn((_accountId, _invoiceId, updates) => {
              capturedUpdates = updates;
              return Promise.resolve(mockResponse);
            }),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceUpdateTool.execute(
        { accountId: 'ABC123', invoiceId: 12345, status: 'sent' },
        mockClient as any
      );

      expect(capturedUpdates.status).toBe(2);
      expect(result.id).toBe(12345);
      expect(result.status).toBe(2);
    });

    it.each([
      ['disputed', 0],
      ['draft', 1],
      ['sent', 2],
      ['viewed', 3],
    ] as const)('should map status %s to wire code %i', async (name, code) => {
      const mockResponse = mockInvoiceUpdateResponse(12345, { status: code });
      let capturedUpdates: any = null;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            update: vi.fn((_accountId, _invoiceId, updates) => {
              capturedUpdates = updates;
              return Promise.resolve(mockResponse);
            }),
          },
        };
        return apiCall(client);
      });

      await invoiceUpdateTool.execute(
        { accountId: 'ABC123', invoiceId: 12345, status: name },
        mockClient as any
      );

      expect(capturedUpdates.status).toBe(code);
    });

    it('should update invoice due date', async () => {
      const mockResponse = mockInvoiceUpdateResponse(12345, { dueDate: '2024-12-31' });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            // dueDate without createDate fetches the invoice to derive the offset
            single: vi.fn().mockResolvedValue({
              ok: true,
              data: { invoice: { id: 12345, createDate: new Date(2024, 11, 1) } },
            }),
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceUpdateTool.execute(
        { accountId: 'ABC123', invoiceId: 12345, dueDate: '2024-12-31' },
        mockClient as any
      );

      expect(result.id).toBe(12345);
    });

    it('should update invoice notes', async () => {
      const mockResponse = mockInvoiceUpdateResponse(12345, { notes: 'Updated notes' });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceUpdateTool.execute(
        { accountId: 'ABC123', invoiceId: 12345, notes: 'Updated notes' },
        mockClient as any
      );

      expect(result.id).toBe(12345);
    });

    it('should update invoice with new line items', async () => {
      const mockResponse = mockInvoiceUpdateResponse(12345);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceUpdateTool.execute(
        {
          accountId: 'ABC123',
          invoiceId: 12345,
          lines: [
            {
              name: 'New Service',
              qty: 5,
              unitCost: { amount: '200.00' },
            },
          ],
        },
        mockClient as any
      );

      expect(result.id).toBe(12345);
    });

    it('should update invoice with discountPercentage mapped to discountValue', async () => {
      const mockResponse = mockInvoiceUpdateResponse(12345);
      const updateSpy = vi.fn().mockResolvedValue(mockResponse);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            update: updateSpy,
          },
        };
        return apiCall(client);
      });

      const result = await invoiceUpdateTool.execute(
        {
          accountId: 'ABC123',
          invoiceId: 12345,
          // PERCENT, not dollars — discount_value is a percentage on the wire
          // (live-verified 2026-06-04: '10' on $1000 deducts $100)
          discountPercentage: 10,
        },
        mockClient as any
      );

      expect(result.id).toBe(12345);
      const payload = updateSpy.mock.calls[0][2];
      expect(payload.discountValue).toBe('10');
    });

    it('should update multiple fields at once', async () => {
      const mockResponse = mockInvoiceUpdateResponse(12345, {
        notes: 'Updated',
        terms: 'Net 15',
        status: 'sent',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceUpdateTool.execute(
        {
          accountId: 'ABC123',
          invoiceId: 12345,
          notes: 'Updated',
          terms: 'Net 15',
          status: 'sent',
        },
        mockClient as any
      );

      expect(result.id).toBe(12345);
    });

    it('should pass correct parameters to API', async () => {
      const mockResponse = mockInvoiceUpdateResponse(12345);
      let capturedAccountId: string = '';
      let capturedInvoiceId: string = '';
      let capturedUpdates: any = null;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            update: vi.fn((accountId, invoiceId, updates) => {
              capturedAccountId = accountId;
              capturedInvoiceId = invoiceId;
              capturedUpdates = updates;
              return Promise.resolve(mockResponse);
            }),
          },
        };
        return apiCall(client);
      });

      await invoiceUpdateTool.execute(
        { accountId: 'ABC123', invoiceId: 12345, notes: 'Test' },
        mockClient as any
      );

      expect(capturedAccountId).toBe('ABC123');
      expect(capturedInvoiceId).toBe('12345');
      expect(capturedUpdates.notes).toBe('Test');
    });
  });

  describe('error handling', () => {
    it('should handle invoice not found', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            update: vi.fn().mockResolvedValue(mockInvoiceNotFoundError(99999)),
          },
        };
        return apiCall(client);
      });

      await expect(
        invoiceUpdateTool.execute(
          { accountId: 'ABC123', invoiceId: 99999, notes: 'Test' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle validation error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            update: vi.fn().mockResolvedValue(
              mockInvoiceValidationError('status', 'Invalid status')
            ),
          },
        };
        return apiCall(client);
      });

      await expect(
        invoiceUpdateTool.execute(
          { accountId: 'ABC123', invoiceId: 12345, status: 'invalid' as any },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            update: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        invoiceUpdateTool.execute(
          { accountId: 'ABC123', invoiceId: 12345, notes: 'Test' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            update: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        invoiceUpdateTool.execute(
          { accountId: 'ABC123', invoiceId: 12345, notes: 'Test' },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        invoiceUpdateTool.execute(
          { invoiceId: 12345, notes: 'Test' } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should require invoiceId', async () => {
      await expect(
        invoiceUpdateTool.execute(
          { accountId: 'ABC123', notes: 'Test' } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject a numeric status (the friendly names are the input contract)', async () => {
      await expect(
        invoiceUpdateTool.execute(
          { accountId: 'ABC123', invoiceId: 12345, status: 2 as any },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject payment-driven statuses the API cannot set', async () => {
      // Live-verified: PUT status 4-8 (paid/auto-paid/retry/failed/partial)
      // 422s with "Status must be one of 'draft', 'sent', 'viewed' or 'disputed'."
      await expect(
        invoiceUpdateTool.execute(
          { accountId: 'ABC123', invoiceId: 12345, status: 'paid' as any },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle update with empty strings', async () => {
      const mockResponse = mockInvoiceUpdateResponse(12345, { notes: '' });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceUpdateTool.execute(
        { accountId: 'ABC123', invoiceId: 12345, notes: '' },
        mockClient as any
      );

      expect(result.id).toBe(12345);
    });

    it('should handle changing customer', async () => {
      const mockResponse = mockInvoiceUpdateResponse(12345, { customerId: 99999 });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceUpdateTool.execute(
        { accountId: 'ABC123', invoiceId: 12345, customerId: 99999 },
        mockClient as any
      );

      expect(result.id).toBe(12345);
    });

    it('should handle changing currency', async () => {
      const mockResponse = mockInvoiceUpdateResponse(12345, { currencyCode: 'EUR' });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceUpdateTool.execute(
        { accountId: 'ABC123', invoiceId: 12345, currencyCode: 'EUR' },
        mockClient as any
      );

      expect(result.id).toBe(12345);
    });
  });
});
