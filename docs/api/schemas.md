# Schema Reference

Complete schema definitions for all data types used in the FreshBooks MCP server. All schemas are defined using Zod for runtime validation and TypeScript type safety.

## Common Schemas

### AccountId

Account identifier used across all authenticated tools.

```typescript
z.object({
  accountId: z.string().describe("FreshBooks account identifier")
})
```

**Usage:** Required for all tools except authentication tools.

**Example:**
```json
{
  "accountId": "ABC123"
}
```

---

### BusinessId

Business identifier used for business-scoped resources (services, tasks).

```typescript
z.object({
  businessId: z.number().describe("FreshBooks business identifier")
})
```

**Note:** Business ID is numeric, different from Account ID (string).

**Example:**
```json
{
  "businessId": 123456
}
```

---

### Pagination Input

Standard pagination parameters for list operations.

```typescript
z.object({
  page: z.number()
    .int()
    .min(1)
    .default(1)
    .optional()
    .describe("Page number (1-indexed)"),
  perPage: z.number()
    .int()
    .min(1)
    .max(100)
    .default(30)
    .optional()
    .describe("Results per page (max 100)")
})
```

**Defaults:**
- `page`: 1
- `perPage`: 30

**Limits:**
- Maximum `perPage`: 100
- Minimum `page`: 1

**Example:**
```json
{
  "page": 2,
  "perPage": 50
}
```

---

### Pagination Output

Pagination metadata returned in list responses.

```typescript
z.object({
  page: z.number().describe("Current page number"),
  pages: z.number().describe("Total number of pages"),
  total: z.number().describe("Total number of results"),
  perPage: z.number().describe("Results per page")
})
```

**Example:**
```json
{
  "page": 2,
  "pages": 10,
  "total": 287,
  "perPage": 30
}
```

---

### Money

Monetary amount with currency code.

```typescript
z.object({
  amount: z.string().describe("Decimal amount as string (e.g., '150.00')"),
  code: z.string().describe("Currency code (e.g., 'USD', 'CAD', 'EUR')")
})
```

**Format:**
- Amount is a **string** (not number)
- Use 2 decimal places: `"150.00"` not `"150"`
- Currency code is ISO 4217 (USD, CAD, EUR, GBP, etc.)

**Example:**
```json
{
  "amount": "1250.50",
  "code": "USD"
}
```

---

### VisState

Visibility/archive state for resources.

```typescript
z.number().describe("Visibility state")
```

**Values:**
- **0**: Active (visible and usable)
- **1**: Deleted (soft-deleted, hidden)
- **2**: Archived (archived, hidden)

**Example:**
```json
{
  "visState": 0
}
```

---

## Entity Schemas

### TimeEntry

Complete time entry with all fields.

```typescript
z.object({
  id: z.number().optional(),
  identityId: z.number().optional(),
  isLogged: z.boolean(),
  startedAt: z.string().datetime(),
  createdAt: z.string().datetime().optional(),
  clientId: z.number().nullable().optional(),
  projectId: z.number().nullable().optional(),
  pendingClient: z.string().nullable().optional(),
  pendingProject: z.string().nullable().optional(),
  pendingTask: z.string().nullable().optional(),
  taskId: z.number().nullable().optional(),
  serviceId: z.number().nullable().optional(),
  note: z.string().nullable().optional(),
  active: z.boolean().optional(),
  billable: z.boolean().optional(),
  billed: z.boolean().optional(),
  internal: z.boolean().optional(),
  retainerId: z.number().nullable().optional(),
  duration: z.number(),
  timer: TimerSchema.nullable().optional()
})
```

**Required Fields:**
- `isLogged`: Whether time is logged
- `startedAt`: When entry began (ISO 8601)
- `duration`: Duration in seconds

**Key Fields:**
- `active`: true for running timers
- `billable`: Can be billed to client
- `billed`: Already billed on invoice
- `duration`: Time in seconds (0 for active timers)

**Example:**
```json
{
  "id": 12345,
  "duration": 7200,
  "note": "Feature development",
  "isLogged": true,
  "startedAt": "2024-12-21T09:00:00Z",
  "projectId": 42,
  "clientId": 100,
  "active": false,
  "billable": true,
  "billed": false
}
```

---

### Timer

Active timer embedded in TimeEntry.

```typescript
z.object({
  id: z.number().optional(),
  isRunning: z.boolean().nullable().optional()
})
```

**Note:** Timer is not a standalone resource. It's embedded in TimeEntry when `active: true`.

