/**
 * Tests for expense_create tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { expenseCreateTool } from '../../../src/tools/expense/expense-create.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockExpenseCreateResponse,
  mockExpenseValidationError,
} from '../../mocks/responses/expense.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('expense_create tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  const validInput = {
    accountId: 'ABC123',
    categoryId: 5678,
    staffId: 1,
    date: '2024-01-15',
    amount: {
      amount: '150.00',
      code: 'USD',
    },
  };

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should create expense with required fields only', async () => {
      const mockResponse = mockExpenseCreateResponse({
        categoryId: 5678,
        staffId: 1,
        amount: { amount: '150.00', code: 'USD' },
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await expenseCreateTool.execute(validInput, mockClient as any);

      expect(result.id).toBe(99999);
      expect(result.categoryId).toBe(5678);
      expect(result.staffId).toBe(1);
    });

    it('should create expense with vendor and notes', async () => {
      const mockResponse = mockExpenseCreateResponse({
        vendor: 'Office Depot',
        notes: 'Office supplies for Q1',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await expenseCreateTool.execute(
        { ...validInput, vendor: 'Office Depot', notes: 'Office supplies for Q1' },
        mockClient as any
      );

      expect(result.vendor).toBe('Office Depot');
      expect(result.notes).toBe('Office supplies for Q1');
    });

    it('should create expense with client for billing', async () => {
      const mockResponse = mockExpenseCreateResponse({
        clientId: 11111,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await expenseCreateTool.execute(
        { ...validInput, clientId: 11111 },
        mockClient as any
      );

      expect(result.clientId).toBe(11111);
    });

    it('should create expense with project association', async () => {
      const mockResponse = mockExpenseCreateResponse({
        projectId: 22222,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await expenseCreateTool.execute(
        { ...validInput, projectId: 22222 },
        mockClient as any
      );

      expect(result.projectId).toBe(22222);
    });

    it('should create expense with markup percentage', async () => {
      const mockResponse = mockExpenseCreateResponse({
        markupPercent: 15,
        clientId: 11111,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await expenseCreateTool.execute(
        { ...validInput, clientId: 11111, markupPercent: 15 },
        mockClient as any
      );

      expect(result.markupPercent).toBe(15);
    });

    it('should create expense with taxes', async () => {
      const mockResponse = mockExpenseCreateResponse({
        taxName1: 'GST',
        taxPercent1: '5',
        taxName2: 'PST',
        taxPercent2: '7',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await expenseCreateTool.execute(
        {
          ...validInput,
          taxName1: 'GST',
          taxPercent1: '5',
          taxName2: 'PST',
          taxPercent2: '7',
        },
        mockClient as any
      );

      expect(result.taxName1).toBe('GST');
      expect(result.taxPercent1).toBe('5');
      expect(result.taxName2).toBe('PST');
      expect(result.taxPercent2).toBe('7');
    });

    it('should create expense with all optional fields', async () => {
      const mockResponse = mockExpenseCreateResponse({
        vendor: 'Travel Agency',
        notes: 'Conference travel',
        clientId: 11111,
        projectId: 22222,
        markupPercent: 10,
        taxName1: 'GST',
        taxPercent1: '5',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await expenseCreateTool.execute(
        {
          ...validInput,
          vendor: 'Travel Agency',
          notes: 'Conference travel',
          clientId: 11111,
          projectId: 22222,
          markupPercent: 10,
          taxName1: 'GST',
          taxPercent1: '5',
        },
        mockClient as any
      );

      expect(result.vendor).toBe('Travel Agency');
      expect(result.notes).toBe('Conference travel');
      expect(result.clientId).toBe(11111);
      expect(result.projectId).toBe(22222);
      expect(result.markupPercent).toBe(10);
    });
  });

  describe('error handling', () => {
    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            create: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        expenseCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            create: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        expenseCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            create: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        expenseCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle validation error for invalid category', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          expenses: {
            create: vi.fn().mockResolvedValue(
              mockExpenseValidationError('categoryId', 'Invalid category ID')
            ),
          },
        };
        return apiCall(client);
      });

      await expect(
        expenseCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      const input = { ...validInput };
      delete (input as any).accountId;

      await expect(
        expenseCreateTool.execute(input as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require categoryId', async () => {
      const input = { ...validInput };
      delete (input as any).categoryId;

      await expect(
        expenseCreateTool.execute(input as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require staffId', async () => {
      const input = { ...validInput };
      delete (input as any).staffId;

      await expect(
        expenseCreateTool.execute(input as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require date', async () => {
      const input = { ...validInput };
      delete (input as any).date;

      await expect(
        expenseCreateTool.execute(input as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require amount', async () => {
      const input = { ...validInput };
      delete (input as any).amount;

      await expect(
        expenseCreateTool.execute(input as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should reject negative categoryId', async () => {
      await expect(
        expenseCreateTool.execute(
          { ...validInput, categoryId: -1 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject markup percent over 100', async () => {
      await expect(
        expenseCreateTool.execute(
          { ...validInput, markupPercent: 101 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject negative markup percent', async () => {
      await expect(
        expenseCreateTool.execute(
          { ...validInput, markupPercent: -5 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });
});
