/**
 * Tests for invoice_share_link tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { invoiceShareLinkTool } from '../../../src/tools/invoice/invoice-share-link.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockInvoiceWithShareLink,
  mockInvoiceNoShareLink,
  mockInvoiceNotFoundError,
  createMockInvoice,
} from '../../mocks/responses/invoice.js';
import {
  mockUnauthorizedError,
  mockServerError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('invoice_share_link tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should return share link from v3_status', async () => {
      const mockResponse = mockInvoiceWithShareLink(12345);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceShareLinkTool.execute(
        { accountId: 'ABC123', invoiceId: 12345 },
        mockClient as any
      );

      expect(result.shareLink).toBe('https://my.freshbooks.com/view/12345');
      expect(result.invoiceId).toBe(12345);
    });

    it('should return share link from links.client_view', async () => {
      const mockResponse = {
        ok: true,
        data: {
          invoice: createMockInvoice({
            id: 12345,
            links: {
              client_view: 'https://my.freshbooks.com/client-view/12345',
            },
          }),
        },
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceShareLinkTool.execute(
        { accountId: 'ABC123', invoiceId: 12345 },
        mockClient as any
      );

      expect(result.shareLink).toBe('https://my.freshbooks.com/client-view/12345');
    });

    it('should return share link from shareLink property', async () => {
      const mockResponse = {
        ok: true,
        data: {
          invoice: createMockInvoice({
            id: 12345,
            shareLink: 'https://my.freshbooks.com/share/12345',
          }),
        },
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceShareLinkTool.execute(
        { accountId: 'ABC123', invoiceId: 12345 },
        mockClient as any
      );

      expect(result.shareLink).toBe('https://my.freshbooks.com/share/12345');
    });

    it('should return share link from share_link property', async () => {
      const mockResponse = {
        ok: true,
        data: {
          invoice: createMockInvoice({
            id: 12345,
            share_link: 'https://my.freshbooks.com/share-alt/12345',
          }),
        },
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceShareLinkTool.execute(
        { accountId: 'ABC123', invoiceId: 12345 },
        mockClient as any
      );

      expect(result.shareLink).toBe('https://my.freshbooks.com/share-alt/12345');
    });

    it('should construct fallback link when no share link exists', async () => {
      const mockResponse = mockInvoiceNoShareLink(12345);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceShareLinkTool.execute(
        { accountId: 'ABC123', invoiceId: 12345 },
        mockClient as any
      );

      expect(result.shareLink).toContain('12345');
      expect(result.invoiceId).toBe(12345);
    });

    it('should pass correct parameters to API', async () => {
      const mockResponse = mockInvoiceWithShareLink(12345);
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

      await invoiceShareLinkTool.execute(
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
        invoiceShareLinkTool.execute(
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
        invoiceShareLinkTool.execute(
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
        invoiceShareLinkTool.execute(
          { accountId: 'ABC123', invoiceId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        invoiceShareLinkTool.execute(
          { invoiceId: 12345 } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should require invoiceId', async () => {
      await expect(
        invoiceShareLinkTool.execute(
          { accountId: 'ABC123' } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle invoice with empty share link', async () => {
      const mockResponse = {
        ok: true,
        data: {
          invoice: createMockInvoice({
            id: 12345,
            invoiceNumber: 'INV-0001',
            v3_status: {
              share_link: '',
            },
          }),
        },
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceShareLinkTool.execute(
        { accountId: 'ABC123', invoiceId: 12345 },
        mockClient as any
      );

      // Empty string is falsy, so it should fall through to fallback
      expect(result.shareLink).toContain('12345');
    });

    it('should handle draft invoice share link', async () => {
      const mockResponse = {
        ok: true,
        data: {
          invoice: createMockInvoice({
            id: 12345,
            status: 'draft',
            v3_status: {
              share_link: 'https://my.freshbooks.com/draft/12345',
            },
          }),
        },
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceShareLinkTool.execute(
        { accountId: 'ABC123', invoiceId: 12345 },
        mockClient as any
      );

      expect(result.shareLink).toBe('https://my.freshbooks.com/draft/12345');
    });

    it('should prioritize v3_status.share_link over other sources', async () => {
      const mockResponse = {
        ok: true,
        data: {
          invoice: createMockInvoice({
            id: 12345,
            v3_status: {
              share_link: 'https://primary.link',
            },
            links: {
              client_view: 'https://secondary.link',
            },
            shareLink: 'https://tertiary.link',
            share_link: 'https://quaternary.link',
          }),
        },
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceShareLinkTool.execute(
        { accountId: 'ABC123', invoiceId: 12345 },
        mockClient as any
      );

      expect(result.shareLink).toBe('https://primary.link');
    });
  });
});