**Example:**
```json
{
  "id": 9876,
  "isRunning": true
}
```

---

### Project

Project for organizing work and billing.

```typescript
z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  clientId: z.string().nullable().optional(),
  internal: z.boolean(),
  budget: z.string().nullable().optional(),
  fixedPrice: z.string().nullable().optional(),
  rate: z.string().nullable().optional(),
  billingMethod: z.enum([
    "project_rate",
    "service_rate",
    "flat_rate",
    "team_member_rate"
  ]).nullable().optional(),
  projectType: z.enum([
    "fixed_price",
    "hourly_rate"
  ]),
  projectManagerId: z.string().nullable().optional(),
  active: z.boolean(),
  complete: z.boolean(),
  sample: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  loggedDuration: z.number().nullable().optional(),
  services: z.array(z.any()).nullable().optional(),
  billedAmount: z.number(),
  billedStatus: z.enum([
    "unbilled",
    "partial",
    "billed"
  ]),
  retainerId: z.string().nullable().optional(),
  expenseMarkup: z.number(),
  groupId: z.string().nullable().optional(),
  group: z.any().nullable().optional()
})
```

**Enums:**

**BillingMethod:**
- `project_rate`: Single rate for entire project
- `service_rate`: Rate per service type
- `flat_rate`: Fixed price project
- `team_member_rate`: Rate per team member

**ProjectType:**
- `fixed_price`: Fixed price billing
- `hourly_rate`: Hourly billing

**BilledStatus:**
- `unbilled`: No time billed yet
- `partial`: Some time billed
- `billed`: All time billed

**Example:**
```json
{
  "id": 42,
  "title": "Website Redesign",
  "description": "Complete site overhaul",
  "clientId": "100",
  "projectType": "hourly_rate",
  "billingMethod": "service_rate",
  "rate": "125.00",
  "active": true,
  "complete": false,
  "loggedDuration": 144000,
  "billedStatus": "partial"
}
```

---

### Service

Billable service types for time entries.

```typescript
z.object({
  id: z.number(),
  businessId: z.number(),
  name: z.string(),
  billable: z.boolean(),
  visState: z.number().optional()
})
```

**Note:** Services are **immutable** once created. To change, archive and create new.

**Example:**
```json
{
  "id": 5,
  "businessId": 123456,
  "name": "Software Development",
  "billable": true,
  "visState": 0
}
```

---

### Task

Project tasks for detailed time tracking.

```typescript
z.object({
  id: z.number().optional(),
  taskid: z.number().optional(),
  name: z.string().nullable().optional(),
  tname: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  tdesc: z.string().nullable().optional(),
  billable: z.boolean().optional(),
  rate: MoneySchema.optional(),
  visState: z.number().optional(),
  updated: z.string().datetime().optional()
})
```

**Alternate Fields:**
- `id` / `taskid` - Both represent task ID
- `name` / `tname` - Both represent task name
- `description` / `tdesc` - Both represent description

**Example:**
```json
{
  "id": 100,
  "name": "Frontend Development",
  "description": "React component work",
  "billable": true,
  "rate": {
    "amount": "150.00",
    "code": "USD"
  },
  "visState": 0
}
```

---

## Tool Input Schemas

### TimeEntry Create

```typescript
z.object({
  accountId: z.string(),
  duration: z.number().min(0),
  isLogged: z.boolean().default(true),
  startedAt: z.string().datetime().optional(),
  note: z.string().optional(),
  projectId: z.number().optional(),
  clientId: z.number().optional(),
  serviceId: z.number().optional(),
  taskId: z.number().optional(),
  billable: z.boolean().optional(),
  active: z.boolean().default(false),
  internal: z.boolean().optional(),
  retainerId: z.number().optional()
})
```

**Required:** `accountId`, `duration`

**Defaults:**
- `isLogged`: true
- `active`: false
- `startedAt`: Current time if not provided

---

### TimeEntry Update

```typescript
z.object({
  accountId: z.string(),
  timeEntryId: z.number(),
  duration: z.number().min(0).optional(),
  isLogged: z.boolean().optional(),
  startedAt: z.string().datetime().optional(),
  note: z.string().optional(),
  projectId: z.number().nullable().optional(),
  clientId: z.number().nullable().optional(),
  serviceId: z.number().nullable().optional(),
  taskId: z.number().nullable().optional(),
  billable: z.boolean().optional(),
  active: z.boolean().optional(),
  internal: z.boolean().optional(),
  retainerId: z.number().nullable().optional()
})
```

