# Time Entry API Reference

Time entries represent completed or logged time in FreshBooks. They track billable and non-billable work with associated projects, clients, services, and tasks.

## timeentry_list

List time entries from FreshBooks with optional filtering and pagination.

### Description

Retrieve a paginated list of time entries with powerful filtering options. Use this to find time entries by project, client, date range, billing status, or to find active timers.

**When to use:**
- User asks to see their time entries, logged hours, or time tracking history
- User wants to review time for a specific project or client
- User needs to find entries within a date range
- User wants to see active/running timers

### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| accountId | string | Yes | - | FreshBooks account identifier |
| page | number | No | 1 | Page number (1-indexed) |
| perPage | number | No | 30 | Results per page (max 100) |
| projectId | number | No | - | Filter by project ID |
| clientId | number | No | - | Filter by client ID |
| taskId | number | No | - | Filter by task ID |
| serviceId | number | No | - | Filter by service ID |
| active | boolean | No | - | Filter by active status (true = running timers) |
| billable | boolean | No | - | Filter by billable status |
| billed | boolean | No | - | Filter by whether already billed |
| startedAfter | string | No | - | Filter entries after date (ISO 8601) |
| startedBefore | string | No | - | Filter entries before date (ISO 8601) |

### Input Example

```json
{
  "accountId": "ABC123",
  "page": 1,
  "perPage": 25,
  "projectId": 42,
  "billable": true,
  "startedAfter": "2024-12-01T00:00:00Z",
  "startedBefore": "2024-12-31T23:59:59Z"
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| timeEntries | TimeEntry[] | Array of time entry objects |
| pagination | Pagination | Pagination metadata |

#### TimeEntry Object

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | number | No | Unique identifier |
| identityId | number | Yes | Associated identity reference |
| duration | number | No | Duration in seconds |
| note | string | Yes | Description of work performed |
| isLogged | boolean | No | Whether time was logged |
| startedAt | string | No | Start timestamp (ISO 8601) |
| createdAt | string | Yes | Creation timestamp (ISO 8601) |
| projectId | number | Yes | Associated project ID |
| clientId | number | Yes | Associated client ID |
| serviceId | number | Yes | Associated service ID |
| taskId | number | Yes | Associated task ID |
| pendingClient | string | Yes | Unconfirmed client name |
| pendingProject | string | Yes | Unconfirmed project name |
| pendingTask | string | Yes | Unconfirmed task name |
| active | boolean | Yes | Whether entry is an active timer |
| billable | boolean | Yes | Whether entry is billable |
| billed | boolean | Yes | Whether entry has been billed |
| internal | boolean | Yes | Whether entry is internal work |
| retainerId | number | Yes | Associated retainer ID |
| timer | Timer | Yes | Active timer object if present |

#### Timer Object

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | number | Yes | Timer identifier |
| isRunning | boolean | Yes | Whether timer is running |

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
  "timeEntries": [
    {
      "id": 12345,
      "identityId": 1,
      "duration": 7200,
      "note": "Code review for feature branch",
      "isLogged": true,
      "startedAt": "2024-12-15T09:00:00Z",
      "createdAt": "2024-12-15T11:00:00Z",
      "projectId": 42,
      "clientId": 100,
      "serviceId": 5,
      "taskId": null,
      "pendingClient": null,
      "pendingProject": null,
      "pendingTask": null,
      "active": false,
      "billable": true,
      "billed": false,
      "internal": false,
      "retainerId": null,
      "timer": null
    }
  ],
  "pagination": {
    "page": 1,
    "pages": 5,
    "total": 142,
    "perPage": 30
  }
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid accountId format | No | Check account ID is valid |
| -32602 | Invalid date format | No | Use ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ) |
| -32602 | perPage > 100 | No | Reduce perPage value to 100 or less |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |
| -32002 | Token expired | Yes | Token auto-refreshes, retry request |
| -32004 | Rate limit exceeded | Yes | Wait and retry after delay |

### Related Tools

- [timeentry_single](#timeentry_single) - Get single entry by ID
- [timeentry_create](#timeentry_create) - Create new entry
- [timer_current](./timers.md#timer_current) - Get active timers (use `active: true` filter)
- [project_list](./projects.md#project_list) - Find project IDs
- [client_list](./clients.md#client_list) - Find client IDs

---

## timeentry_single

Get a single time entry by ID.

### Description

Retrieve detailed information about a specific time entry.

**When to use:**
- User asks for details about a specific time entry
- Need to verify time entry data before update/delete
- Retrieve full details after creation

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| timeEntryId | number | Yes | Time entry ID to retrieve |

### Input Example

```json
{
  "accountId": "ABC123",
  "timeEntryId": 12345
}
```

### Output Schema

Returns a single TimeEntry object (see [timeentry_list](#timeentry-object) for schema).

### Output Example

```json
{
  "id": 12345,
  "identityId": 1,
  "duration": 7200,
  "note": "Code review for feature branch",
  "isLogged": true,
  "startedAt": "2024-12-15T09:00:00Z",
  "createdAt": "2024-12-15T11:00:00Z",
  "projectId": 42,
  "clientId": 100,
  "serviceId": 5,
  "taskId": null,
  "pendingClient": null,
  "pendingProject": null,
  "pendingTask": null,
  "active": false,
  "billable": true,
  "billed": false,
  "internal": false,
  "retainerId": null,
  "timer": null
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid timeEntryId | No | Check ID is a positive integer |
| -32005 | Time entry not found | No | Verify ID exists in FreshBooks |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [timeentry_list](#timeentry_list) - Find time entry IDs
- [timeentry_update](#timeentry_update) - Update this entry
- [timeentry_delete](#timeentry_delete) - Delete this entry

---

## timeentry_create

Create a new time entry.

### Description

Create a completed time entry with specified duration and details. For starting an active timer, use [timer_start](./timers.md#timer_start) instead.

**When to use:**
- User wants to log completed time retroactively
- Recording time that was tracked manually
- Bulk time entry creation

### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| accountId | string | Yes | - | FreshBooks account identifier |
| duration | number | Yes | - | Duration in seconds (0 for active timer) |
| isLogged | boolean | No | true | Whether time is logged (false for timer) |
| startedAt | string | No | now | Start time (ISO 8601) |
| note | string | No | - | Description of work performed |
| projectId | number | No | - | Associated project ID |
| clientId | number | No | - | Associated client ID |
| serviceId | number | No | - | Associated service ID |
| taskId | number | No | - | Associated task ID |
| billable | boolean | No | - | Whether time is billable |
| active | boolean | No | false | Whether this is an active timer |
| internal | boolean | No | - | Whether this is internal work |
| retainerId | number | No | - | Associated retainer ID |

### Input Example

```json
{
  "accountId": "ABC123",
  "duration": 7200,
  "isLogged": true,
  "startedAt": "2024-12-15T09:00:00Z",
  "note": "Code review for feature branch",
  "projectId": 42,
  "clientId": 100,
  "serviceId": 5,
  "billable": true,
  "internal": false
}
```

### Output Schema

Returns the created TimeEntry object (see [timeentry_list](#timeentry-object) for schema).

### Output Example

```json
{
  "id": 12345,
  "identityId": 1,
  "duration": 7200,
  "note": "Code review for feature branch",
  "isLogged": true,
  "startedAt": "2024-12-15T09:00:00Z",
  "createdAt": "2024-12-15T11:03:22Z",
  "projectId": 42,
  "clientId": 100,
  "serviceId": 5,
  "taskId": null,
  "pendingClient": null,
  "pendingProject": null,
  "pendingTask": null,
  "active": false,
  "billable": true,
  "billed": false,
  "internal": false,
  "retainerId": null,
  "timer": null
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid duration (negative) | No | Provide positive duration in seconds |
| -32602 | Invalid startedAt format | No | Use ISO 8601 format |
| -32013 | Invalid project/client/service ID | Yes | Verify IDs exist in FreshBooks |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [timer_start](./timers.md#timer_start) - Start active timer instead
- [timeentry_list](#timeentry_list) - View created entries
- [project_list](./projects.md#project_list) - Find project IDs
- [service_list](./services.md#service_list) - Find service IDs

---

## timeentry_update

Update an existing time entry.

### Description

Modify fields of an existing time entry. All fields except accountId and timeEntryId are optional - only provided fields will be updated.

**When to use:**
- User wants to correct time entry details
- Update description/note after logging time
- Change billable status or associations
- Stop an active timer (set active=false)

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| timeEntryId | number | Yes | Time entry ID to update |
| duration | number | No | Duration in seconds |
| isLogged | boolean | No | Whether time is logged |
| startedAt | string | No | Start time (ISO 8601) |
| note | string | No | Description of work performed |
| projectId | number | No | Associated project ID (null to clear) |
| clientId | number | No | Associated client ID (null to clear) |
| serviceId | number | No | Associated service ID (null to clear) |
| taskId | number | No | Associated task ID (null to clear) |
| billable | boolean | No | Whether time is billable |
| active | boolean | No | Whether this is an active timer |
| internal | boolean | No | Whether this is internal work |
| retainerId | number | No | Associated retainer ID (null to clear) |

### Input Example

```json
{
  "accountId": "ABC123",
  "timeEntryId": 12345,
  "note": "Code review and testing for feature branch",
  "duration": 9000,
  "billable": true
}
```

### Output Schema

Returns the updated TimeEntry object (see [timeentry_list](#timeentry-object) for schema).

### Output Example

```json
{
  "id": 12345,
  "identityId": 1,
  "duration": 9000,
  "note": "Code review and testing for feature branch",
  "isLogged": true,
  "startedAt": "2024-12-15T09:00:00Z",
  "createdAt": "2024-12-15T11:00:00Z",
  "projectId": 42,
  "clientId": 100,
  "serviceId": 5,
  "taskId": null,
  "pendingClient": null,
  "pendingProject": null,
  "pendingTask": null,
  "active": false,
  "billable": true,
  "billed": false,
  "internal": false,
  "retainerId": null,
  "timer": null
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid timeEntryId | No | Check ID is a positive integer |
| -32602 | Invalid duration (negative) | No | Provide positive duration in seconds |
| -32005 | Time entry not found | No | Verify ID exists in FreshBooks |
| -32013 | Invalid project/client/service ID | Yes | Verify IDs exist in FreshBooks |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [timeentry_single](#timeentry_single) - Get current values before update
- [timer_stop](./timers.md#timer_stop) - Better way to stop active timers
- [timeentry_delete](#timeentry_delete) - Delete instead of update

---

## timeentry_delete

Delete a time entry.

### Description

Permanently delete a time entry from FreshBooks. This action cannot be undone.

**When to use:**
- User wants to remove incorrect time entry
- Deleting duplicate entries
- Removing test/accidental entries

**Warning:** This permanently deletes the entry. For active timers, consider using [timer_discard](./timers.md#timer_discard) which is semantically clearer.

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| timeEntryId | number | Yes | Time entry ID to delete |

### Input Example

```json
{
  "accountId": "ABC123",
  "timeEntryId": 12345
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Whether deletion was successful |
| message | string | Confirmation message |
| timeEntryId | number | ID of deleted time entry |

### Output Example

```json
{
  "success": true,
  "message": "Time entry deleted successfully",
  "timeEntryId": 12345
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid timeEntryId | No | Check ID is a positive integer |
| -32005 | Time entry not found | No | Entry may already be deleted |
| -32007 | Entry already billed | No | Cannot delete billed entries |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [timeentry_single](#timeentry_single) - Verify entry before deletion
- [timer_discard](./timers.md#timer_discard) - Delete active timer
- [timeentry_list](#timeentry_list) - View remaining entries

---

## Notes

### Duration Format

All durations are in seconds:
- 1 hour = 3600 seconds
- 30 minutes = 1800 seconds
- 8 hours = 28800 seconds

### Date Format

All dates use ISO 8601 format with timezone:
- `2024-12-15T09:00:00Z` (UTC)
- `2024-12-15T09:00:00-05:00` (EST)

### Active Timers

Time entries with `active: true` are running timers:
- Have `duration: 0` initially
- Duration auto-calculated when stopped
- Use [Timer Tools](./timers.md) for better timer management

### Billable vs Billed

- `billable`: Whether time CAN be billed to client
- `billed`: Whether time HAS been billed (on invoice)
- Cannot modify entries where `billed: true`
