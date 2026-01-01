# Payment Options API Reference

Payment options configure how clients can pay invoices and estimates, including credit cards, ACH, PayPal, and other payment gateways.

## paymentoptions_single

Get payment options configured for a specific invoice or estimate.

### Description

Retrieve the payment configuration for an invoice or estimate, showing which payment methods are enabled.

**When to use:**
- User wants to see what payment methods are available for an invoice
- User asks "how can this invoice be paid", "what payment options are enabled"
- Need to check payment gateway configuration for a specific entity
- Verifying payment setup before sharing invoice

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| entityId | number | Yes | Invoice or estimate ID |
| entityType | string | Yes | Type of entity ("invoice" or "estimate") |

### Input Example

```json
{
  "accountId": "ABC123",
  "entityId": 98765,
  "entityType": "invoice"
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| id | number | Payment options ID |
| entityId | number | Associated invoice or estimate ID |
| entityType | string | Entity type (invoice or estimate) |
| gateway | string | Payment gateway name (e.g., stripe, paypal) |
| hasCreditCard | boolean | Whether credit card payments are enabled |
| hasAch | boolean | Whether ACH/bank transfer is enabled |
| hasPaypalSmartCheckout | boolean | Whether PayPal Smart Checkout is enabled |
| allowPartialPayments | boolean | Whether partial payments are allowed |
| gatewayInfo | object | Gateway-specific configuration |

### Output Example

```json
{
  "id": 456,
  "entityId": 98765,
  "entityType": "invoice",
  "gateway": "stripe",
  "hasCreditCard": true,
  "hasAch": true,
  "hasPaypalSmartCheckout": false,
  "allowPartialPayments": true,
  "gatewayInfo": {
    "gateway": "stripe",
    "gatewayId": "acct_1234567890"
  }
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid entityId | No | Check ID is a positive integer |
| -32602 | Invalid entityType | No | Use "invoice" or "estimate" |
| -32005 | Entity not found | No | Verify invoice/estimate exists |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [invoice_single](./invoices.md#invoice_single) - Get invoice details
- [paymentoptions_create](#paymentoptions_create) - Configure payment options
- [paymentoptions_default](#paymentoptions_default) - Get default settings

---

## paymentoptions_create

Configure payment options for an invoice or estimate.

### Description

Set up payment methods for an invoice or estimate, enabling specific gateways and features.

**When to use:**
- User wants to enable specific payment methods for an invoice
- User says "enable credit card payments", "allow ACH for this invoice"
- Need to set up payment gateway configuration
- Customizing payment options for specific invoices

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| entityId | number | Yes | Invoice or estimate ID |
| entityType | string | Yes | Type of entity ("invoice" or "estimate") |
| gateway | string | No | Payment gateway to use (e.g., stripe, paypal) |
| hasCreditCard | boolean | No | Enable credit card payments |
| hasAch | boolean | No | Enable ACH/bank transfer |
| hasPaypalSmartCheckout | boolean | No | Enable PayPal Smart Checkout |
| allowPartialPayments | boolean | No | Allow customers to pay in installments |

### Input Example

```json
{
  "accountId": "ABC123",
  "entityId": 98765,
  "entityType": "invoice",
  "gateway": "stripe",
  "hasCreditCard": true,
  "hasAch": true,
  "allowPartialPayments": true
}
```

### Output Schema

Returns the created PaymentOptions object (see [paymentoptions_single](#output-schema) for schema).

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid entityId | No | Check ID is a positive integer |
| -32602 | Invalid entityType | No | Use "invoice" or "estimate" |
| -32602 | Invalid gateway | No | Use supported gateway name |
| -32005 | Entity not found | No | Verify invoice/estimate exists |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [invoice_create](./invoices.md#invoice_create) - Create invoice first
- [paymentoptions_single](#paymentoptions_single) - View configured options
- [paymentoptions_default](#paymentoptions_default) - Check default settings

---

## paymentoptions_default

Get default payment options for the account.

### Description

Retrieve account-level default payment settings that apply to new invoices and estimates.

**When to use:**
- User wants to see account-level payment settings
- User asks "what payment methods are enabled by default"
- Need to check default gateway configuration
- Planning to create invoices and need default payment setup

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |

### Input Example

```json
{
  "accountId": "ABC123"
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| gateway | string | Default payment gateway |
| hasCreditCard | boolean | Credit cards enabled by default |
| hasAch | boolean | ACH enabled by default |
| hasPaypalSmartCheckout | boolean | PayPal enabled by default |
| allowPartialPayments | boolean | Partial payments allowed by default |

### Output Example

```json
{
  "gateway": "stripe",
  "hasCreditCard": true,
  "hasAch": true,
  "hasPaypalSmartCheckout": false,
  "allowPartialPayments": true
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid accountId format | No | Check account ID is valid |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [paymentoptions_single](#paymentoptions_single) - Get entity-specific options
- [paymentoptions_create](#paymentoptions_create) - Customize for specific invoice
- [invoice_list](./invoices.md#invoice_list) - Find invoices

---

## Notes

### Supported Payment Gateways

FreshBooks supports multiple payment gateways:

| Gateway | Identifier | Features |
|---------|------------|----------|
| Stripe | `stripe` | Credit cards, ACH, international payments |
| PayPal | `paypal` | PayPal accounts, credit cards via PayPal |
| Square | `square` | Credit cards, mobile payments |
| Authorize.Net | `authorize_net` | Credit cards, eChecks |
| WePay | `wepay` | Credit cards, bank accounts |

### Payment Method Types

**Credit Card (`hasCreditCard`)**
- Visa, MasterCard, American Express, Discover
- Immediate payment processing
- Typical 2.9% + $0.30 processing fee

**ACH/Bank Transfer (`hasAch`)**
- Direct bank account debits
- Lower processing fees (typically 0.8%)
- Takes 3-5 business days to clear

**PayPal Smart Checkout (`hasPaypalSmartCheckout`)**
- PayPal account payments
- Guest checkout with credit cards
- PayPal branded checkout experience

### Partial Payments

When `allowPartialPayments` is enabled:
- Clients can pay any amount toward invoice
- Multiple payments tracked until invoice paid in full
- Useful for payment plans or large invoices
- Remaining balance displayed on invoice

### Entity Types

Payment options can be configured for:
- **Invoices** - Sent to clients for payment
- **Estimates** - Quotes that can be converted to invoices

### Default vs Custom Settings

- **Default options** - Apply to all new invoices/estimates
- **Custom options** - Override defaults for specific entities
- Custom settings created with `paymentoptions_create`
- Check defaults with `paymentoptions_default`

### Gateway Setup

Before enabling payment methods:
1. Connect payment gateway in FreshBooks settings
2. Complete gateway verification process
3. Configure gateway-specific settings
4. Test with small transaction

### Security

All payment processing uses:
- PCI-compliant gateways
- Encrypted data transmission
- Secure tokenization
- No sensitive card data stored in FreshBooks

### Best Practices

1. **Enable multiple options** - Give clients payment flexibility
2. **Test before launch** - Verify gateway connection works
3. **Consider fees** - Different methods have different costs
4. **International clients** - Enable appropriate payment methods
5. **Clear communication** - Inform clients of available payment methods

### Processing Fees

Payment gateway fees vary by:
- Payment method (card vs ACH)
- Transaction volume
- Gateway provider
- International vs domestic

Check your gateway settings in FreshBooks for specific fee structures.

### Troubleshooting

**Credit cards not working:**
- Verify gateway connection is active
- Check gateway credentials are current
- Ensure account is in good standing

**ACH unavailable:**
- Confirm ACH is supported by your gateway
- Verify business verification completed
- Check if available in your country

**PayPal issues:**
- Ensure PayPal business account connected
- Check PayPal account is verified
- Review PayPal-specific settings
