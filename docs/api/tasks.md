# Task API Reference

Tasks are project subtasks for detailed time tracking. They allow you to break down project work into specific activities with individual billing rates.

**Note:** The FreshBooks API has alternate field names (`name`/`tname`, `description`/`tdesc`). Both are supported.

## task_list

List tasks from FreshBooks.

### Description

Retrieve a paginated list of tasks. Tasks provide fine-grained tracking of work within projects.

**When to use:**
- User asks to see available tasks
- Finding task IDs for time tracking
- Reviewing project tasks

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
| tasks | Task[] | Array of task objects |
| pagination | Pagination | Pagination metadata |

#### Task Object

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | number | Yes | Unique task identifier |
| taskid | number | Yes | Task ID (alternate field) |
| name | string | Yes | Task name |
| tname | string | Yes | Task name (alternate field) |
| description | string | Yes | Task description |
| tdesc | string | Yes | Task description (alternate field) |
| billable | boolean | Yes | Whether task is billable |
| rate | Money | Yes | Task billing rate |
| visState | number | Yes | Visibility state (0=active, 1=deleted, 2=archived) |
| updated | string | Yes | Last update timestamp |

#### Money Object

| Field | Type | Description |
|-------|------|-------------|
| amount | string | Decimal amount as string |
| code | string | Currency code (e.g., USD) |

### Output Example

