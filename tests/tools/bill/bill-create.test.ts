/**
 * Tests for bill_create tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { billCreateTool } from '../../../src/tools/bill/bill-create.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockBillCreateResponse,
  mockBillValidationError,
} from '../../mocks/responses/bill.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
  mockNetworkTimeoutError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('bill_create tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  const validInput = {
    accountId: 'ABC123',
    vendorId: 5001,
    issueDate: '2024-01-15T00:00:00Z',
    amount: { amount: '1500.00', code: 'USD' },
  };

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should create a bill with required fields', async () => {
      const mockResponse = mockBillCreateResponse({
        vendorId: 5001,
        amount: { amount: '1500.00', code: 'USD' },
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billCreateTool.execute(validInput, mockClient as any);

      expect(result.id).toBe(99999);
      expect(result.vendorId).toBe(5001);
    });

    it('should create a bill with bill number', async () => {
      const mockResponse = mockBillCreateResponse({
        billNumber: 'INV-2024-001',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billCreateTool.execute(
        { ...validInput, billNumber: 'INV-2024-001' },
        mockClient as any
      );

      expect(result.billNumber).toBe('INV-2024-001');
    });

    it('should create a bill with due date', async () => {
      const mockResponse = mockBillCreateResponse({
        dueDate: '2024-02-15T00:00:00Z',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billCreateTool.execute(
        { ...validInput, dueDate: '2024-02-15T00:00:00Z' },
        mockClient as any
      );

      expect(result.dueDate).toBe('2024-02-15T00:00:00Z');
    });

    it('should create a bill with notes', async () => {
      const mockResponse = mockBillCreateResponse({
        notes: 'Monthly supplies order',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billCreateTool.execute(
        { ...validInput, notes: 'Monthly supplies order' },
        mockClient as any
      );

      expect(result.notes).toBe('Monthly supplies order');
    });

    it('should create a bill with line items', async () => {
      const lines = [
        { description: 'Office supplies', amount: { amount: '500.00', code: 'USD' } },
        { description: 'Equipment', amount: { amount: '1000.00', code: 'USD' } },
      ];

      const mockResponse = mockBillCreateResponse({ lines });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billCreateTool.execute(
        { ...validInput, lines },
        mockClient as any
      );

      expect(result.lines).toHaveLength(2);
    });

    it('should create a bill with all optional fields', async () => {
      const fullInput = {
        ...validInput,
        billNumber: 'INV-2024-001',
        dueDate: '2024-02-15T00:00:00Z',
        notes: 'Complete order with all details',
        lines: [{ description: 'Item', amount: { amount: '1500.00', code: 'USD' } }],
      };

      const mockResponse = mockBillCreateResponse(fullInput);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billCreateTool.execute(fullInput, mockClient as any);

      expect(result.id).toBe(99999);
      expect(result.billNumber).toBe('INV-2024-001');
    });

    it('should return bill with unpaid status', async () => {
      const mockResponse = mockBillCreateResponse({
        status: 'unpaid',
        outstandingAmount: { amount: '1500.00', code: 'USD' },
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billCreateTool.execute(validInput, mockClient as any);

      expect(result.status).toBe('unpaid');
    });

    it('should create bill with different currency', async () => {
      const mockResponse = mockBillCreateResponse({
        amount: { amount: '1000.00', code: 'CAD' },
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billCreateTool.execute(
        { ...validInput, amount: { amount: '1000.00', code: 'CAD' } },
        mockClient as any
      );

      expect(result.amount.code).toBe('CAD');
    });
  });

  describe('error handling', () => {
    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            create: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        billCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            create: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        billCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            create: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        billCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());

      await expect(
        billCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle validation error for invalid vendor', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            create: vi.fn().mockResolvedValue(
              mockBillValidationError('vendorId', 'Vendor not found')
            ),
          },
        };
        return apiCall(client);
      });

      await expect(
        billCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle validation error for invalid amount', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            create: vi.fn().mockResolvedValue(
              mockBillValidationError('amount', 'Invalid amount format')
            ),
          },
        };
        return apiCall(client);
      });

      await expect(
        billCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      const { accountId, ...inputWithoutAccount } = validInput;

      await expect(
        billCreateTool.execute(inputWithoutAccount as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require vendorId', async () => {
      const { vendorId, ...inputWithoutVendor } = validInput;

      await expect(
        billCreateTool.execute(inputWithoutVendor as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require issueDate', async () => {
      const { issueDate, ...inputWithoutDate } = validInput;

      await expect(
        billCreateTool.execute(inputWithoutDate as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require amount', async () => {
      const { amount, ...inputWithoutAmount } = validInput;

      await expect(
        billCreateTool.execute(inputWithoutAmount as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should reject invalid date format', async () => {
      await expect(
        billCreateTool.execute(
          { ...validInput, issueDate: 'invalid-date' },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });
});
