/**
 * Tests for invoice_delete tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { invoiceDeleteTool } from '../../../src/tools/invoice/invoice-delete.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockInvoiceDeleteResponse,
  mockInvoiceNotFoundError,
} from '../../mocks/responses/invoice.js';
import {
  mockUnauthorizedError,
  mockServerError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('invoice_delete tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should delete an invoice successfully', async () => {
      const mockResponse = mockInvoiceDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceDeleteTool.execute(
        { accountId: 'ABC123', invoiceId: 12345 },
        mockClient as any
      );

      expect(result.success).toBe(true);
      expect(result.invoiceId).toBe(12345);
    });

    it('should pass correct parameters to API', async () => {
      const mockResponse = mockInvoiceDeleteResponse();
      let capturedAccountId: string = '';
      let capturedInvoiceId: string = '';

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            delete: vi.fn((accountId, invoiceId) => {
              capturedAccountId = accountId;
              capturedInvoiceId = invoiceId;
              return Promise.resolve(mockResponse);
            }),
          },
        };
        return apiCall(client);
      });

      await invoiceDeleteTool.execute(
        { accountId: 'ABC123', invoiceId: 12345 },
        mockClient as any
      );

      expect(capturedAccountId).toBe('ABC123');
      expect(capturedInvoiceId).toBe('12345');
    });

    it('should handle deletion of different invoice IDs', async () => {
      const mockResponse = mockInvoiceDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const invoiceIds = [1, 12345, 99999, 1000000];

      for (const invoiceId of invoiceIds) {
        const result = await invoiceDeleteTool.execute(
          { accountId: 'ABC123', invoiceId },
          mockClient as any
        );

        expect(result.success).toBe(true);
        expect(result.invoiceId).toBe(invoiceId);
      }
    });
  });

  describe('error handling', () => {
    it('should handle invoice not found', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            delete: vi.fn().mockResolvedValue(mockInvoiceNotFoundError(99999)),
          },
        };
        return apiCall(client);
      });

      await expect(
        invoiceDeleteTool.execute(
          { accountId: 'ABC123', invoiceId: 99999 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            delete: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        invoiceDeleteTool.execute(
          { accountId: 'ABC123', invoiceId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            delete: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        invoiceDeleteTool.execute(
          { accountId: 'ABC123', invoiceId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle cannot delete paid invoice error', async () => {
      const paidError = {
        ok: false,
        error: {
          code: 'CANNOT_DELETE',
          message: 'Cannot delete invoice with payments. Void it instead.',
          statusCode: 400,
        },
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            delete: vi.fn().mockResolvedValue(paidError),
          },
        };
        return apiCall(client);
      });

      await expect(
        invoiceDeleteTool.execute(
          { accountId: 'ABC123', invoiceId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        invoiceDeleteTool.execute(
          { invoiceId: 12345 } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should require invoiceId', async () => {
      await expect(
        invoiceDeleteTool.execute(
          { accountId: 'ABC123' } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle already deleted invoice', async () => {
      const alreadyDeletedError = {
        ok: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Invoice has already been deleted',
          statusCode: 404,
        },
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            delete: vi.fn().mockResolvedValue(alreadyDeletedError),
          },
        };
        return apiCall(client);
      });

      await expect(
        invoiceDeleteTool.execute(
          { accountId: 'ABC123', invoiceId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle concurrent delete attempts', async () => {
      const mockResponse = mockInvoiceDeleteResponse();
      let callCount = 0;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            delete: vi.fn(() => {
              callCount++;
              return Promise.resolve(mockResponse);
            }),
          },
        };
        return apiCall(client);
      });

      const promises = [
        invoiceDeleteTool.execute({ accountId: 'ABC123', invoiceId: 12345 }, mockClient as any),
        invoiceDeleteTool.execute({ accountId: 'ABC123', invoiceId: 12346 }, mockClient as any),
        invoiceDeleteTool.execute({ accountId: 'ABC123', invoiceId: 12347 }, mockClient as any),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });
  });
});
