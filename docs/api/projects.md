# Project API Reference

Projects organize work and billing in FreshBooks. They can be associated with clients, have budgets and rates, and contain time entries and tasks.

## project_list

List projects from FreshBooks with optional filtering and pagination.

### Description

Retrieve a paginated list of projects with filtering options. Use this to find projects by client, status, or name.

**When to use:**
- User asks to see projects
- Finding project IDs for time tracking
- Reviewing active or completed projects
- Client-specific project lists

### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| accountId | string | Yes | - | FreshBooks account identifier |
| page | number | No | 1 | Page number (1-indexed) |
| perPage | number | No | 30 | Results per page (max 100) |
| clientId | string | No | - | Filter by client ID |
| active | boolean | No | - | Filter by active status |
| complete | boolean | No | - | Filter by completion status |
| internal | boolean | No | - | Filter by internal status |
| title | string | No | - | Filter by title (partial match) |

### Input Example

```json
{
  "accountId": "ABC123",
  "page": 1,
  "perPage": 25,
  "active": true,
  "complete": false
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| projects | Project[] | Array of project objects |
| pagination | Pagination | Pagination metadata |

#### Project Object

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | number | No | Unique project identifier |
| title | string | No | Project title/name |
| description | string | Yes | Project description |
| dueDate | string | Yes | Project due date (ISO 8601) |
| clientId | string | Yes | Associated client ID |
| internal | boolean | No | Whether project is internal (non-billable) |
| budget | string | Yes | Project budget amount |
| fixedPrice | string | Yes | Fixed price for flat-rate projects |
| rate | string | Yes | Hourly rate for time-based billing |
| billingMethod | string | Yes | How project is billed (see enum below) |
| projectType | string | No | Type of project (see enum below) |
| projectManagerId | string | Yes | Project manager user ID |
| active | boolean | No | Whether project is active |
| complete | boolean | No | Whether project is marked complete |
| sample | boolean | No | Whether project is a sample/demo |
| createdAt | string | No | Creation timestamp (ISO 8601) |
| updatedAt | string | No | Last update timestamp (ISO 8601) |
| loggedDuration | number | Yes | Total logged time in seconds |
| services | array | Yes | Associated services |
| billedAmount | number | No | Total billed amount |
| billedStatus | string | No | Billing status (see enum below) |
| retainerId | string | Yes | Associated retainer ID |
| expenseMarkup | number | No | Expense markup percentage |
| groupId | string | Yes | Project group ID |
| group | object | Yes | Project group details |

#### Enums

**Billing Method:**
- `project_rate` - Single rate for entire project
- `service_rate` - Rate per service type
- `flat_rate` - Fixed price project
- `team_member_rate` - Rate per team member

**Project Type:**
- `fixed_price` - Fixed price project
- `hourly_rate` - Hourly billing project

**Billed Status:**
- `unbilled` - No time billed yet
- `partial` - Some time billed
- `billed` - All time billed

### Output Example

```json
{
  "projects": [
    {
      "id": 42,
      "title": "Website Redesign",
      "description": "Complete overhaul of company website",
      "dueDate": "2024-12-31T23:59:59Z",
      "clientId": "100",
      "internal": false,
      "budget": "50000.00",
      "fixedPrice": null,
      "rate": "125.00",
      "billingMethod": "service_rate",
      "projectType": "hourly_rate",
      "projectManagerId": "5",
      "active": true,
      "complete": false,
      "sample": false,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-12-20T14:30:00Z",
      "loggedDuration": 144000,
      "services": [],
      "billedAmount": 4500.00,
      "billedStatus": "partial",
      "retainerId": null,
      "expenseMarkup": 10,
      "groupId": null,
      "group": null
    }
  ],
  "pagination": {
    "page": 1,
    "pages": 3,
    "total": 67,
    "perPage": 30
  }
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid accountId | No | Provide valid account ID |
| -32602 | perPage > 100 | No | Reduce perPage to 100 or less |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |
| -32004 | Rate limit exceeded | Yes | Wait and retry |

### Related Tools

- [project_single](#project_single) - Get details of specific project
- [project_create](#project_create) - Create new project
- [timeentry_list](./time-entries.md#timeentry_list) - View time logged on project

---

## project_single

Get a single project by ID.

### Description

Retrieve detailed information about a specific project, optionally including related data.

**When to use:**
- User asks for project details
- Verify project data before update
- Get project with related client/services/group data

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| projectId | number | Yes | Project ID to retrieve |
| includes | string[] | No | Related data to include: `client`, `services`, `group` |

### Input Example

```json
{
  "accountId": "ABC123",
  "projectId": 42,
  "includes": ["client", "services"]
}
```

### Output Schema

Returns a single Project object (see [project_list](#project-object) for schema).

### Output Example

```json
{
  "id": 42,
  "title": "Website Redesign",
  "description": "Complete overhaul of company website",
  "dueDate": "2024-12-31T23:59:59Z",
  "clientId": "100",
  "internal": false,
  "budget": "50000.00",
  "rate": "125.00",
  "billingMethod": "service_rate",
  "projectType": "hourly_rate",
  "active": true,
  "complete": false,
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-12-20T14:30:00Z",
  "loggedDuration": 144000,
  "billedAmount": 4500.00,
  "billedStatus": "partial"
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid projectId | No | Check ID is positive integer |
| -32005 | Project not found | No | Verify project exists |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [project_list](#project_list) - Find project IDs
- [project_update](#project_update) - Update this project
- [project_delete](#project_delete) - Delete this project

---

## project_create

Create a new project.

### Description

Create a new project in FreshBooks with specified details and billing configuration.

**When to use:**
- User wants to create new project
- Setting up billing for new client work
- Organizing work into projects

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| title | string | Yes | Project title/name |
| clientId | string | No | Associated client ID |
| description | string | No | Project description |
| dueDate | string | No | Project due date (ISO 8601) |
| budget | string | No | Project budget amount |
| fixedPrice | string | No | Fixed price amount |
| rate | string | No | Hourly rate |
| billingMethod | string | No | How project is billed |
| projectType | string | No | Type of project |
| internal | boolean | No | Whether project is internal |
| projectManagerId | string | No | Project manager user ID |

See [project_list](#enums) for enum values.

### Input Example

```json
{
  "accountId": "ABC123",
  "title": "Mobile App Development",
  "clientId": "100",
  "description": "iOS and Android mobile application",
  "dueDate": "2025-06-30T23:59:59Z",
  "budget": "75000.00",
  "rate": "150.00",
  "billingMethod": "service_rate",
  "projectType": "hourly_rate",
  "internal": false
}
```

### Output Schema

Returns the created Project object (see [project_list](#project-object) for schema).

### Output Example

```json
{
  "id": 43,
  "title": "Mobile App Development",
  "description": "iOS and Android mobile application",
  "dueDate": "2025-06-30T23:59:59Z",
  "clientId": "100",
  "internal": false,
  "budget": "75000.00",
  "rate": "150.00",
  "billingMethod": "service_rate",
  "projectType": "hourly_rate",
  "active": true,
  "complete": false,
  "sample": false,
  "createdAt": "2024-12-21T15:00:00Z",
  "updatedAt": "2024-12-21T15:00:00Z",
  "loggedDuration": 0,
  "billedAmount": 0,
  "billedStatus": "unbilled"
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Missing title | No | Provide project title |
| -32602 | Invalid enum value | No | Use valid billing method/project type |
| -32013 | Invalid clientId | Yes | Verify client exists |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [project_list](#project_list) - View created project
- [client_list](./clients.md#client_list) - Find client IDs
- [project_update](#project_update) - Update project later

---

## project_update

Update an existing project.

### Description

Modify fields of an existing project. All fields except accountId and projectId are optional.

**When to use:**
- User wants to update project details
- Changing project status (active, complete)
- Updating budget or rates
- Modifying project associations

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| projectId | number | Yes | Project ID to update |
| title | string | No | Project title/name |
| clientId | string | No | Associated client ID |
| description | string | No | Project description |
| dueDate | string | No | Project due date (ISO 8601) |
| budget | string | No | Project budget amount |
| fixedPrice | string | No | Fixed price amount |
| rate | string | No | Hourly rate |
| billingMethod | string | No | How project is billed |
| projectType | string | No | Type of project |
| internal | boolean | No | Whether project is internal |
| projectManagerId | string | No | Project manager user ID |
| active | boolean | No | Whether project is active |
| complete | boolean | No | Whether project is complete |

### Input Example

```json
{
  "accountId": "ABC123",
  "projectId": 43,
  "complete": true,
  "description": "iOS and Android mobile application - completed ahead of schedule"
}
```

### Output Schema

Returns the updated Project object (see [project_list](#project-object) for schema).

### Output Example

```json
{
  "id": 43,
  "title": "Mobile App Development",
  "description": "iOS and Android mobile application - completed ahead of schedule",
  "complete": true,
  "active": true,
  "updatedAt": "2024-12-21T16:00:00Z"
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid projectId | No | Check ID is positive integer |
| -32005 | Project not found | No | Verify project exists |
| -32013 | Invalid clientId | Yes | Verify client exists |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [project_single](#project_single) - Get current values
- [project_list](#project_list) - View updated project

---

## project_delete

Delete a project.

### Description

Permanently delete a project from FreshBooks. This action cannot be undone.

**When to use:**
- User wants to remove project
- Deleting test/sample projects
- Cleaning up incorrect entries

**Warning:** This permanently deletes the project. Associated time entries are NOT deleted but lose their project association.

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| projectId | number | Yes | Project ID to delete |

### Input Example

```json
{
  "accountId": "ABC123",
  "projectId": 43
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Whether deletion was successful |
| projectId | number | ID of deleted project |

### Output Example

```json
{
  "success": true,
  "projectId": 43
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid projectId | No | Check ID is positive integer |
| -32005 | Project not found | No | Project may already be deleted |
| -32007 | Project has billed time | No | Cannot delete projects with billed entries |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [project_single](#project_single) - Verify before deletion
- [project_update](#project_update) - Mark inactive instead of deleting
- [project_list](#project_list) - View remaining projects

---

## Notes

### Project Types

**Fixed Price Projects:**
- Set `projectType: "fixed_price"`
- Set `fixedPrice` amount
- Use `billingMethod: "flat_rate"`

**Hourly Projects:**
- Set `projectType: "hourly_rate"`
- Set hourly `rate`
- Use `billingMethod: "service_rate"` or `"project_rate"`

### Billing Methods

- **project_rate**: One rate for all work on project
- **service_rate**: Different rates per service type
- **flat_rate**: Fixed price regardless of time
- **team_member_rate**: Different rates per team member

### Internal Projects

Internal projects (`internal: true`):
- Non-billable work
- Company overhead
- Training/learning
- Not invoiced to clients

### Logged Duration

The `loggedDuration` field:
- Sum of all time entries on project
- In seconds (divide by 3600 for hours)
- Read-only, calculated by FreshBooks
- Updated when time entries added/modified

### Project Status

**Active vs Complete:**
- `active: true` - Project accepting new time
- `active: false` - Project archived/inactive
- `complete: true` - Work finished
- Projects can be active and complete simultaneously
