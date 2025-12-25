/**
 * Tests for paymentoptions_create tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { paymentOptionsCreateTool } from '../../../src/tools/payment-options/paymentoptions-create.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockPaymentOptionsCreateResponse,
  mockPaymentOptionsValidationError,
  mockInvalidGatewayError,
  mockGatewayNotConfiguredError,
  mockInvalidEntityTypeError,
} from '../../mocks/responses/payment-options.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
  mockNetworkTimeoutError,
  mockNotFoundError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('paymentoptions_create tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  const validInput = {
    accountId: 'ABC123',
    entityId: 12345,
    entityType: 'invoice' as const,
  };

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should create payment options with required fields only', async () => {
      const mockResponse = mockPaymentOptionsCreateResponse({
        entityId: 12345,
        entityType: 'invoice',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentOptionsCreateTool.execute(validInput, mockClient as any);

      expect(result.id).toBe(99999);
      expect(result.entityId).toBe(12345);
      expect(result.entityType).toBe('invoice');
    });

    it('should create payment options with credit card enabled', async () => {
      const mockResponse = mockPaymentOptionsCreateResponse({
        hasCreditCard: true,
        hasAch: false,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentOptionsCreateTool.execute(
        { ...validInput, hasCreditCard: true },
        mockClient as any
      );

      expect(result.hasCreditCard).toBe(true);
      expect(result.hasAch).toBe(false);
    });

    it('should create payment options with ACH enabled', async () => {
      const mockResponse = mockPaymentOptionsCreateResponse({
        hasCreditCard: false,
        hasAch: true,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentOptionsCreateTool.execute(
        { ...validInput, hasAch: true },
        mockClient as any
      );

      expect(result.hasAch).toBe(true);
    });

    it('should create payment options with PayPal enabled', async () => {
      const mockResponse = mockPaymentOptionsCreateResponse({
        hasPaypalSmartCheckout: true,
        gateway: 'paypal',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentOptionsCreateTool.execute(
        { ...validInput, hasPaypalSmartCheckout: true, gateway: 'paypal' },
        mockClient as any
      );

      expect(result.hasPaypalSmartCheckout).toBe(true);
      expect(result.gateway).toBe('paypal');
    });

    it('should create payment options with partial payments allowed', async () => {
      const mockResponse = mockPaymentOptionsCreateResponse({
        allowPartialPayments: true,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentOptionsCreateTool.execute(
        { ...validInput, allowPartialPayments: true },
        mockClient as any
      );

      expect(result.allowPartialPayments).toBe(true);
    });

    it('should create payment options with all methods enabled', async () => {
      const mockResponse = mockPaymentOptionsCreateResponse({
        hasCreditCard: true,
        hasAch: true,
        hasPaypalSmartCheckout: true,
        allowPartialPayments: true,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentOptionsCreateTool.execute(
        {
          ...validInput,
          hasCreditCard: true,
          hasAch: true,
          hasPaypalSmartCheckout: true,
          allowPartialPayments: true,
        },
        mockClient as any
      );

      expect(result.hasCreditCard).toBe(true);
      expect(result.hasAch).toBe(true);
      expect(result.hasPaypalSmartCheckout).toBe(true);
      expect(result.allowPartialPayments).toBe(true);
    });

    it('should create payment options with Stripe gateway', async () => {
      const mockResponse = mockPaymentOptionsCreateResponse({
        gateway: 'stripe',
        hasCreditCard: true,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentOptionsCreateTool.execute(
        { ...validInput, gateway: 'stripe', hasCreditCard: true },
        mockClient as any
      );

      expect(result.gateway).toBe('stripe');
    });

    it('should create payment options with Square gateway', async () => {
      const mockResponse = mockPaymentOptionsCreateResponse({
        gateway: 'square',
        hasCreditCard: true,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentOptionsCreateTool.execute(
        { ...validInput, gateway: 'square', hasCreditCard: true },
        mockClient as any
      );

      expect(result.gateway).toBe('square');
    });

    it('should create payment options for an estimate', async () => {
      const mockResponse = mockPaymentOptionsCreateResponse({
        entityId: 67890,
        entityType: 'estimate',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentOptionsCreateTool.execute(
        { ...validInput, entityId: 67890, entityType: 'estimate' },
        mockClient as any
      );

      expect(result.entityType).toBe('estimate');
    });

    it('should create payment options with Authorize.Net gateway', async () => {
      const mockResponse = mockPaymentOptionsCreateResponse({
        gateway: 'authorize_net',
        hasCreditCard: true,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentOptionsCreateTool.execute(
        { ...validInput, gateway: 'authorize_net', hasCreditCard: true },
        mockClient as any
      );

      expect(result.gateway).toBe('authorize_net');
    });

    it('should create payment options with WePay gateway', async () => {
      const mockResponse = mockPaymentOptionsCreateResponse({
        gateway: 'wepay',
        hasCreditCard: true,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentOptionsCreateTool.execute(
        { ...validInput, gateway: 'wepay', hasCreditCard: true },
        mockClient as any
      );

      expect(result.gateway).toBe('wepay');
    });
  });

  describe('error handling', () => {
    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            create: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentOptionsCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            create: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentOptionsCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            create: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentOptionsCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());

      await expect(
        paymentOptionsCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle validation error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            create: vi.fn().mockResolvedValue(
              mockPaymentOptionsValidationError('gateway', 'Gateway is required')
            ),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentOptionsCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle invalid gateway error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            create: vi.fn().mockResolvedValue(mockInvalidGatewayError('invalid_gateway')),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentOptionsCreateTool.execute(
          { ...validInput, gateway: 'invalid_gateway' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle gateway not configured error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            create: vi.fn().mockResolvedValue(mockGatewayNotConfiguredError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentOptionsCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle invalid entity type error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            create: vi.fn().mockResolvedValue(mockInvalidEntityTypeError('invalid')),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentOptionsCreateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle entity not found error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            create: vi.fn().mockResolvedValue(mockNotFoundError('invoice', 99999)),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentOptionsCreateTool.execute(
          { ...validInput, entityId: 99999 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      const { accountId, ...inputWithoutAccount } = validInput;

      await expect(
        paymentOptionsCreateTool.execute(inputWithoutAccount as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require entityId', async () => {
      const { entityId, ...inputWithoutEntity } = validInput;

      await expect(
        paymentOptionsCreateTool.execute(inputWithoutEntity as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require entityType', async () => {
      const { entityType, ...inputWithoutType } = validInput;

      await expect(
        paymentOptionsCreateTool.execute(inputWithoutType as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should reject non-numeric entityId', async () => {
      await expect(
        paymentOptionsCreateTool.execute(
          { ...validInput, entityId: 'invalid' as any },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should only accept invoice or estimate for entityType', async () => {
      await expect(
        paymentOptionsCreateTool.execute(
          { ...validInput, entityType: 'invalid' as any },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should accept hasCreditCard as boolean', async () => {
      const mockResponse = mockPaymentOptionsCreateResponse({ hasCreditCard: true });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentOptionsCreateTool.execute(
          { ...validInput, hasCreditCard: true },
          mockClient as any
        )
      ).resolves.toBeDefined();
    });

    it('should accept hasAch as boolean', async () => {
      const mockResponse = mockPaymentOptionsCreateResponse({ hasAch: true });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentOptionsCreateTool.execute(
          { ...validInput, hasAch: true },
          mockClient as any
        )
      ).resolves.toBeDefined();
    });

    it('should accept hasPaypalSmartCheckout as boolean', async () => {
      const mockResponse = mockPaymentOptionsCreateResponse({ hasPaypalSmartCheckout: true });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentOptionsCreateTool.execute(
          { ...validInput, hasPaypalSmartCheckout: true },
          mockClient as any
        )
      ).resolves.toBeDefined();
    });

    it('should accept allowPartialPayments as boolean', async () => {
      const mockResponse = mockPaymentOptionsCreateResponse({ allowPartialPayments: true });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentOptionsCreateTool.execute(
          { ...validInput, allowPartialPayments: true },
          mockClient as any
        )
      ).resolves.toBeDefined();
    });

    it('should accept gateway as string', async () => {
      const mockResponse = mockPaymentOptionsCreateResponse({ gateway: 'stripe' });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentOptionsCreateTool.execute(
          { ...validInput, gateway: 'stripe' },
          mockClient as any
        )
      ).resolves.toBeDefined();
    });
  });
});
