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

  describe('successful operations', () => {
    it('should update invoice status', async () => {
      const mockResponse = mockInvoiceUpdateResponse(12345, { status: 'sent' });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceUpdateTool.execute(
        { accountId: 'ABC123', invoiceId: 12345, status: 'sent' },
        mockClient as any
      );

      expect(result.id).toBe(12345);
      expect(result.status).toBe('sent');
    });

    it('should update invoice due date', async () => {
      const mockResponse = mockInvoiceUpdateResponse(12345, { dueDate: '2024-12-31' });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
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

    it('should update invoice with discount', async () => {
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
          discount: { amount: '100.00' },
        },
        mockClient as any
      );

      expect(result.id).toBe(12345);
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
