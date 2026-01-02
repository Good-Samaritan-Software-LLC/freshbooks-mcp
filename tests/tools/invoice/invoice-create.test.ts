/**
 * Tests for invoice_create tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { invoiceCreateTool } from '../../../src/tools/invoice/invoice-create.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockInvoiceCreateResponse,
  mockInvoiceValidationError,
} from '../../mocks/responses/invoice.js';
import {
  mockUnauthorizedError,
  mockServerError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('invoice_create tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  const validInput = {
    accountId: 'ABC123',
    customerId: 56789,
    lines: [
      {
        name: 'Consulting Services',
        qty: 10,
        unitCost: { amount: '150.00', code: 'USD' },
      },
    ],
  };

  describe('successful operations', () => {
    it('should create an invoice with minimal required fields', async () => {
      const mockResponse = mockInvoiceCreateResponse({
        customerId: 56789,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceCreateTool.execute(validInput, mockClient as any);

      expect(result.id).toBe(99999);
      expect(result.status).toBe('draft');
    });

    it('should create an invoice with all optional fields', async () => {
      const fullInput = {
        ...validInput,
        createDate: '2024-06-15',
        dueDate: '2024-07-15',
        currencyCode: 'USD',
        notes: 'Thank you for your business',
        terms: 'Net 30',
        discount: { amount: '50.00', code: 'USD' },
      };

      const mockResponse = mockInvoiceCreateResponse(fullInput);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceCreateTool.execute(fullInput, mockClient as any);

      expect(result.id).toBeDefined();
    });

    it('should create an invoice with multiple line items', async () => {
      const multiLineInput = {
        accountId: 'ABC123',
        customerId: 56789,
        lines: [
          {
            name: 'Consulting',
            qty: 10,
            unitCost: { amount: '150.00' },
          },
          {
            name: 'Development',
            qty: 20,
            unitCost: { amount: '100.00' },
            description: 'Development work',
          },
          {
            name: 'Support',
            qty: 5,
            unitCost: { amount: '75.00' },
          },
        ],
      };

      const mockResponse = mockInvoiceCreateResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceCreateTool.execute(multiLineInput, mockClient as any);

      expect(result.id).toBeDefined();
    });

    it('should create an invoice with tax information', async () => {
      const taxInput = {
        accountId: 'ABC123',
        customerId: 56789,
        lines: [
          {
            name: 'Consulting Services',
            qty: 1,
            unitCost: { amount: '1000.00' },
            taxName1: 'GST',
            taxAmount1: '10',
            taxName2: 'PST',
            taxAmount2: '8',
          },
        ],
      };

      const mockResponse = mockInvoiceCreateResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceCreateTool.execute(taxInput, mockClient as any);

      expect(result.id).toBeDefined();
    });

    it('should pass correct payload to API', async () => {
      const mockResponse = mockInvoiceCreateResponse();
      let capturedPayload: any = null;
      let capturedAccountId: string = '';

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            create: vi.fn((payload, accountId) => {
              capturedPayload = payload;
              capturedAccountId = accountId;
              return Promise.resolve(mockResponse);
            }),
          },
        };
        return apiCall(client);
      });

      await invoiceCreateTool.execute(validInput, mockClient as any);

      expect(capturedAccountId).toBe('ABC123');
      expect(capturedPayload.customerId).toBe(56789);
      expect(capturedPayload.lines).toBeDefined();
      expect(capturedPayload.lines[0].name).toBe('Consulting Services');
    });

    it('should use default currency code when not specified', async () => {
      const mockResponse = mockInvoiceCreateResponse();
      let capturedPayload: any = null;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            create: vi.fn((payload) => {
              capturedPayload = payload;
              return Promise.resolve(mockResponse);
            }),
          },
        };
        return apiCall(client);
      });

      await invoiceCreateTool.execute(validInput, mockClient as any);

      expect(capturedPayload.currencyCode).toBe('USD');
    });

    it('should use today as default create date', async () => {
      const mockResponse = mockInvoiceCreateResponse();
      let capturedPayload: any = null;
      const today = new Date().toISOString().split('T')[0];

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            create: vi.fn((payload) => {
              capturedPayload = payload;
              return Promise.resolve(mockResponse);
            }),
          },
        };
        return apiCall(client);
      });

      await invoiceCreateTool.execute(validInput, mockClient as any);

      expect(capturedPayload.createDate).toBe(today);
    });
  });

  describe('error handling', () => {
    it('should handle validation error for missing customer', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            create: vi.fn().mockResolvedValue(
              mockInvoiceValidationError('customerId', 'Customer is required')
            ),
          },
        };
        return apiCall(client);
      });

      await expect(
        invoiceCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            create: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        invoiceCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            create: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        invoiceCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      const invalidInput = {
        customerId: 56789,
        lines: [{ name: 'Test', qty: 1, unitCost: { amount: '100.00' } }],
      };

      await expect(
        invoiceCreateTool.execute(invalidInput as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require customerId', async () => {
      const invalidInput = {
        accountId: 'ABC123',
        lines: [{ name: 'Test', qty: 1, unitCost: { amount: '100.00' } }],
      };

      await expect(
        invoiceCreateTool.execute(invalidInput as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require at least one line item', async () => {
      const invalidInput = {
        accountId: 'ABC123',
        customerId: 56789,
        lines: [],
      };

      await expect(
        invoiceCreateTool.execute(invalidInput as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require line item name', async () => {
      const invalidInput = {
        accountId: 'ABC123',
        customerId: 56789,
        lines: [{ qty: 1, unitCost: { amount: '100.00' } }],
      };

      await expect(
        invoiceCreateTool.execute(invalidInput as any, mockClient as any)
      ).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle very large invoice amounts', async () => {
      const largeInput = {
        accountId: 'ABC123',
        customerId: 56789,
        lines: [
          {
            name: 'Large Project',
            qty: 1,
            unitCost: { amount: '9999999.99' },
          },
        ],
      };

      const mockResponse = mockInvoiceCreateResponse({
        amount: { amount: '9999999.99', code: 'USD' },
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceCreateTool.execute(largeInput, mockClient as any);

      expect(result.id).toBeDefined();
    });

    it('should handle non-USD currency', async () => {
      const euroInput = {
        accountId: 'ABC123',
        customerId: 56789,
        currencyCode: 'EUR',
        lines: [
          {
            name: 'European Services',
            qty: 1,
            unitCost: { amount: '500.00', code: 'EUR' },
          },
        ],
      };

      const mockResponse = mockInvoiceCreateResponse({
        currencyCode: 'EUR',
        amount: { amount: '500.00', code: 'EUR' },
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceCreateTool.execute(euroInput, mockClient as any);

      expect(result.id).toBeDefined();
    });

    it('should handle fractional quantities', async () => {
      const fractionalInput = {
        accountId: 'ABC123',
        customerId: 56789,
        lines: [
          {
            name: 'Hourly Work',
            qty: 2.5,
            unitCost: { amount: '100.00' },
          },
        ],
      };

      const mockResponse = mockInvoiceCreateResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          invoices: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await invoiceCreateTool.execute(fractionalInput, mockClient as any);

      expect(result.id).toBeDefined();
    });
  });
});
