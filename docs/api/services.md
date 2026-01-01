# Service API Reference

Services are billable service types that can be assigned to time entries. They define what kind of work is being performed and can have associated billing rates.

**Important:** Services are immutable once created. To change a service, archive it (`visState: 1`) and create a new one.

## service_list

List available services from FreshBooks.

### Description

Retrieve a paginated list of services. Services define the types of billable work available for time tracking.

**When to use:**
- User asks to see available services
- Finding service IDs for time tracking
- Reviewing billable service types

### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| businessId | number | Yes | - | FreshBooks business identifier |
| page | number | No | 1 | Page number (1-indexed) |
| perPage | number | No | 30 | Results per page (max 100) |

### Input Example

```json
{
  "businessId": 123456,
  "page": 1,
  "perPage": 50
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| services | Service[] | Array of service objects |
| pagination | Pagination | Pagination metadata |

#### Service Object

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | number | No | Unique service identifier |
| businessId | number | No | Associated business ID |
| name | string | No | Service name |
| billable | boolean | No | Whether service is billable |
| visState | number | Yes | Visibility state (0=active, 1=deleted, 2=archived) |

### Output Example

```json
{
  "services": [
    {
      "id": 5,
      "businessId": 123456,
      "name": "Software Development",
      "billable": true,
      "visState": 0
    },
    {
      "id": 6,
      "businessId": 123456,
      "name": "Code Review",
      "billable": true,
      "visState": 0
    },
    {
      "id": 7,
      "businessId": 123456,
      "name": "Internal Meeting",
      "billable": false,
      "visState": 0
    }
  ],
  "pagination": {
    "page": 1,
    "pages": 1,
    "total": 3,
    "perPage": 30
  }
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid businessId | No | Provide valid business ID |
| -32602 | perPage > 100 | No | Reduce perPage to 100 or less |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [service_single](#service_single) - Get service details
- [service_create](#service_create) - Create new service
- [service_rate_get](#service_rate_get) - Get service rate

---

## service_single

Get a single service by ID.

### Description

Retrieve detailed information about a specific service.

**When to use:**
- User asks for service details
- Verify service before using in time entries
- Check service rate and billable status

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| businessId | number | Yes | FreshBooks business identifier |
| serviceId | number | Yes | Service ID to retrieve |

### Input Example

```json
{
  "businessId": 123456,
  "serviceId": 5
}
```

### Output Schema

Returns a single Service object (see [service_list](#service-object) for schema).

### Output Example

```json
{
  "id": 5,
  "businessId": 123456,
  "name": "Software Development",
  "billable": true,
  "visState": 0
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid serviceId | No | Check ID is positive integer |
| -32005 | Service not found | No | Verify service exists |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [service_list](#service_list) - Find service IDs
- [service_rate_get](#service_rate_get) - Get billing rate
- [timeentry_create](./time-entries.md#timeentry_create) - Use service in time entry

---

## service_create

Create a new service.

### Description

Create a new billable service type. Once created, services are immutable - they cannot be updated. To "change" a service, archive it and create a new one.

**When to use:**
- User needs new billable service type
- Adding service categories for time tracking
- Creating specialized billing categories

**Important:** Services cannot be updated after creation. Plan the name and billable status carefully.

### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| businessId | number | Yes | - | FreshBooks business identifier |
| name | string | Yes | - | Service name (required) |
| billable | boolean | No | true | Whether service is billable |

### Input Example

```json
{
  "businessId": 123456,
  "name": "API Integration",
  "billable": true
}
```

### Output Schema

Returns the created Service object (see [service_list](#service-object) for schema).

### Output Example

```json
{
  "id": 8,
  "businessId": 123456,
  "name": "API Integration",
  "billable": true,
  "visState": 0
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Missing name | No | Provide service name |
| -32602 | Empty name | No | Name must be at least 1 character |
| -32007 | Duplicate name | Yes | Use different name or archive existing |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [service_list](#service_list) - View created service
- [service_rate_set](#service_rate_set) - Set billing rate for service
- [timeentry_create](./time-entries.md#timeentry_create) - Use in time entries

---

## service_rate_get

Get the billing rate for a service.

### Description

Retrieve the current billing rate configuration for a service. Services can have different rates for different contexts.

**When to use:**
- User asks for service billing rate
- Checking rates before time entry
- Reviewing service pricing

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| businessId | number | Yes | FreshBooks business identifier |
| serviceId | number | Yes | Service ID to get rate for |

### Input Example

```json
{
  "businessId": 123456,
  "serviceId": 5
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| rate | string | Rate amount as decimal string |
| code | string | Currency code (e.g., USD) |

### Output Example

```json
{
  "rate": "150.00",
  "code": "USD"
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid serviceId | No | Check ID is positive integer |
| -32005 | Service not found | No | Verify service exists |
| -32005 | No rate set | Yes | Use service_rate_set to create rate |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [service_single](#service_single) - Get service details
- [service_rate_set](#service_rate_set) - Set or update rate
- [service_list](#service_list) - Find service IDs

---

## service_rate_set

Set or update the billing rate for a service.

### Description

Create or update the billing rate for a service. This defines how much to charge per hour (or unit) when this service is used in time tracking.

**When to use:**
- User wants to set service billing rate
- Updating rates for new pricing
- Configuring service for first time

**Note:** While services themselves are immutable, rates can be updated.

### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| businessId | number | Yes | - | FreshBooks business identifier |
| serviceId | number | Yes | - | Service ID to set rate for |
| rate | string | Yes | - | Rate amount as decimal string (e.g., "150.00") |
| code | string | No | USD | Currency code (e.g., USD, CAD, EUR) |

### Input Example

```json
{
  "businessId": 123456,
  "serviceId": 5,
  "rate": "175.00",
  "code": "USD"
}
```

### Output Schema

Returns the updated rate configuration.

| Field | Type | Description |
|-------|------|-------------|
| rate | string | Rate amount as decimal string |
| code | string | Currency code |

### Output Example

```json
{
  "rate": "175.00",
  "code": "USD"
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid serviceId | No | Check ID is positive integer |
| -32602 | Invalid rate format | No | Use decimal string (e.g., "150.00") |
| -32602 | Negative rate | No | Provide positive rate amount |
| -32005 | Service not found | No | Verify service exists |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Usage Notes

**Rate Format:**
- Use string format: `"150.00"` (not number)
- Include decimal places: `"150.00"` not `"150"`
- Maximum precision: 2 decimal places

**Currency Codes:**
- Use ISO 4217 codes (USD, CAD, EUR, GBP, etc.)
- Must match business/account currency settings
- Cannot mix currencies within same business

**Updating Rates:**
- Existing rate is replaced with new rate
- Change takes effect immediately
- Does NOT affect existing time entries (they keep original rate)
- Only affects new time entries using this service

### Related Tools

- [service_rate_get](#service_rate_get) - Get current rate
- [service_single](#service_single) - Get service details
- [timeentry_create](./time-entries.md#timeentry_create) - Use service with rate

---

## Notes

### Service Immutability

Services cannot be updated after creation. This is a FreshBooks API limitation.

**To "change" a service:**
1. Archive the old service: Set `visState: 1` (not available via update - contact FreshBooks)
2. Create new service with corrected name/settings
3. Update time entries to use new service ID

**What CAN'T be changed:**
- Service name
- Billable status
- Business ID

**What CAN be changed:**
- Billing rate (via service_rate_set)
- Visibility state (archive/delete)

### Visibility States (visState)

- **0 (active)**: Service is active and visible
- **1 (deleted)**: Service is soft-deleted (hidden)
- **2 (archived)**: Service is archived

Deleted/archived services don't appear in service lists but existing time entries retain the association.

### Billable vs Non-Billable

**Billable Services (billable: true):**
- Can be invoiced to clients
- Typically have billing rates
- Count toward project billing
- Examples: Development, Consulting, Design

**Non-Billable Services (billable: false):**
- Internal work, not invoiced
- No billing rate needed
- Don't count toward client billing
- Examples: Internal Meetings, Training, Admin

### Rate Sub-Resource

Service rates are managed through a separate sub-resource:
- Services created without rates initially
- Use `service_rate_set` to add/update rates
- Use `service_rate_get` to retrieve rates
- Rates are per-service, not global

### Service vs Task

**Services:** Types of work (Development, Design, Consulting)
**Tasks:** Specific activities within projects (Login Feature, Homepage Redesign)

Services are reusable across all projects. Tasks are project-specific.

### Finding Business ID

Business ID is different from Account ID:
- **Account ID**: OAuth account identifier
- **Business ID**: Numeric business identifier

Get business ID from:
1. FreshBooks account settings
2. First service/task/project response
3. Identity endpoint

### Common Use Cases

**Create billable service with rate:**
```json
1. service_create({ businessId, name: "Consulting", billable: true })
   → Returns { id: 10, ... }

2. service_rate_set({ businessId, serviceId: 10, rate: "200.00" })
   → Returns { rate: "200.00", code: "USD" }
```

**Create non-billable service:**
```json
service_create({
  businessId,
  name: "Internal Meeting",
  billable: false
})
```

**Use service in time tracking:**
```json
timeentry_create({
  accountId,
  duration: 7200,
  serviceId: 10,
  note: "Client consultation"
})
```
