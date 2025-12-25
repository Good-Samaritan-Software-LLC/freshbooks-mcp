# Item API Reference

Items represent products or services that can be added to invoices. They store default pricing, descriptions, and tax information for quick invoice creation.

## item_list

List items from FreshBooks with optional filtering and pagination.

### Description

Retrieve a paginated list of items (products and services) with filtering by name, type, or SKU.

**When to use:**
- User asks to see their item/product catalog
- User needs to find items for invoice creation
- User wants to browse available products or services
- Finding item IDs and pricing information

### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| accountId | string | Yes | - | FreshBooks account identifier |
| page | number | No | 1 | Page number (1-indexed) |
| perPage | number | No | 30 | Results per page (max 100) |
| name | string | No | - | Filter by item name (partial match) |
| type | string | No | - | Filter by type (product, service, discount) |
| sku | string | No | - | Filter by SKU (exact match) |

### Input Example

```json
{
  "accountId": "ABC123",
  "page": 1,
  "perPage": 25,
  "type": "service",
  "name": "consulting"
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| items | Item[] | Array of item objects |
| pagination | Pagination | Pagination metadata |

#### Item Object

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | number | No | Unique item identifier |
| name | string | No | Item name/description |
| description | string | Yes | Detailed item description |
| type | string | No | Type of item (product, service, discount) |
| rate | Money | Yes | Unit price/rate |
| quantity | number | Yes | Default quantity |
| taxable | boolean | No | Whether item is taxable |
| tax1 | string | Yes | Primary tax name |
| tax2 | string | Yes | Secondary tax name |
| inventory | number | Yes | Inventory quantity available |
| sku | string | Yes | Stock keeping unit (SKU) |
| accountingSystemId | string | Yes | Reference to accounting system |
| visState | number | Yes | Visibility state (0=active, 1=deleted, 2=archived) |
| createdAt | string | No | Creation timestamp (ISO 8601) |
| updatedAt | string | No | Last update timestamp (ISO 8601) |

### Output Example

```json
{
  "items": [
    {
      "id": 1001,
      "name": "Consulting Services",
      "description": "Hourly consulting rate for software development",
      "type": "service",
      "rate": {
        "amount": "150.00",
        "code": "USD"
      },
      "quantity": 1,
      "taxable": true,
      "tax1": "Sales Tax",
      "tax2": null,
      "inventory": null,
      "sku": "SVC-001",
      "visState": 0,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-12-01T14:30:00Z"
    },
    {
      "id": 1002,
      "name": "Web Hosting",
      "description": "Annual web hosting package",
      "type": "product",
      "rate": {
        "amount": "500.00",
        "code": "USD"
      },
      "quantity": 1,
      "taxable": false,
      "inventory": 50,
      "sku": "HOST-ANNUAL",
      "visState": 0,
      "createdAt": "2024-02-01T09:00:00Z",
      "updatedAt": "2024-11-15T11:20:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pages": 2,
    "total": 42,
    "perPage": 30
  }
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid accountId format | No | Check account ID is valid |
| -32602 | Invalid type value | No | Use 'product', 'service', or 'discount' |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |
| -32004 | Rate limit exceeded | Yes | Wait and retry after delay |

### Related Tools

- [item_single](#item_single) - Get single item by ID
- [item_create](#item_create) - Create new item
- [invoice_create](./invoices.md#invoice_create) - Use items on invoices

---

## item_single

Get a single item by ID.

### Description

Retrieve detailed information about a specific item.

**When to use:**
- User asks for details about a specific item
- Need to verify item data before update/delete
- Retrieve pricing and description for invoice
- Get current inventory levels

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| itemId | number | Yes | Item ID to retrieve |

### Input Example

```json
{
  "accountId": "ABC123",
  "itemId": 1001
}
```

### Output Schema

Returns a single Item object (see [item_list](#item-object) for schema).

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid itemId | No | Check ID is a positive integer |
| -32005 | Item not found | No | Verify ID exists in FreshBooks |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [item_list](#item_list) - Find item IDs
- [item_update](#item_update) - Update this item
- [invoice_create](./invoices.md#invoice_create) - Add item to invoice

---

## item_create

Create a new item.

### Description

Create a new product or service item with pricing and description. Items make invoice creation faster by storing reusable information.

**When to use:**
- User wants to add a new product or service to catalog
- Creating reusable items for invoicing
- Setting up pricing for services
- Adding products to inventory

### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| accountId | string | Yes | - | FreshBooks account identifier |
| name | string | Yes | - | Item name/description |
| description | string | No | - | Detailed item description |
| type | string | No | service | Type of item (product, service, discount) |
| rate | Money | No | - | Unit price/rate |
| quantity | number | No | - | Default quantity |
| taxable | boolean | No | true | Whether item is taxable |
| tax1 | string | No | - | Primary tax name |
| tax2 | string | No | - | Secondary tax name |
| inventory | number | No | - | Inventory quantity available |
| sku | string | No | - | Stock keeping unit (SKU) |

### Input Example

```json
{
  "accountId": "ABC123",
  "name": "Premium Support Package",
  "description": "24/7 premium support with 2-hour response time",
  "type": "service",
  "rate": {
    "amount": "299.00",
    "code": "USD"
  },
  "quantity": 1,
  "taxable": false,
  "sku": "SUPPORT-PREM"
}
```

### Output Schema

Returns the created Item object (see [item_list](#item-object) for schema).

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Missing name | No | Provide item name |
| -32602 | Invalid type | No | Use 'product', 'service', or 'discount' |
| -32602 | Invalid inventory value | No | Use non-negative number |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [item_list](#item_list) - View created items
- [item_update](#item_update) - Update item after creation
- [invoice_create](./invoices.md#invoice_create) - Use item on invoice

---

## item_update

Update an existing item.

### Description

Modify fields of an existing item. All fields except accountId and itemId are optional - only provided fields will be updated.

**When to use:**
- User wants to change item pricing
- Update item description or details
- Adjust inventory quantities
- Change tax settings
- Update SKU or visibility

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| itemId | number | Yes | Item ID to update |
| name | string | No | Item name/description |
| description | string | No | Detailed item description |
| type | string | No | Type of item (product, service, discount) |
| rate | Money | No | Unit price/rate |
| quantity | number | No | Default quantity |
| taxable | boolean | No | Whether item is taxable |
| tax1 | string | No | Primary tax name |
| tax2 | string | No | Secondary tax name |
| inventory | number | No | Inventory quantity available |
| sku | string | No | Stock keeping unit (SKU) |

### Input Example

```json
{
  "accountId": "ABC123",
  "itemId": 1001,
  "rate": {
    "amount": "175.00",
    "code": "USD"
  },
  "description": "Updated hourly rate - effective 2025"
}
```

### Output Schema

Returns the updated Item object (see [item_list](#item-object) for schema).

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid itemId | No | Check ID is a positive integer |
| -32602 | Invalid type | No | Use 'product', 'service', or 'discount' |
| -32005 | Item not found | No | Verify ID exists in FreshBooks |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [item_single](#item_single) - Get current values before update
- [item_list](#item_list) - View all items

---

## Notes

### Item Types

| Type | Description | Use Case |
|------|-------------|----------|
| service | Service/labor | Hourly rates, consulting, subscriptions |
| product | Physical/digital product | Products for sale, inventory items |
| discount | Discount/adjustment | Promotional discounts, adjustments |

### Inventory Tracking

- Set `inventory` for products to track stock levels
- Inventory is null for services (not applicable)
- FreshBooks can decrement inventory when items are invoiced

### Tax Configuration

- `taxable: true` - Item is subject to tax
- `taxable: false` - Item is tax-exempt
- `tax1` and `tax2` - Names of taxes to apply (e.g., "Sales Tax", "VAT")

### SKU (Stock Keeping Unit)

- Unique identifier for inventory management
- Useful for product tracking and barcode systems
- Can be alphanumeric (e.g., "PROD-001", "SVC-CONSULT")

### Default Values

When adding item to invoice:
- `rate` is used as the default unit price
- `quantity` is used as the default quantity
- `description` is pre-filled
- All values can be overridden on the invoice

### Pricing

Item rates use Money object:
```json
{
  "amount": "150.00",  // Decimal as string
  "code": "USD"        // Currency code
}
```

Always use strings for amounts to avoid floating-point precision issues.
