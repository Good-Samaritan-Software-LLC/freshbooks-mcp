/**
 * Tests for bill_archive tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { billArchiveTool } from '../../../src/tools/bill/bill-archive.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockBillArchiveResponse,
  mockBillNotFoundError,
} from '../../mocks/responses/bill.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
  mockNetworkTimeoutError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('bill_archive tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should archive a bill by ID', async () => {
      const mockResponse = mockBillArchiveResponse(12345);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            archive: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billArchiveTool.execute(
        { accountId: 'ABC123', billId: 12345 },
        mockClient as any
      );

      expect(result.success).toBe(true);
      expect(result.billId).toBe(12345);
    });

    it('should return success with the correct bill ID', async () => {
      const mockResponse = mockBillArchiveResponse(67890);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            archive: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billArchiveTool.execute(
        { accountId: 'XYZ789', billId: 67890 },
        mockClient as any
      );

      expect(result.success).toBe(true);
      expect(result.billId).toBe(67890);
    });

    it('should call API with correct parameters', async () => {
      const mockResponse = mockBillArchiveResponse(12345);
      const archiveFn = vi.fn().mockResolvedValue(mockResponse);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            archive: archiveFn,
          },
        };
        return apiCall(client);
      });

      await billArchiveTool.execute(
        { accountId: 'ABC123', billId: 12345 },
        mockClient as any
      );

      expect(archiveFn).toHaveBeenCalledWith('ABC123', 12345);
    });

    it('should handle archiving a paid bill', async () => {
      const mockResponse = mockBillArchiveResponse(12345);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            archive: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billArchiveTool.execute(
        { accountId: 'ABC123', billId: 12345 },
        mockClient as any
      );

      expect(result.success).toBe(true);
    });

    it('should handle archiving an unpaid bill', async () => {
      const mockResponse = mockBillArchiveResponse(54321);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            archive: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billArchiveTool.execute(
        { accountId: 'ABC123', billId: 54321 },
        mockClient as any
      );

      expect(result.success).toBe(true);
      expect(result.billId).toBe(54321);
    });
  });

  describe('error handling', () => {
    it('should handle not found error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            archive: vi.fn().mockResolvedValue(mockBillNotFoundError(99999)),
          },
        };
        return apiCall(client);
      });

      await expect(
        billArchiveTool.execute(
          { accountId: 'ABC123', billId: 99999 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            archive: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        billArchiveTool.execute(
          { accountId: 'ABC123', billId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            archive: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        billArchiveTool.execute(
          { accountId: 'ABC123', billId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            archive: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        billArchiveTool.execute(
          { accountId: 'ABC123', billId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());

      await expect(
        billArchiveTool.execute(
          { accountId: 'ABC123', billId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle already archived bill', async () => {
      // Archiving an already archived bill should still succeed
      const mockResponse = mockBillArchiveResponse(12345);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          bills: {
            archive: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billArchiveTool.execute(
        { accountId: 'ABC123', billId: 12345 },
        mockClient as any
      );

      expect(result.success).toBe(true);
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        billArchiveTool.execute({ billId: 12345 } as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require billId', async () => {
      await expect(
        billArchiveTool.execute({ accountId: 'ABC123' } as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should reject non-numeric billId', async () => {
      await expect(
        billArchiveTool.execute(
          { accountId: 'ABC123', billId: 'invalid' } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject empty accountId', async () => {
      await expect(
        billArchiveTool.execute(
          { accountId: '', billId: 12345 } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject negative billId', async () => {
      await expect(
        billArchiveTool.execute(
          { accountId: 'ABC123', billId: -1 } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });
});
