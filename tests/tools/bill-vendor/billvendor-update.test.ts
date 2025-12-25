/**
 * Tests for billvendor_update tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { billvendorUpdateTool } from '../../../src/tools/bill-vendor/billvendor-update.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockVendorUpdateResponse,
  mockVendorNotFoundError,
  mockVendorValidationError,
} from '../../mocks/responses/bill-vendor.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
  mockNetworkTimeoutError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('billvendor_update tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  const validInput = {
    accountId: 'ABC123',
    vendorId: 12345,
    vendorName: 'Updated Vendor Name',
  };

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should update vendor name', async () => {
      const mockResponse = mockVendorUpdateResponse(12345, {
        vendorName: 'Updated Vendor Name',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billvendorUpdateTool.execute(validInput, mockClient as any);

      expect(result.id).toBe(12345);
      expect(result.vendorName).toBe('Updated Vendor Name');
    });

    it('should update vendor email', async () => {
      const mockResponse = mockVendorUpdateResponse(12345, {
        email: 'newemail@vendor.com',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billvendorUpdateTool.execute(
        { accountId: 'ABC123', vendorId: 12345, email: 'newemail@vendor.com' },
        mockClient as any
      );

      expect(result.email).toBe('newemail@vendor.com');
    });

    it('should update vendor contact info', async () => {
      const mockResponse = mockVendorUpdateResponse(12345, {
        contactName: 'Jane Doe',
        phone: '555-999-8888',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billvendorUpdateTool.execute(
        {
          accountId: 'ABC123',
          vendorId: 12345,
          contactName: 'Jane Doe',
          phone: '555-999-8888',
        },
        mockClient as any
      );

      expect(result.contactName).toBe('Jane Doe');
      expect(result.phone).toBe('555-999-8888');
    });

    it('should update vendor address', async () => {
      const mockResponse = mockVendorUpdateResponse(12345, {
        address: '789 New Street',
        city: 'Chicago',
        province: 'IL',
        postalCode: '60601',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billvendorUpdateTool.execute(
        {
          accountId: 'ABC123',
          vendorId: 12345,
          address: '789 New Street',
          city: 'Chicago',
          province: 'IL',
          postalCode: '60601',
        },
        mockClient as any
      );

      expect(result.address).toBe('789 New Street');
      expect(result.city).toBe('Chicago');
    });

    it('should update vendor tax info', async () => {
      const mockResponse = mockVendorUpdateResponse(12345, {
        taxNumber: '99-1234567',
        is1099: true,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billvendorUpdateTool.execute(
        { accountId: 'ABC123', vendorId: 12345, taxNumber: '99-1234567', is1099: true },
        mockClient as any
      );

      expect(result.taxNumber).toBe('99-1234567');
      expect(result.is1099).toBe(true);
    });

    it('should update vendor note', async () => {
      const mockResponse = mockVendorUpdateResponse(12345, {
        note: 'Updated vendor notes',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billvendorUpdateTool.execute(
        { accountId: 'ABC123', vendorId: 12345, note: 'Updated vendor notes' },
        mockClient as any
      );

      expect(result.note).toBe('Updated vendor notes');
    });

    it('should call API with correct parameters', async () => {
      const mockResponse = mockVendorUpdateResponse(12345, {});
      const updateFn = vi.fn().mockResolvedValue(mockResponse);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            update: updateFn,
          },
        };
        return apiCall(client);
      });

      await billvendorUpdateTool.execute(validInput, mockClient as any);

      expect(updateFn).toHaveBeenCalledWith({ vendorName: 'Updated Vendor Name' }, 'ABC123', 12345);
    });
  });

  describe('error handling', () => {
    it('should handle not found error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            update: vi.fn().mockResolvedValue(mockVendorNotFoundError(99999)),
          },
        };
        return apiCall(client);
      });

      await expect(
        billvendorUpdateTool.execute(
          { accountId: 'ABC123', vendorId: 99999, vendorName: 'Test' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            update: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        billvendorUpdateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            update: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        billvendorUpdateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            update: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        billvendorUpdateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());

      await expect(
        billvendorUpdateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle validation error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            update: vi.fn().mockResolvedValue(
              mockVendorValidationError('email', 'Invalid email format')
            ),
          },
        };
        return apiCall(client);
      });

      await expect(
        billvendorUpdateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        billvendorUpdateTool.execute(
          { vendorId: 12345, vendorName: 'Test' } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should require vendorId', async () => {
      await expect(
        billvendorUpdateTool.execute(
          { accountId: 'ABC123', vendorName: 'Test' } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject non-numeric vendorId', async () => {
      await expect(
        billvendorUpdateTool.execute(
          { accountId: 'ABC123', vendorId: 'invalid', vendorName: 'Test' } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject invalid email format', async () => {
      await expect(
        billvendorUpdateTool.execute(
          { accountId: 'ABC123', vendorId: 12345, email: 'invalid-email' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject invalid website format', async () => {
      await expect(
        billvendorUpdateTool.execute(
          { accountId: 'ABC123', vendorId: 12345, website: 'not-a-url' },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });
});
