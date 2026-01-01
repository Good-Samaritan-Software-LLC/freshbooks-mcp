/**
 * Tests for invoice_single tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { invoiceSingleTool } from '../../../src/tools/invoice/invoice-single.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockInvoiceSingleResponse,
  mockInvoiceNotFoundError,
  createMockInvoice,
} from '../../mocks/responses/invoice.js';
import {
  mockUnauthorizedError,
  mockServerError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('invoice_single tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should return a single invoice by ID', async () => {
      const mockResponse = mockInvoiceSingleResponse({ id: 12345 });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceSingleTool.execute(
        { accountId: 'ABC123', invoiceId: 12345 },
        mockClient as any
      );

      expect(result.id).toBe(12345);
    });

    it('should return invoice with all fields populated', async () => {
      const mockResponse = mockInvoiceSingleResponse({
        id: 12345,
        invoiceNumber: 'INV-0001',
        customerId: 56789,
        status: 'sent',
        paymentStatus: 'partial',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceSingleTool.execute(
        { accountId: 'ABC123', invoiceId: 12345 },
        mockClient as any
      );

      expect(result.invoiceNumber).toBe('INV-0001');
      expect(result.customerId).toBe(56789);
      expect(result.status).toBe('sent');
      expect(result.paymentStatus).toBe('partial');
    });

    it('should handle invoice with line items', async () => {
      const mockResponse = mockInvoiceSingleResponse({
        lines: [
          {
            name: 'Consulting',
            qty: 10,
            amount: { amount: '150.00', code: 'USD' },
          },
          {
            name: 'Development',
            qty: 20,
            amount: { amount: '100.00', code: 'USD' },
          },
        ],
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceSingleTool.execute(
        { accountId: 'ABC123', invoiceId: 12345 },
        mockClient as any
      );

      expect(result.lines).toHaveLength(2);
    });

    it('should handle different invoice statuses', async () => {
      const statuses = ['draft', 'sent', 'viewed', 'partial', 'paid', 'overdue'];

      for (const status of statuses) {
        const mockResponse = mockInvoiceSingleResponse({ status });

        mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
          const client = {
            invoices: {
              single: vi.fn().mockResolvedValue(mockResponse),
            },
          };
          return apiCall(client);
        });

        const result = await invoiceSingleTool.execute(
          { accountId: 'ABC123', invoiceId: 12345 },
          mockClient as any
        );

        expect(result.status).toBe(status);
      }
    });

    it('should pass accountId and invoiceId correctly to API', async () => {
      const mockResponse = mockInvoiceSingleResponse();
      let capturedAccountId: string = '';
      let capturedInvoiceId: string = '';

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            single: vi.fn((accountId, invoiceId) => {
              capturedAccountId = accountId;
              capturedInvoiceId = invoiceId;
              return Promise.resolve(mockResponse);
            }),
          },
        };
        return apiCall(client);
      });

      await invoiceSingleTool.execute(
        { accountId: 'ABC123', invoiceId: 12345 },
        mockClient as any
      );

      expect(capturedAccountId).toBe('ABC123');
      expect(capturedInvoiceId).toBe('12345');
    });
  });

  describe('error handling', () => {
    it('should handle invoice not found', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            single: vi.fn().mockResolvedValue(mockInvoiceNotFoundError(99999)),
          },
        };
        return apiCall(client);
      });

      await expect(
        invoiceSingleTool.execute(
          { accountId: 'ABC123', invoiceId: 99999 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            single: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        invoiceSingleTool.execute(
          { accountId: 'ABC123', invoiceId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            single: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        invoiceSingleTool.execute(
          { accountId: 'ABC123', invoiceId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        invoiceSingleTool.execute(
          { invoiceId: 12345 } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should require invoiceId', async () => {
      await expect(
        invoiceSingleTool.execute(
          { accountId: 'ABC123' } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle invoice with null optional fields', async () => {
      const mockResponse = mockInvoiceSingleResponse({
        dueDate: null,
        notes: null,
        terms: null,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceSingleTool.execute(
        { accountId: 'ABC123', invoiceId: 12345 },
        mockClient as any
      );

      expect(result.dueDate).toBeNull();
      expect(result.notes).toBeNull();
      expect(result.terms).toBeNull();
    });

    it('should handle invoice with zero amounts', async () => {
      const mockResponse = mockInvoiceSingleResponse({
        amount: { amount: '0.00', code: 'USD' },
        outstanding: { amount: '0.00', code: 'USD' },
        paid: { amount: '0.00', code: 'USD' },
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceSingleTool.execute(
        { accountId: 'ABC123', invoiceId: 12345 },
        mockClient as any
      );

      expect(result.amount.amount).toBe('0.00');
    });

    it('should handle invoice with non-USD currency', async () => {
      const mockResponse = mockInvoiceSingleResponse({
        currencyCode: 'EUR',
        amount: { amount: '1000.00', code: 'EUR' },
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceSingleTool.execute(
        { accountId: 'ABC123', invoiceId: 12345 },
        mockClient as any
      );

      expect(result.currencyCode).toBe('EUR');
    });
  });
});