```json
{
  "tasks": [
    {
      "id": 100,
      "taskid": 100,
      "name": "Frontend Development",
      "tname": "Frontend Development",
      "description": "React component development",
      "tdesc": "React component development",
      "billable": true,
      "rate": {
        "amount": "150.00",
        "code": "USD"
      },
      "visState": 0,
      "updated": "2024-12-15T10:00:00Z"
    },
    {
      "id": 101,
      "taskid": 101,
      "name": "Code Review",
      "tname": "Code Review",
      "description": "Pull request reviews",
      "tdesc": "Pull request reviews",
      "billable": true,
      "rate": {
        "amount": "125.00",
        "code": "USD"
      },
      "visState": 0,
      "updated": "2024-12-10T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pages": 2,
    "total": 45,
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

- [task_single](#task_single) - Get task details
- [task_create](#task_create) - Create new task
- [timeentry_create](./time-entries.md#timeentry_create) - Use task in time entry

---

## task_single

Get a single task by ID.

### Description

Retrieve detailed information about a specific task.

**When to use:**
- User asks for task details
- Verify task before using in time entries
- Check task rate and billable status

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| businessId | number | Yes | FreshBooks business identifier |
| taskId | number | Yes | Task ID to retrieve |

### Input Example

```json
{
  "businessId": 123456,
  "taskId": 100
}
```

### Output Schema

Returns a single Task object (see [task_list](#task-object) for schema).

### Output Example

```json
{
  "id": 100,
  "taskid": 100,
  "name": "Frontend Development",
  "tname": "Frontend Development",
  "description": "React component development",
  "tdesc": "React component development",
  "billable": true,
  "rate": {
    "amount": "150.00",
    "code": "USD"
  },
  "visState": 0,
  "updated": "2024-12-15T10:00:00Z"
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid taskId | No | Check ID is positive integer |
| -32005 | Task not found | No | Verify task exists |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [task_list](#task_list) - Find task IDs
- [task_update](#task_update) - Update this task
- [task_delete](#task_delete) - Delete this task

---

## task_create

Create a new task.

### Description

Create a new task for detailed project time tracking. Tasks can have their own billing rates and descriptions.

**When to use:**
- User needs to create task for project
- Adding granular tracking to project
- Creating billable task categories

### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| businessId | number | Yes | - | FreshBooks business identifier |
| name | string | Yes | - | Task name (required) |
| description | string | No | - | Task description |
| billable | boolean | No | true | Whether task is billable |
| rate | Money | No | - | Task billing rate |

#### Rate Object (Optional)

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| amount | string | Yes | - | Rate amount as decimal string |
| code | string | No | USD | Currency code |

### Input Example

```json
{
  "businessId": 123456,
  "name": "API Integration",
  "description": "Third-party API integration work",
  "billable": true,
  "rate": {
    "amount": "175.00",
    "code": "USD"
  }
}
```

### Output Schema

Returns the created Task object (see [task_list](#task-object) for schema).

### Output Example

```json
{
  "id": 102,
  "taskid": 102,
  "name": "API Integration",
  "tname": "API Integration",
  "description": "Third-party API integration work",
  "tdesc": "Third-party API integration work",
  "billable": true,
  "rate": {
    "amount": "175.00",
    "code": "USD"
  },
  "visState": 0,
  "updated": "2024-12-21T15:00:00Z"
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Missing name | No | Provide task name |
| -32602 | Empty name | No | Name must be at least 1 character |
| -32602 | Invalid rate format | No | Use decimal string for rate amount |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [task_list](#task_list) - View created task
- [task_update](#task_update) - Update task later
- [timeentry_create](./time-entries.md#timeentry_create) - Use task in time entry

---

## task_update

Update an existing task.

### Description

Modify fields of an existing task. All fields except businessId and taskId are optional.

**When to use:**
- User wants to update task details
- Changing task rates
- Updating task descriptions
- Archiving tasks (visState)

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| businessId | number | Yes | FreshBooks business identifier |
| taskId | number | Yes | Task ID to update |
| name | string | No | Updated task name |
| description | string | No | Updated task description |
| billable | boolean | No | Whether task is billable |
| rate | Money | No | Updated task billing rate |
| visState | number | No | Visibility state (0=active, 1=deleted, 2=archived) |

#### Rate Object (Optional)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| amount | string | Yes | Rate amount as decimal string |
| code | string | Yes | Currency code |

### Input Example

```json
{
  "businessId": 123456,
  "taskId": 102,
  "description": "Third-party API integration and testing",
  "rate": {
    "amount": "185.00",
    "code": "USD"
  }
}
```

### Output Schema

Returns the updated Task object (see [task_list](#task-object) for schema).

### Output Example

```json
{
  "id": 102,
  "taskid": 102,
  "name": "API Integration",
  "tname": "API Integration",
  "description": "Third-party API integration and testing",
  "tdesc": "Third-party API integration and testing",
  "billable": true,
  "rate": {
    "amount": "185.00",
    "code": "USD"
  },
  "visState": 0,
  "updated": "2024-12-21T16:00:00Z"
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid taskId | No | Check ID is positive integer |
| -32602 | Invalid rate format | No | Use decimal string for rate amount |
| -32602 | Invalid visState | No | Use 0, 1, or 2 |
| -32005 | Task not found | No | Verify task exists |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [task_single](#task_single) - Get current values
- [task_list](#task_list) - View updated task
- [task_delete](#task_delete) - Delete task instead

---

## task_delete

Delete a task.

### Description

Permanently delete a task from FreshBooks. This action cannot be undone.

**When to use:**
- User wants to remove task
- Deleting duplicate tasks
- Cleaning up test tasks

**Warning:** This permanently deletes the task. Time entries using this task are NOT deleted but lose their task association.

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| businessId | number | Yes | FreshBooks business identifier |
| taskId | number | Yes | Task ID to delete |

### Input Example

```json
{
  "businessId": 123456,
  "taskId": 102
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Whether deletion was successful |
| message | string | Confirmation message |

### Output Example

```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid taskId | No | Check ID is positive integer |
| -32005 | Task not found | No | Task may already be deleted |
| -32007 | Task has billed entries | No | Cannot delete tasks with billed time |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [task_single](#task_single) - Verify before deletion
- [task_update](#task_update) - Archive instead (visState: 2)
- [task_list](#task_list) - View remaining tasks

---

## Notes

### Alternate Field Names

The FreshBooks API uses alternate field names. Both are returned in responses:

| Standard | Alternate |
|----------|-----------|
| name | tname |
| description | tdesc |
| id | taskid |

**When creating/updating:** Use standard names (`name`, `description`)
**When reading:** Both fields are present, use either

### Task Rates

Tasks can have their own billing rates independent of:
- Project rates
- Service rates
- User rates

**Rate precedence (highest to lowest):**
1. Task rate (if set)
2. Service rate (if set)
3. Project rate (if set)
4. Default user rate

Set task rates when specific activities have different billing:
```json
{
  "name": "Senior Consultation",
  "rate": { "amount": "250.00", "code": "USD" }
}
```

### Visibility States (visState)

- **0 (active)**: Task is active and visible
- **1 (deleted)**: Task is soft-deleted (hidden)
- **2 (archived)**: Task is archived

Use `visState: 2` to archive tasks instead of deleting them. This preserves historical data while hiding from active lists.

### Billable vs Non-Billable Tasks

**Billable Tasks (billable: true):**
- Can be invoiced to clients
- Should have billing rates
- Count toward project billing
- Examples: Development, Design, Consulting

**Non-Billable Tasks (billable: false):**
- Internal work, not invoiced
- No rate needed
- Don't count toward client billing
- Examples: Internal Review, Documentation

### Tasks vs Services vs Projects

**Projects:** Top-level work containers (Website Redesign)
**Services:** Types of work (Development, Design)
**Tasks:** Specific activities (Login Page, Homepage Header)

**Hierarchy:**
```
Project: Website Redesign
  ├─ Service: Frontend Development
  │   ├─ Task: Homepage Component
  │   └─ Task: Login Page
  └─ Service: Backend Development
      ├─ Task: API Endpoints
      └─ Task: Database Schema
```

**In time tracking:**
```json
{
  "projectId": 42,      // Website Redesign
  "serviceId": 5,       // Frontend Development
  "taskId": 100,        // Homepage Component
  "duration": 7200
}
```

### Finding Business ID

Business ID is different from Account ID:
- **Account ID**: OAuth account identifier (string)
- **Business ID**: Numeric business identifier (number)

Get business ID from:
1. FreshBooks account settings
2. First task/service/project response
3. Identity endpoint

### Common Use Cases

**Create billable task with rate:**
```json
task_create({
  businessId: 123456,
  name: "Senior Review",
  description: "Code review by senior developer",
  billable: true,
  rate: {
    "amount": "200.00",
    "code": "USD"
  }
})
```

**Create non-billable task:**
```json
task_create({
  businessId: 123456,
  name: "Team Meeting",
  description: "Internal team sync",
  billable: false
})
```

**Archive task instead of deleting:**
```json
task_update({
  businessId: 123456,
  taskId: 100,
  visState: 2  // Archive
})
```

**Use task in time tracking:**
```json
timeentry_create({
  accountId: "ABC123",
  duration: 7200,
  projectId: 42,
  serviceId: 5,
  taskId: 100,
  note: "Implemented homepage component"
})
```

### Rate Format

**Correct:**
```json
{
  "rate": {
    "amount": "150.00",  // String with 2 decimal places
    "code": "USD"
  }
}
```

**Incorrect:**
```json
{
  "rate": {
    "amount": 150,       // ✗ Number instead of string
    "code": "USD"
  }
}

{
  "rate": {
    "amount": "150",     // ✗ Missing decimal places
    "code": "USD"
  }
}
```
