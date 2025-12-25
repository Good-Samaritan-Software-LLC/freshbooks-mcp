/**
 * Zod schemas for PaymentOptions entity
 *
 * Payment gateway configuration schemas for FreshBooks API
 */

import { z } from 'zod';

/**
 * Gateway information schema
 */
export const GatewayInfoSchema = z.object({
  gateway: z.string().describe('Gateway identifier (e.g., stripe, paypal, square)'),
  gatewayId: z.string().optional().describe('Gateway-specific ID'),
});

/**
 * Full PaymentOptions schema with all properties
 */
export const PaymentOptionsSchema = z.object({
  id: z.number().optional().describe('Payment options ID'),
  entityId: z.number().describe('Invoice or estimate ID'),
  entityType: z.enum(['invoice', 'estimate']).describe('Type of entity (invoice or estimate)'),
  gateway: z.string().optional().describe('Payment gateway name'),
  hasAch: z.boolean().describe('Whether ACH/bank transfer is enabled'),
  hasCreditCard: z.boolean().describe('Whether credit card payments are enabled'),
  hasPaypalSmartCheckout: z.boolean().optional().describe('Whether PayPal Smart Checkout is enabled'),
  allowPartialPayments: z.boolean().optional().describe('Whether partial payments are allowed'),
  gatewayInfo: GatewayInfoSchema.optional().describe('Gateway-specific information'),
});

/**
 * Input schema for getting payment options for an entity
 */
export const PaymentOptionsSingleInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  entityId: z.number().describe('Invoice or estimate ID'),
  entityType: z.enum(['invoice', 'estimate']).describe('Type of entity (invoice or estimate)'),
});

/**
 * Input schema for creating payment options
 */
export const PaymentOptionsCreateInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  entityId: z.number().describe('Invoice or estimate ID'),
  entityType: z.enum(['invoice', 'estimate']).describe('Type of entity (invoice or estimate)'),
  gateway: z.string().optional().describe('Payment gateway to use'),
  hasAch: z.boolean().optional().describe('Enable ACH/bank transfer'),
  hasCreditCard: z.boolean().optional().describe('Enable credit card payments'),
  hasPaypalSmartCheckout: z.boolean().optional().describe('Enable PayPal Smart Checkout'),
  allowPartialPayments: z.boolean().optional().describe('Allow partial payments'),
});

/**
 * Input schema for getting default payment options
 */
export const PaymentOptionsDefaultInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
});

/**
 * Output schema for single payment options
 */
export const PaymentOptionsSingleOutputSchema = PaymentOptionsSchema;

/**
 * Output schema for default payment options
 */
export const PaymentOptionsDefaultOutputSchema = z.object({
  gateway: z.string().optional().describe('Default payment gateway'),
  hasAch: z.boolean().describe('ACH enabled by default'),
  hasCreditCard: z.boolean().describe('Credit card enabled by default'),
  hasPaypalSmartCheckout: z.boolean().optional().describe('PayPal enabled by default'),
  allowPartialPayments: z.boolean().optional().describe('Partial payments allowed by default'),
});