**Required:** `accountId`, `timeEntryId`

**Optional:** All other fields (only provided fields updated)

---

### TimeEntry List

```typescript
z.object({
  accountId: z.string(),
  page: z.number().int().min(1).default(1).optional(),
  perPage: z.number().int().min(1).max(100).default(30).optional(),
  projectId: z.number().optional(),
  clientId: z.number().optional(),
  taskId: z.number().optional(),
  serviceId: z.number().optional(),
  active: z.boolean().optional(),
  billable: z.boolean().optional(),
  billed: z.boolean().optional(),
  startedAfter: z.string().datetime().optional(),
  startedBefore: z.string().datetime().optional()
})
```

**Required:** `accountId`

**Filters:** All filter parameters are optional

---

### Timer Start

```typescript
z.object({
  accountId: z.string(),
  projectId: z.number().optional(),
  clientId: z.number().optional(),
  serviceId: z.number().optional(),
  taskId: z.number().optional(),
  note: z.string().optional(),
  billable: z.boolean().optional().default(true),
  internal: z.boolean().optional().default(false)
})
```

**Required:** `accountId`

**Defaults:**
- `billable`: true
- `internal`: false

---

### Timer Stop

```typescript
z.object({
  accountId: z.string(),
  timeEntryId: z.number(),
  note: z.string().optional()
})
```

**Required:** `accountId`, `timeEntryId`

**Optional:** `note` (can update note when stopping)

---

### Project Create

```typescript
z.object({
  accountId: z.string(),
  title: z.string(),
  clientId: z.string().optional(),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  budget: z.string().optional(),
  fixedPrice: z.string().optional(),
  rate: z.string().optional(),
  billingMethod: z.enum([
    "project_rate",
    "service_rate",
    "flat_rate",
    "team_member_rate"
  ]).optional(),
  projectType: z.enum([
    "fixed_price",
    "hourly_rate"
  ]).optional(),
  internal: z.boolean().optional(),
  projectManagerId: z.string().optional()
})
```

**Required:** `accountId`, `title`

---

### Service Create

```typescript
z.object({
  businessId: z.number(),
  name: z.string(),
  billable: z.boolean().optional().default(true)
})
```

**Required:** `businessId`, `name`

**Default:** `billable: true`

---

### Task Create

```typescript
z.object({
  businessId: z.number(),
  name: z.string(),
  description: z.string().optional(),
  billable: z.boolean().optional().default(true),
  rate: z.object({
    amount: z.string(),
    code: z.string().default("USD")
  }).optional()
})
```

**Required:** `businessId`, `name`

**Default:** `billable: true`

---

## Validation Rules

### Date Format

All dates must be in ISO 8601 format with timezone:

```
YYYY-MM-DDTHH:mm:ssZ
```

**Valid:**
- `2024-12-21T09:00:00Z` (UTC)
- `2024-12-21T09:00:00-05:00` (EST)
- `2024-12-21T09:00:00+01:00` (CET)

**Invalid:**
- `2024-12-21` (missing time)
- `2024-12-21 09:00:00` (space instead of T)
- `12/21/2024` (wrong format)

---

### Duration

Duration is always in **seconds**:

- 1 minute = 60 seconds
- 15 minutes = 900 seconds
- 1 hour = 3600 seconds
- 8 hours = 28800 seconds

**Rules:**
- Must be >= 0
- Integer only (no decimal seconds)
- For active timers, use `duration: 0`

---

### IDs

All IDs must be positive integers:

```typescript
z.number().int().positive()
```

**Valid:** 1, 42, 12345

**Invalid:** 0, -1, 3.14, "123"

---

### Account ID

Account ID is a **string** (not number):

```typescript
z.string().min(1)
```

**Valid:** "ABC123", "account_456"

**Invalid:** "", null, 123

---

### Business ID

Business ID is a **number** (not string):

```typescript
z.number().int().positive()
```

**Valid:** 123456, 789012

**Invalid:** "123456", 0, -1

---

## Field Nullability

### Nullable vs Optional

**Optional (`.optional()`):**
- Field may be omitted from request/response
- Use when field is not always present

**Nullable (`.nullable()`):**
- Field is present but value may be null
- Use when field can be explicitly cleared

**Both (`.nullable().optional()`):**
- Field may be omitted OR may be null
- Common for updateable associations

