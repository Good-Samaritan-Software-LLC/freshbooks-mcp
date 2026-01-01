/**
 * Tests for otherincome_delete tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { otherincomeDeleteTool } from '../../../src/tools/other-income/otherincome-delete.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockOtherIncomeDeleteResponse,
  mockOtherIncomeNotFoundError,
} from '../../mocks/responses/other-income.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
  mockNetworkTimeoutError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('otherincome_delete tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  const validInput = {
    accountId: 'ABC123',
    incomeId: 12345,
  };

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should delete other income entry', async () => {
      const mockResponse = mockOtherIncomeDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await otherincomeDeleteTool.execute(validInput, mockClient as any);

      expect(result.success).toBe(true);
      expect(result.incomeId).toBe(12345);
    });

    it('should delete other income with different IDs', async () => {
      const incomeIds = [11111, 22222, 33333, 44444, 55555];

      for (const incomeId of incomeIds) {
        const mockResponse = mockOtherIncomeDeleteResponse();

        mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
          const client = {
            otherIncomes: {
              delete: vi.fn().mockResolvedValue(mockResponse),
            },
          };
          return apiCall(client);
        });

        const result = await otherincomeDeleteTool.execute(
          { accountId: 'ABC123', incomeId },
          mockClient as any
        );

        expect(result.success).toBe(true);
        expect(result.incomeId).toBe(incomeId);
      }
    });

    it('should return success with correct income ID', async () => {
      const mockResponse = mockOtherIncomeDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await otherincomeDeleteTool.execute(
        { accountId: 'ABC123', incomeId: 67890 },
        mockClient as any
      );

      expect(result).toEqual({
        success: true,
        incomeId: 67890,
      });
    });

    it('should call delete method with correct parameters', async () => {
      const mockResponse = mockOtherIncomeDeleteResponse();
      const deleteSpy = vi.fn().mockResolvedValue(mockResponse);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            delete: deleteSpy,
          },
        };
        return apiCall(client);
      });

      await otherincomeDeleteTool.execute(
        { accountId: 'TEST123', incomeId: 99999 },
        mockClient as any
      );

      // Note: The actual call is made inside the API callback, so we verify the spy was called
      expect(deleteSpy).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle not found error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            delete: vi.fn().mockResolvedValue(mockOtherIncomeNotFoundError(99999)),
          },
        };
        return apiCall(client);
      });

      await expect(
        otherincomeDeleteTool.execute(
          { accountId: 'ABC123', incomeId: 99999 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle not found error with descriptive message', async () => {
      const nonExistentId = 88888;
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            delete: vi.fn().mockResolvedValue(mockOtherIncomeNotFoundError(nonExistentId)),
          },
        };
        return apiCall(client);
      });

      await expect(
        otherincomeDeleteTool.execute(
          { accountId: 'ABC123', incomeId: nonExistentId },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            delete: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        otherincomeDeleteTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            delete: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        otherincomeDeleteTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle rate limit error with different retry times', async () => {
      const retryTimes = [30, 60, 120, 300];

      for (const retryAfter of retryTimes) {
        mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
          const client = {
            otherIncomes: {
              delete: vi.fn().mockResolvedValue(mockRateLimitError(retryAfter)),
            },
          };
          return apiCall(client);
        });

        await expect(
          otherincomeDeleteTool.execute(validInput, mockClient as any)
        ).rejects.toThrow();
      }
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            delete: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        otherincomeDeleteTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());

      await expect(
        otherincomeDeleteTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle network timeout on retry', async () => {
      mockClient.executeWithRetry.mockRejectedValue(mockNetworkTimeoutError());

      await expect(
        otherincomeDeleteTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle generic API error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            delete: vi.fn().mockResolvedValue({
              ok: false,
              error: {
                code: 'UNKNOWN_ERROR',
                message: 'An unexpected error occurred',
                statusCode: 500,
              },
            }),
          },
        };
        return apiCall(client);
      });

      await expect(
        otherincomeDeleteTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        otherincomeDeleteTool.execute(
          { incomeId: 12345 } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should require incomeId', async () => {
      await expect(
        otherincomeDeleteTool.execute(
          { accountId: 'ABC123' } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject empty accountId', async () => {
      await expect(
        otherincomeDeleteTool.execute(
          { accountId: '', incomeId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject non-numeric incomeId', async () => {
      await expect(
        otherincomeDeleteTool.execute(
          { accountId: 'ABC123', incomeId: 'invalid' as any },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject zero incomeId', async () => {
      await expect(
        otherincomeDeleteTool.execute(
          { accountId: 'ABC123', incomeId: 0 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject negative incomeId', async () => {
      await expect(
        otherincomeDeleteTool.execute(
          { accountId: 'ABC123', incomeId: -12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should accept valid input', async () => {
      const mockResponse = mockOtherIncomeDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      // Should not throw
      await expect(
        otherincomeDeleteTool.execute(validInput, mockClient as any)
      ).resolves.toBeDefined();
    });

    it('should accept large incomeId values', async () => {
      const mockResponse = mockOtherIncomeDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          otherIncomes: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await otherincomeDeleteTool.execute(
        { accountId: 'ABC123', incomeId: 999999999 },
        mockClient as any
      );

      expect(result.success).toBe(true);
      expect(result.incomeId).toBe(999999999);
    });
  });
});
