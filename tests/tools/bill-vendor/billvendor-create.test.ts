/**
 * Tests for billvendor_create tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { billvendorCreateTool } from '../../../src/tools/bill-vendor/billvendor-create.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockVendorCreateResponse,
  mockVendorValidationError,
  mockVendorDuplicateError,
} from '../../mocks/responses/bill-vendor.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
  mockNetworkTimeoutError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('billvendor_create tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  const validInput = {
    accountId: 'ABC123',
    vendorName: 'New Vendor LLC',
  };

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should create a vendor with required fields', async () => {
      const mockResponse = mockVendorCreateResponse({
        vendorName: 'New Vendor LLC',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billvendorCreateTool.execute(validInput, mockClient as any);

      expect(result.id).toBe(99999);
      expect(result.vendorName).toBe('New Vendor LLC');
    });

    it('should create a vendor with contact information', async () => {
      const mockResponse = mockVendorCreateResponse({
        vendorName: 'New Vendor LLC',
        contactName: 'John Smith',
        email: 'john@newvendor.com',
        phone: '555-555-1234',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billvendorCreateTool.execute(
        {
          ...validInput,
          contactName: 'John Smith',
          email: 'john@newvendor.com',
          phone: '555-555-1234',
        },
        mockClient as any
      );

      expect(result.contactName).toBe('John Smith');
      expect(result.email).toBe('john@newvendor.com');
      expect(result.phone).toBe('555-555-1234');
    });

    it('should create a vendor with full address', async () => {
      const mockResponse = mockVendorCreateResponse({
        address: '456 Business Ave',
        city: 'Toronto',
        province: 'ON',
        postalCode: 'M5V 2H1',
        country: 'Canada',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billvendorCreateTool.execute(
        {
          ...validInput,
          address: '456 Business Ave',
          city: 'Toronto',
          province: 'ON',
          postalCode: 'M5V 2H1',
          country: 'Canada',
        },
        mockClient as any
      );

      expect(result.address).toBe('456 Business Ave');
      expect(result.city).toBe('Toronto');
      expect(result.country).toBe('Canada');
    });

    it('should create a vendor with tax information', async () => {
      const mockResponse = mockVendorCreateResponse({
        taxNumber: '98-7654321',
        is1099: true,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billvendorCreateTool.execute(
        {
          ...validInput,
          taxNumber: '98-7654321',
          is1099: true,
        },
        mockClient as any
      );

      expect(result.taxNumber).toBe('98-7654321');
      expect(result.is1099).toBe(true);
    });

    it('should create a vendor with different currency', async () => {
      const mockResponse = mockVendorCreateResponse({
        currencyCode: 'EUR',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billvendorCreateTool.execute(
        { ...validInput, currencyCode: 'EUR' },
        mockClient as any
      );

      expect(result.currencyCode).toBe('EUR');
    });

    it('should create a vendor with note', async () => {
      const mockResponse = mockVendorCreateResponse({
        note: 'Important supplier for office equipment',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billvendorCreateTool.execute(
        { ...validInput, note: 'Important supplier for office equipment' },
        mockClient as any
      );

      expect(result.note).toBe('Important supplier for office equipment');
    });
  });

  describe('error handling', () => {
    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            create: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        billvendorCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            create: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        billvendorCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            create: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        billvendorCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());

      await expect(
        billvendorCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle validation error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            create: vi.fn().mockResolvedValue(
              mockVendorValidationError('vendorName', 'Name is required')
            ),
          },
        };
        return apiCall(client);
      });

      await expect(
        billvendorCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle duplicate vendor error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billVendors: {
            create: vi.fn().mockResolvedValue(mockVendorDuplicateError('New Vendor LLC')),
          },
        };
        return apiCall(client);
      });

      await expect(
        billvendorCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      const { accountId, ...inputWithoutAccount } = validInput;

      await expect(
        billvendorCreateTool.execute(inputWithoutAccount as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require vendorName', async () => {
      const { vendorName, ...inputWithoutName } = validInput;

      await expect(
        billvendorCreateTool.execute(inputWithoutName as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should reject empty vendorName', async () => {
      await expect(
        billvendorCreateTool.execute(
          { ...validInput, vendorName: '' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject invalid email format', async () => {
      await expect(
        billvendorCreateTool.execute(
          { ...validInput, email: 'invalid-email' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject invalid website format', async () => {
      await expect(
        billvendorCreateTool.execute(
          { ...validInput, website: 'not-a-url' },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });
});
