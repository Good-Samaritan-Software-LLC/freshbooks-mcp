# Client API Reference

Clients (also called customers) represent individuals or organizations that you bill for services. They contain contact information, billing addresses, and financial preferences.

## client_list

List clients from FreshBooks with optional filtering and pagination.

### Description

Retrieve a paginated list of clients with filtering by name, email, organization, or visibility state.

**When to use:**
- User asks to see their client list
- User needs to find a client by name, email, or organization
- User wants to see active, archived, or deleted clients
- Finding client IDs for invoicing or time tracking

### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| accountId | string | Yes | - | FreshBooks account identifier |
| page | number | No | 1 | Page number (1-indexed) |
| perPage | number | No | 30 | Results per page (max 100) |
| email | string | No | - | Filter by email address (exact match) |
| organization | string | No | - | Filter by organization name (partial match) |
| fName | string | No | - | Filter by first name (partial match) |
| lName | string | No | - | Filter by last name (partial match) |
| visState | number | No | - | Filter by visibility (0=active, 1=deleted, 2=archived) |

### Input Example

```json
{
  "accountId": "ABC123",
  "page": 1,
  "perPage": 25,
  "organization": "Acme Corp",
  "visState": 0
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| clients | Client[] | Array of client objects |
| pagination | Pagination | Pagination metadata |

#### Client Object

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | number | No | Unique client identifier |
| fName | string | Yes | First name |
| lName | string | Yes | Last name |
| organization | string | Yes | Organization/company name |
| email | string | Yes | Email address |
| busPhone | string | No | Business phone number |
| homePhone | string | Yes | Home phone number |
| mobPhone | string | No | Mobile phone number |
| fax | string | No | Fax number |
| note | string | Yes | Notes about the client |
| pStreet | string | No | Primary street address |
| pStreet2 | string | No | Primary street address line 2 |
| pCity | string | No | Primary city |
| pProvince | string | No | Primary province/state |
| pCode | string | No | Primary postal/zip code |
| pCountry | string | No | Primary country |
| sStreet | string | No | Secondary street address |
| sStreet2 | string | No | Secondary street address line 2 |
| sCity | string | No | Secondary city |
| sProvince | string | No | Secondary province/state |
| sCode | string | No | Secondary postal/zip code |
| sCountry | string | No | Secondary country |
| currencyCode | string | No | Currency code (e.g., USD, CAD, EUR) |
| language | string | Yes | Preferred language |
| vatNumber | string | Yes | VAT/tax identification number |
| vatName | string | Yes | VAT/tax name |
| visState | number | No | Visibility state (0/1/2) |
| signupDate | string | Yes | Client signup date (ISO 8601) |
| updated | string | Yes | Last update timestamp (ISO 8601) |
| allowLateFees | boolean | No | Whether to allow late fees |
| allowLateNotifications | boolean | No | Whether to send late payment notifications |
| hasRetainer | boolean | Yes | Whether client has a retainer |
| retainerId | string | Yes | Associated retainer ID |

#### Pagination Object

| Field | Type | Description |
|-------|------|-------------|
| page | number | Current page number |
| pages | number | Total number of pages |
| total | number | Total number of results |
| perPage | number | Results per page |

### Output Example

```json
{
  "clients": [
    {
      "id": 12345,
      "fName": "John",
      "lName": "Doe",
      "organization": "Acme Corp",
      "email": "john@acmecorp.com",
      "busPhone": "+1-555-0100",
      "homePhone": null,
      "mobPhone": "+1-555-0101",
      "fax": "",
      "note": "Preferred client",
      "pStreet": "123 Main St",
      "pStreet2": "Suite 100",
      "pCity": "New York",
      "pProvince": "NY",
      "pCode": "10001",
      "pCountry": "USA",
      "sStreet": "",
      "sStreet2": "",
      "sCity": "",
      "sProvince": "",
      "sCode": "",
      "sCountry": "",
      "currencyCode": "USD",
      "language": "en",
      "vatNumber": null,
      "vatName": null,
      "visState": 0,
      "signupDate": "2024-01-15T10:00:00Z",
      "updated": "2024-12-15T14:30:00Z",
      "allowLateFees": true,
      "allowLateNotifications": true,
      "hasRetainer": false,
      "retainerId": null
    }
  ],
  "pagination": {
    "page": 1,
    "pages": 3,
    "total": 75,
    "perPage": 30
  }
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid accountId format | No | Check account ID is valid |
| -32602 | Invalid visState value | No | Use 0, 1, or 2 |
| -32602 | perPage > 100 | No | Reduce perPage value to 100 or less |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |
| -32002 | Token expired | Yes | Token auto-refreshes, retry request |
| -32004 | Rate limit exceeded | Yes | Wait and retry after delay |

### Related Tools

- [client_single](#client_single) - Get single client by ID
- [client_create](#client_create) - Create new client
- [invoice_list](./invoices.md#invoice_list) - Find invoices for client
- [project_list](./projects.md#project_list) - Find projects for client

---

## client_single

Get a single client by ID.

### Description

Retrieve detailed information about a specific client.

**When to use:**
- User asks for details about a specific client
- Need to verify client data before update/delete
- Retrieve full details after creation

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| clientId | number | Yes | Client ID to retrieve |

### Input Example

```json
{
  "accountId": "ABC123",
  "clientId": 12345
}
```

### Output Schema

Returns a single Client object (see [client_list](#client-object) for schema).

### Output Example

```json
{
  "id": 12345,
  "fName": "John",
  "lName": "Doe",
  "organization": "Acme Corp",
  "email": "john@acmecorp.com",
  "busPhone": "+1-555-0100",
  "homePhone": null,
  "mobPhone": "+1-555-0101",
  "fax": "",
  "note": "Preferred client",
  "pStreet": "123 Main St",
  "pStreet2": "Suite 100",
  "pCity": "New York",
  "pProvince": "NY",
  "pCode": "10001",
  "pCountry": "USA",
  "currencyCode": "USD",
  "visState": 0,
  "allowLateFees": true,
  "allowLateNotifications": true
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid clientId | No | Check ID is a positive integer |
| -32005 | Client not found | No | Verify ID exists in FreshBooks |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [client_list](#client_list) - Find client IDs
- [client_update](#client_update) - Update this client
- [client_delete](#client_delete) - Delete this client

---

## client_create

Create a new client.

### Description

Create a new client with contact and billing information. At least one of first name, last name, or organization is required.

**When to use:**
- User wants to add a new client/customer
- Setting up a new business relationship
- Preparing to invoice a new client

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| fName | string | No* | First name |
| lName | string | No* | Last name |
| organization | string | No* | Organization/company name |
| email | string | No | Email address |
| busPhone | string | No | Business phone number |
| homePhone | string | No | Home phone number |
| mobPhone | string | No | Mobile phone number |
| fax | string | No | Fax number |
| note | string | No | Notes about the client |
| pStreet | string | No | Primary street address |
| pStreet2 | string | No | Primary street address line 2 |
| pCity | string | No | Primary city |
| pProvince | string | No | Primary province/state |
| pCode | string | No | Primary postal/zip code |
| pCountry | string | No | Primary country |
| sStreet | string | No | Secondary street address |
| sStreet2 | string | No | Secondary street address line 2 |
| sCity | string | No | Secondary city |
| sProvince | string | No | Secondary province/state |
| sCode | string | No | Secondary postal/zip code |
| sCountry | string | No | Secondary country |
| currencyCode | string | No | Currency code (e.g., USD, CAD, EUR) |
| language | string | No | Preferred language |
| vatNumber | string | No | VAT/tax identification number |
| vatName | string | No | VAT/tax name |
| allowLateFees | boolean | No | Whether to allow late fees |
| allowLateNotifications | boolean | No | Whether to send late payment notifications |

*At least one of fName, lName, or organization is required.

### Input Example

```json
{
  "accountId": "ABC123",
  "fName": "Jane",
  "lName": "Smith",
  "organization": "Smith Consulting",
  "email": "jane@smithconsulting.com",
  "busPhone": "+1-555-0200",
  "pStreet": "456 Oak Ave",
  "pCity": "Los Angeles",
  "pProvince": "CA",
  "pCode": "90001",
  "pCountry": "USA",
  "currencyCode": "USD",
  "allowLateFees": true,
  "allowLateNotifications": true
}
```

### Output Schema

Returns the created Client object (see [client_list](#client-object) for schema).

### Output Example

```json
{
  "id": 67890,
  "fName": "Jane",
  "lName": "Smith",
  "organization": "Smith Consulting",
  "email": "jane@smithconsulting.com",
  "busPhone": "+1-555-0200",
  "pStreet": "456 Oak Ave",
  "pCity": "Los Angeles",
  "pProvince": "CA",
  "pCode": "90001",
  "pCountry": "USA",
  "currencyCode": "USD",
  "visState": 0,
  "allowLateFees": true,
  "allowLateNotifications": true
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Missing name/organization | No | Provide at least one identifier |
| -32602 | Invalid email format | No | Use valid email format |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |
| -32013 | Validation error | Yes | Check field values match requirements |

### Related Tools

- [client_list](#client_list) - View created clients
- [client_update](#client_update) - Update client after creation
- [invoice_create](./invoices.md#invoice_create) - Create invoice for client

---

## client_update

Update an existing client.

### Description

Modify fields of an existing client. All fields except accountId and clientId are optional - only provided fields will be updated.

**When to use:**
- User wants to correct client information
- Update contact details or address
- Change billing preferences
- Archive or restore a client (visState)

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| clientId | number | Yes | Client ID to update |
| fName | string | No | First name |
| lName | string | No | Last name |
| organization | string | No | Organization/company name |
| email | string | No | Email address |
| busPhone | string | No | Business phone number |
| homePhone | string | No | Home phone number |
| mobPhone | string | No | Mobile phone number |
| fax | string | No | Fax number |
| note | string | No | Notes about the client |
| pStreet | string | No | Primary street address |
| pStreet2 | string | No | Primary street address line 2 |
| pCity | string | No | Primary city |
| pProvince | string | No | Primary province/state |
| pCode | string | No | Primary postal/zip code |
| pCountry | string | No | Primary country |
| sStreet | string | No | Secondary street address |
| sStreet2 | string | No | Secondary street address line 2 |
| sCity | string | No | Secondary city |
| sProvince | string | No | Secondary province/state |
| sCode | string | No | Secondary postal/zip code |
| sCountry | string | No | Secondary country |
| currencyCode | string | No | Currency code |
| language | string | No | Preferred language |
| vatNumber | string | No | VAT/tax identification number |
| vatName | string | No | VAT/tax name |
| allowLateFees | boolean | No | Whether to allow late fees |
| allowLateNotifications | boolean | No | Whether to send late payment notifications |
| visState | number | No | Visibility state (0=active, 1=deleted, 2=archived) |

### Input Example

```json
{
  "accountId": "ABC123",
  "clientId": 12345,
  "email": "john.doe@acmecorp.com",
  "mobPhone": "+1-555-0150",
  "note": "VIP client - priority support"
}
```

### Output Schema

Returns the updated Client object (see [client_list](#client-object) for schema).

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid clientId | No | Check ID is a positive integer |
| -32602 | Invalid email format | No | Use valid email format |
| -32005 | Client not found | No | Verify ID exists in FreshBooks |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [client_single](#client_single) - Get current values before update
- [client_delete](#client_delete) - Delete instead of update

---

## client_delete

Delete a client.

### Description

Delete a client from FreshBooks. This sets the visibility state to deleted (visState=1). The client can be restored by updating visState back to 0.

**When to use:**
- User wants to remove a client
- Cleaning up duplicate or test clients
- Archiving old clients

**Note:** This is a soft delete (sets visState=1). Data is preserved and can be restored.

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| clientId | number | Yes | Client ID to delete |

### Input Example

```json
{
  "accountId": "ABC123",
  "clientId": 12345
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Whether deletion was successful |
| clientId | number | ID of deleted client |

### Output Example

```json
{
  "success": true,
  "clientId": 12345
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid clientId | No | Check ID is a positive integer |
| -32005 | Client not found | No | Client may already be deleted |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [client_single](#client_single) - Verify client before deletion
- [client_update](#client_update) - Restore deleted client (set visState=0)
- [client_list](#client_list) - View remaining clients

---

## Notes

### Visibility States

Clients have three visibility states:
- `0` = Active (normal, visible)
- `1` = Deleted (hidden, can be restored)
- `2` = Archived (inactive but preserved)

### Required Fields

When creating a client, at least one of these must be provided:
- First name (`fName`)
- Last name (`lName`)
- Organization (`organization`)

### Currency Codes

Common currency codes:
- `USD` - US Dollar
- `CAD` - Canadian Dollar
- `EUR` - Euro
- `GBP` - British Pound
- See [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217) for complete list

### Phone Number Format

Phone numbers are stored as strings and can use any format. Consider using international format (e.g., `+1-555-0100`) for clarity.
