/**
 * Tests for user_me tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { userMeTool } from '../../../src/tools/user/user-me.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockUserMeResponse,
  mockUserMultipleBusinessesResponse,
  mockUserMinimalResponse,
  mockUserNoOptionalFieldsResponse,
  mockUserUnicodeResponse,
} from '../../mocks/responses/user.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
  mockNetworkTimeoutError,
  mockForbiddenError,
  mockServiceUnavailableError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('user_me tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should retrieve current user information', async () => {
      const mockResponse = mockUserMeResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          users: {
            me: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await userMeTool.execute({}, mockClient as any);

      expect(result.id).toBe(1);
      expect(result.email).toBe('user@example.com');
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
    });

    it('should return complete user profile with all fields', async () => {
      const mockResponse = mockUserMeResponse({
        id: 42,
        email: 'jane.doe@testcorp.com',
        firstName: 'Jane',
        lastName: 'Doe',
        profession: 'Product Manager',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          users: {
            me: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await userMeTool.execute({}, mockClient as any);

      expect(result.id).toBe(42);
      expect(result.email).toBe('jane.doe@testcorp.com');
      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Doe');
      expect(result.profession).toBe('Product Manager');
    });

    it('should return business memberships', async () => {
      const mockResponse = mockUserMeResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          users: {
            me: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await userMeTool.execute({}, mockClient as any);

      expect(result.businessMemberships).toBeDefined();
      expect(result.businessMemberships.length).toBeGreaterThan(0);
      expect(result.businessMemberships[0].id).toBeDefined();
      expect(result.businessMemberships[0].name).toBeDefined();
      expect(result.businessMemberships[0].accountId).toBeDefined();
      expect(result.businessMemberships[0].role).toBeDefined();
    });

    it('should return user with multiple business memberships', async () => {
      const mockResponse = mockUserMultipleBusinessesResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          users: {
            me: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await userMeTool.execute({}, mockClient as any);

      expect(result.businessMemberships).toHaveLength(3);
      expect(result.businessMemberships[0].name).toBe('Business One');
      expect(result.businessMemberships[0].role).toBe('owner');
      expect(result.businessMemberships[1].name).toBe('Business Two');
      expect(result.businessMemberships[1].role).toBe('admin');
      expect(result.businessMemberships[2].name).toBe('Business Three');
      expect(result.businessMemberships[2].role).toBe('employee');
    });

    it('should return phone numbers when present', async () => {
      const mockResponse = mockUserMeResponse({
        phoneNumbers: [
          { title: 'Mobile', number: '+1-555-123-4567' },
          { title: 'Office', number: '+1-555-987-6543' },
        ],
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          users: {
            me: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await userMeTool.execute({}, mockClient as any);

      expect(result.phoneNumbers).toBeDefined();
      expect(result.phoneNumbers).toHaveLength(2);
      expect(result.phoneNumbers![0].title).toBe('Mobile');
      expect(result.phoneNumbers![0].number).toBe('+1-555-123-4567');
    });

    it('should return addresses when present', async () => {
      const mockResponse = mockUserMeResponse({
        addresses: [
          {
            street: '456 Tech Boulevard',
            city: 'San Francisco',
            province: 'CA',
            country: 'USA',
            postalCode: '94105',
          },
        ],
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          users: {
            me: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await userMeTool.execute({}, mockClient as any);

      expect(result.addresses).toBeDefined();
      expect(result.addresses).toHaveLength(1);
      expect(result.addresses![0].street).toBe('456 Tech Boulevard');
      expect(result.addresses![0].city).toBe('San Francisco');
      expect(result.addresses![0].province).toBe('CA');
    });

    it('should return links when present', async () => {
      const mockResponse = mockUserMeResponse({
        links: {
          me: '/service/auth/api/v1/users/42',
        },
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          users: {
            me: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await userMeTool.execute({}, mockClient as any);

      expect(result.links).toBeDefined();
      expect(result.links!.me).toBe('/service/auth/api/v1/users/42');
    });

    it('should handle minimal user data', async () => {
      const mockResponse = mockUserMinimalResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          users: {
            me: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await userMeTool.execute({}, mockClient as any);

      expect(result.id).toBe(1);
      expect(result.email).toBe('minimal@example.com');
      expect(result.firstName).toBe('Min');
      expect(result.lastName).toBe('User');
      expect(result.businessMemberships).toHaveLength(1);
    });

    it('should handle user without optional fields', async () => {
      const mockResponse = mockUserNoOptionalFieldsResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          users: {
            me: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await userMeTool.execute({}, mockClient as any);

      expect(result.id).toBe(1);
      expect(result.email).toBe('basic@example.com');
      expect(result.businessMemberships).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          users: {
            me: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(userMeTool.execute({}, mockClient as any)).rejects.toThrow();
    });

    it('should handle forbidden error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          users: {
            me: vi.fn().mockResolvedValue(mockForbiddenError('user profile')),
          },
        };
        return apiCall(client);
      });

      await expect(userMeTool.execute({}, mockClient as any)).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          users: {
            me: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(userMeTool.execute({}, mockClient as any)).rejects.toThrow();
    });

    it('should handle rate limit error with custom retry time', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          users: {
            me: vi.fn().mockResolvedValue(mockRateLimitError(120)),
          },
        };
        return apiCall(client);
      });

      await expect(userMeTool.execute({}, mockClient as any)).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          users: {
            me: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(userMeTool.execute({}, mockClient as any)).rejects.toThrow();
    });

    it('should handle service unavailable error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          users: {
            me: vi.fn().mockResolvedValue(mockServiceUnavailableError()),
          },
        };
        return apiCall(client);
      });

      await expect(userMeTool.execute({}, mockClient as any)).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());

      await expect(userMeTool.execute({}, mockClient as any)).rejects.toThrow();
    });

    it('should handle network timeout with ETIMEDOUT error code', async () => {
      const timeoutError = mockNetworkTimeoutError();
      mockClient.executeWithRetry.mockRejectedValueOnce(timeoutError);

      await expect(userMeTool.execute({}, mockClient as any)).rejects.toThrow('Request timeout');
    });

    it('should handle generic Error objects', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(new Error('Unknown error occurred'));

      await expect(userMeTool.execute({}, mockClient as any)).rejects.toThrow();
    });

    it('should handle malformed API response', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          users: {
            me: vi.fn().mockResolvedValue({ ok: false, error: null }),
          },
        };
        return apiCall(client);
      });

      await expect(userMeTool.execute({}, mockClient as any)).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should accept empty input object', async () => {
      const mockResponse = mockUserMeResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          users: {
            me: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      // Should not throw
      await expect(userMeTool.execute({}, mockClient as any)).resolves.toBeDefined();
    });

    it('should ignore extra properties in input', async () => {
      const mockResponse = mockUserMeResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          users: {
            me: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      // Should not throw even with extra properties
      await expect(
        userMeTool.execute({ extraProperty: 'ignored' } as any, mockClient as any)
      ).resolves.toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle user with unicode characters in name', async () => {
      const mockResponse = mockUserUnicodeResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          users: {
            me: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await userMeTool.execute({}, mockClient as any);

      expect(result.firstName).toBe('山田');
      expect(result.lastName).toBe('太郎');
      expect(result.profession).toBe('デザイナー 🎨');
      expect(result.businessMemberships[0].name).toBe('株式会社テスト');
    });

    it('should handle user with empty business memberships array', async () => {
      const mockResponse = mockUserMeResponse({
        businessMemberships: [],
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          users: {
            me: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await userMeTool.execute({}, mockClient as any);

      expect(result.businessMemberships).toEqual([]);
    });

    it('should handle user with empty phone numbers array', async () => {
      const mockResponse = mockUserMeResponse({
        phoneNumbers: [],
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          users: {
            me: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await userMeTool.execute({}, mockClient as any);

      expect(result.phoneNumbers).toEqual([]);
    });

    it('should handle user with empty addresses array', async () => {
      const mockResponse = mockUserMeResponse({
        addresses: [],
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          users: {
            me: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await userMeTool.execute({}, mockClient as any);

      expect(result.addresses).toEqual([]);
    });

    it('should handle phone number without title', async () => {
      const mockResponse = mockUserMeResponse({
        phoneNumbers: [{ number: '+1-555-000-0000' }],
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          users: {
            me: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await userMeTool.execute({}, mockClient as any);

      expect(result.phoneNumbers).toBeDefined();
      expect(result.phoneNumbers![0].number).toBe('+1-555-000-0000');
    });

    it('should handle address with partial information', async () => {
      const mockResponse = mockUserMeResponse({
        addresses: [
          {
            city: 'New York',
            country: 'USA',
          },
        ],
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          users: {
            me: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await userMeTool.execute({}, mockClient as any);

      expect(result.addresses).toBeDefined();
      expect(result.addresses![0].city).toBe('New York');
      expect(result.addresses![0].country).toBe('USA');
    });

    it('should handle very long email addresses', async () => {
      const longEmail = 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com';
      const mockResponse = mockUserMeResponse({ email: longEmail });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          users: {
            me: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await userMeTool.execute({}, mockClient as any);

      expect(result.email).toBe(longEmail);
    });

    it('should handle special characters in profession', async () => {
      const mockResponse = mockUserMeResponse({
        profession: 'Software Developer & Technical Lead / Architect (Senior)',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          users: {
            me: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await userMeTool.execute({}, mockClient as any);

      expect(result.profession).toBe('Software Developer & Technical Lead / Architect (Senior)');
    });

    it('should handle business membership with all role types', async () => {
      const mockResponse = mockUserMeResponse({
        businessMemberships: [
          { id: 1, name: 'Owner Business', accountId: 'ACC1', role: 'owner' },
          { id: 2, name: 'Admin Business', accountId: 'ACC2', role: 'admin' },
          { id: 3, name: 'Employee Business', accountId: 'ACC3', role: 'employee' },
          { id: 4, name: 'Contractor Business', accountId: 'ACC4', role: 'contractor' },
        ],
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          users: {
            me: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await userMeTool.execute({}, mockClient as any);

      expect(result.businessMemberships).toHaveLength(4);
      expect(result.businessMemberships.map(b => b.role)).toEqual([
        'owner',
        'admin',
        'employee',
        'contractor',
      ]);
    });

    it('should handle international phone number formats', async () => {
      const mockResponse = mockUserMeResponse({
        phoneNumbers: [
          { title: 'UK Office', number: '+44 20 7946 0958' },
          { title: 'Japan Mobile', number: '+81 90-1234-5678' },
          { title: 'Germany', number: '+49 30 12345678' },
        ],
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          users: {
            me: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await userMeTool.execute({}, mockClient as any);

      expect(result.phoneNumbers).toHaveLength(3);
      expect(result.phoneNumbers![0].number).toBe('+44 20 7946 0958');
      expect(result.phoneNumbers![1].number).toBe('+81 90-1234-5678');
      expect(result.phoneNumbers![2].number).toBe('+49 30 12345678');
    });
  });
});
