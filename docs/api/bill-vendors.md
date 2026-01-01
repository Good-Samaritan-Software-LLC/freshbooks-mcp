# Bill Vendor API Reference

Bill vendors (also called suppliers) represent businesses or individuals you pay for goods or services. They store contact information and payment details.

## billvendor_list

List vendors from FreshBooks with optional filtering and pagination.

### Description

Retrieve a paginated list of vendors for accounts payable management.

**When to use:**
- User asks to see their vendor list
- User needs to find a vendor by name
- Finding vendor IDs for bill creation
- Managing supplier relationships

### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| accountId | string | Yes | - | FreshBooks account identifier |
| page | number | No | 1 | Page number (1-indexed) |
| perPage | number | No | 30 | Results per page (max 100) |
| vendorName | string | No | - | Filter by vendor name (partial match) |

### Input Example

```json
{
  "accountId": "ABC123",
  "page": 1,
  "perPage": 25,
  "vendorName": "Office"
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| vendors | BillVendor[] | Array of vendor objects |
| pagination | Pagination | Pagination metadata |

#### BillVendor Object

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | number | No | Unique vendor identifier |
| vendorName | string | No | Vendor/supplier name |
| contactName | string | Yes | Contact person name |
| email | string | Yes | Vendor email address |
| phone | string | Yes | Vendor phone number |
| website | string | Yes | Vendor website |
| address | string | Yes | Street address |
| city | string | Yes | City |
| province | string | Yes | Province/state |
| postalCode | string | Yes | Postal/ZIP code |
| country | string | Yes | Country |
| currencyCode | string | No | Currency code (e.g., USD) |
| accountNumber | string | Yes | Vendor account number |
| taxNumber | string | Yes | Tax ID/VAT number |
| note | string | Yes | Notes about vendor |
| is1099 | boolean | Yes | Whether vendor is 1099 eligible (US) |
| language | string | Yes | Preferred language |
| visState | number | Yes | Visibility state (0=active, 1=deleted, 2=archived) |
| createdAt | string | No | Creation timestamp (ISO 8601) |
| updatedAt | string | No | Last update timestamp (ISO 8601) |

### Output Example

```json
{
  "vendors": [
    {
      "id": 555,
      "vendorName": "Office Supply Co",
      "contactName": "Jane Smith",
      "email": "orders@officesupply.com",
      "phone": "+1-555-0200",
      "website": "https://officesupply.com",
      "address": "789 Supply St",
      "city": "Chicago",
      "province": "IL",
      "postalCode": "60601",
      "country": "USA",
      "currencyCode": "USD",
      "accountNumber": "ACC-12345",
      "taxNumber": "12-3456789",
      "note": "Net 30 payment terms",
      "is1099": true,
      "visState": 0,
      "createdAt": "2024-01-10T10:00:00Z",
      "updatedAt": "2024-12-01T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pages": 2,
    "total": 38,
    "perPage": 30
  }
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid accountId format | No | Check account ID is valid |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |
| -32004 | Rate limit exceeded | Yes | Wait and retry after delay |

### Related Tools

- [billvendor_single](#billvendor_single) - Get single vendor by ID
- [billvendor_create](#billvendor_create) - Create new vendor
- [bill_list](./bills.md#bill_list) - Find bills for vendor

---

## billvendor_single

Get a single vendor by ID.

### Description

Retrieve detailed information about a specific vendor.

**When to use:**
- User asks for details about a specific vendor
- Need to verify vendor data before creating bill
- Retrieve full vendor information

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| vendorId | number | Yes | Vendor ID to retrieve |

### Input Example

```json
{
  "accountId": "ABC123",
  "vendorId": 555
}
```

### Output Schema

Returns a single BillVendor object (see [billvendor_list](#billvendor-object) for schema).

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid vendorId | No | Check ID is a positive integer |
| -32005 | Vendor not found | No | Verify ID exists in FreshBooks |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [billvendor_list](#billvendor_list) - Find vendor IDs
- [billvendor_update](#billvendor_update) - Update this vendor
- [bill_create](./bills.md#bill_create) - Create bill for vendor

---

## billvendor_create

Create a new vendor.

### Description

Add a new vendor/supplier to your FreshBooks account for bill tracking.

**When to use:**
- User wants to add a new supplier
- Setting up vendor for bill entry
- Recording new business relationship

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| vendorName | string | Yes | Vendor/supplier name |
| contactName | string | No | Contact person name |
| email | string | No | Vendor email address |
| phone | string | No | Vendor phone number |
| website | string | No | Vendor website (must be valid URL) |
| address | string | No | Street address |
| city | string | No | City |
| province | string | No | Province/state |
| postalCode | string | No | Postal/ZIP code |
| country | string | No | Country |
| currencyCode | string | No | Currency code (default: USD) |
| accountNumber | string | No | Vendor account number |
| taxNumber | string | No | Tax ID/VAT number |
| note | string | No | Notes about vendor |
| is1099 | boolean | No | Whether vendor is 1099 eligible (US) |
| language | string | No | Preferred language |

### Input Example

```json
{
  "accountId": "ABC123",
  "vendorName": "Tech Equipment Inc",
  "contactName": "Bob Johnson",
  "email": "sales@techequip.com",
  "phone": "+1-555-0300",
  "address": "456 Tech Blvd",
  "city": "San Francisco",
  "province": "CA",
  "postalCode": "94102",
  "country": "USA",
  "currencyCode": "USD",
  "is1099": true,
  "note": "Net 30 payment terms - 2% discount if paid within 10 days"
}
```

### Output Schema

Returns the created BillVendor object (see [billvendor_list](#billvendor-object) for schema).

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Missing vendorName | No | Provide vendor name |
| -32602 | Invalid email format | No | Use valid email format |
| -32602 | Invalid website URL | No | Use valid URL format |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [billvendor_list](#billvendor_list) - View created vendors
- [bill_create](./bills.md#bill_create) - Create bill for vendor

---

## billvendor_update

Update an existing vendor.

### Description

Modify vendor information including contact details, address, or payment terms.

**When to use:**
- User wants to update vendor contact information
- Change vendor address or phone
- Update tax identification numbers
- Modify payment terms or notes

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| vendorId | number | Yes | Vendor ID to update |
| vendorName | string | No | Vendor/supplier name |
| contactName | string | No | Contact person name |
| email | string | No | Vendor email address |
| phone | string | No | Vendor phone number |
| website | string | No | Vendor website |
| address | string | No | Street address |
| city | string | No | City |
| province | string | No | Province/state |
| postalCode | string | No | Postal/ZIP code |
| country | string | No | Country |
| currencyCode | string | No | Currency code |
| accountNumber | string | No | Vendor account number |
| taxNumber | string | No | Tax ID/VAT number |
| note | string | No | Notes about vendor |
| is1099 | boolean | No | Whether vendor is 1099 eligible (US) |
| language | string | No | Preferred language |

### Input Example

```json
{
  "accountId": "ABC123",
  "vendorId": 555,
  "email": "newemail@officesupply.com",
  "phone": "+1-555-0250",
  "note": "Updated contact - Net 45 payment terms as of Jan 2025"
}
```

### Output Schema

Returns the updated BillVendor object (see [billvendor_list](#billvendor-object) for schema).

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid vendorId | No | Check ID is a positive integer |
| -32005 | Vendor not found | No | Verify ID exists in FreshBooks |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [billvendor_single](#billvendor_single) - Get current values before update
- [billvendor_delete](#billvendor_delete) - Delete instead of update

---

## billvendor_delete

Delete a vendor.

### Description

Delete a vendor record. Vendors with associated bills cannot typically be deleted.

**When to use:**
- User wants to remove unused vendor
- Deleting duplicate vendor records
- Cleaning up vendor list

**Warning:** Vendors with bills may need to be archived instead of deleted.

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| vendorId | number | Yes | Vendor ID to delete |

### Input Example

```json
{
  "accountId": "ABC123",
  "vendorId": 555
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Whether deletion was successful |
| vendorId | number | ID of deleted vendor |

### Output Example

```json
{
  "success": true,
  "vendorId": 555
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid vendorId | No | Check ID is a positive integer |
| -32005 | Vendor not found | No | Vendor may already be deleted |
| -32007 | Vendor has bills | No | Cannot delete vendors with bills |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [billvendor_single](#billvendor_single) - Verify vendor before deletion
- [billvendor_list](#billvendor_list) - View remaining vendors

---

## Notes

### 1099 Vendors (US Only)

Vendors with `is1099: true` are eligible for IRS Form 1099 reporting. This is required in the US for tracking payments to contractors and suppliers exceeding $600/year.

### Currency Codes

Vendor currency should match the currency used for bills with that vendor. Common codes: USD, CAD, EUR, GBP.

### Payment Terms

Use the `note` field to record:
- Payment terms (Net 30, Net 45, etc.)
- Discounts (2/10 Net 30 = 2% discount if paid within 10 days)
- Special instructions

### Account Numbers

The `accountNumber` field can store:
- Your account number with the vendor
- Vendor-assigned customer number
- Purchase order references