**Example:**
```typescript
// Optional - can omit entirely
note: z.string().optional()

// Nullable - must provide, can be null
clientId: z.number().nullable()

// Both - can omit or explicitly null
projectId: z.number().nullable().optional()
```

---

## Type Coercion

Zod schemas perform validation **without** type coercion by default.

**Numbers:**
- Input: `"123"` → Error (expected number)
- Input: `123` → Valid

**Booleans:**
- Input: `"true"` → Error (expected boolean)
- Input: `true` → Valid

**Dates:**
- Input: `"2024-12-21T09:00:00Z"` → Valid (ISO 8601 string)
- Input: `new Date()` → Error (expected string)

---

## Common Patterns

### List Response Pattern

All list operations return:

```typescript
z.object({
  [entityName]: z.array(EntitySchema),
  pagination: PaginationSchema
})
```

**Example:**
```typescript
// timeentry_list output
z.object({
  timeEntries: z.array(TimeEntrySchema),
  pagination: PaginationSchema
})

// project_list output
z.object({
  projects: z.array(ProjectSchema),
  pagination: PaginationSchema
})
```

---

### Delete Response Pattern

All delete operations return:

```typescript
z.object({
  success: z.boolean(),
  message: z.string(),
  [entityId]: z.number()
})
```

**Example:**
```typescript
// timeentry_delete output
z.object({
  success: z.boolean(),
  message: z.string(),
  timeEntryId: z.number()
})
```

---

### Filter Pattern

List operations support optional filters:

```typescript
z.object({
  accountId: z.string(),
  // Pagination
  page: z.number().optional(),
  perPage: z.number().optional(),
  // Entity-specific filters
  projectId: z.number().optional(),
  active: z.boolean().optional(),
  startedAfter: z.string().datetime().optional()
})
```

---

## Schema Usage Examples

### Creating with Partial Data

```typescript
// Create time entry with minimal fields
{
  "accountId": "ABC123",
  "duration": 7200
}

// Defaults applied:
{
  "accountId": "ABC123",
  "duration": 7200,
  "isLogged": true,      // default
  "active": false,       // default
  "startedAt": "<now>"   // generated
}
```

---

### Updating with Nulls

```typescript
// Clear project association
{
  "accountId": "ABC123",
  "timeEntryId": 12345,
  "projectId": null
}

// Only projectId is updated, other fields unchanged
```

---

### Filtering Lists

```typescript
// Filter by multiple criteria
{
  "accountId": "ABC123",
  "projectId": 42,
  "billable": true,
  "startedAfter": "2024-12-01T00:00:00Z",
  "startedBefore": "2024-12-31T23:59:59Z"
}
```

---

## Schema Versioning

Current schema version: **1.0.0**

Schema changes follow semantic versioning:
- **Major**: Breaking changes (require updates)
- **Minor**: New optional fields (backward compatible)
- **Patch**: Documentation/clarification only

---

## Zod Schema to TypeScript

All schemas can be converted to TypeScript types:

```typescript
import { z } from 'zod';
import { TimeEntrySchema } from './schemas';

// Infer TypeScript type from Zod schema
type TimeEntry = z.infer<typeof TimeEntrySchema>;

// Use in TypeScript code
const entry: TimeEntry = {
  id: 12345,
  duration: 7200,
  isLogged: true,
  startedAt: "2024-12-21T09:00:00Z",
  // ... other fields
};
```

---

## Validation Error Format

When validation fails, Zod returns detailed errors:

```json
{
  "code": -32602,
  "message": "Invalid method parameters",
  "data": {
    "validationErrors": [
      {
        "path": "duration",
        "message": "Number must be greater than or equal to 0",
        "code": "too_small",
        "expected": "0",
        "received": "-100"
      },
      {
        "path": "startedAt",
        "message": "Invalid datetime string",
        "code": "invalid_string",
        "expected": "ISO 8601 datetime",
        "received": "2024-12-21"
      }
    ]
  }
}
```

Each validation error includes:
- `path`: Field that failed validation
- `message`: Human-readable error
- `code`: Zod error code
- `expected`: What was expected
- `received`: What was provided

---

## Related Documentation

- [Time Entry API](./time-entries.md) - TimeEntry tool reference
- [Timer API](./timers.md) - Timer tool reference
- [Project API](./projects.md) - Project tool reference
- [Service API](./services.md) - Service tool reference
- [Task API](./tasks.md) - Task tool reference
- [Error Reference](./errors.md) - Error codes and handling
