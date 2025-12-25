# Time Tracking Workflow

Complete examples for tracking time in FreshBooks using the MCP server.

## Overview

This guide demonstrates the complete time tracking workflow from starting a timer to billing time to a client. It covers:

1. Starting and stopping timers
2. Creating time entries manually
3. Associating time with projects and tasks
4. Billing time to clients

---

## Workflow 1: Timer-Based Time Tracking

The most common workflow for tracking time as you work.

### Step 1: Check for Active Timers

Before starting a new timer, check if you already have one running (FreshBooks typically allows only one active timer per user).

**Tool Call:**
```json
{
  "tool": "timer_current",
  "input": {
    "accountId": "ABC123"
  }
}
```

**Response (No Timer Running):**
```json
{
  "activeTimers": [],
  "count": 0
}
```

**Response (Timer Already Running):**
```json
{
  "activeTimers": [
    {
      "id": 12345,
      "duration": 0,
      "note": "Working on previous task",
      "startedAt": "2024-12-21T09:00:00Z",
      "active": true,
      "projectId": 42
    }
  ],
  "count": 1
}
```

**What to do:** If a timer is already running, stop it (Step 4) before starting a new one.

---

### Step 2: Get Project and Service IDs

To associate time with a project and service, you need their IDs.

**Find Projects:**
```json
{
  "tool": "project_list",
  "input": {
    "accountId": "ABC123",
    "clientId": 100
  }
}
```

**Response:**
```json
{
  "projects": [
    {
      "id": 42,
      "title": "Website Redesign",
      "clientId": 100,
      "active": true
    }
  ]
}
```

**Find Services:**
```json
{
  "tool": "service_list",
  "input": {
    "accountId": "ABC123"
  }
}
```

**Response:**
```json
{
  "services": [
    {
      "id": 5,
      "name": "Web Development",
      "billable": true
    }
  ]
}
```

---

### Step 3: Start Timer

Start tracking time for your work.

**Tool Call:**
```json
{
  "tool": "timer_start",
  "input": {
    "accountId": "ABC123",
    "projectId": 42,
    "clientId": 100,
    "serviceId": 5,
    "note": "Implementing user authentication feature",
    "billable": true
  }
}
```

**Response:**
```json
{
  "id": 12345,
  "identityId": 1,
  "duration": 0,
  "note": "Implementing user authentication feature",
  "isLogged": false,
  "startedAt": "2024-12-21T14:30:00Z",
  "createdAt": "2024-12-21T14:30:00Z",
  "projectId": 42,
  "clientId": 100,
  "serviceId": 5,
  "taskId": null,
  "active": true,
  "billable": true,
  "billed": false,
  "internal": false,
  "timer": {
    "id": 9876,
    "isRunning": true
  }
}
```

**Important:** Save the `id` field (12345) - you'll need it to stop the timer.

---

### Step 4: Stop Timer and Log Time

When you finish working, stop the timer to log the time.

**Tool Call:**
```json
{
  "tool": "timer_stop",
  "input": {
    "accountId": "ABC123",
    "timeEntryId": 12345,
    "note": "Completed user authentication - login, logout, password reset"
  }
}
```

**Response:**
```json
{
  "id": 12345,
  "duration": 7260,
  "note": "Completed user authentication - login, logout, password reset",
  "isLogged": true,
  "startedAt": "2024-12-21T14:30:00Z",
  "projectId": 42,
  "clientId": 100,
  "serviceId": 5,
  "active": false,
  "billable": true,
  "billed": false,
  "timer": {
    "id": 9876,
    "isRunning": false
  }
}
```

**Note:** Duration is 7260 seconds = 2 hours 1 minute (automatically calculated from start to stop time).

---

## Workflow 2: Manual Time Entry

For logging time retroactively without using a timer.

### Step 1: Create Time Entry Directly

Useful for logging past work or entering multiple time blocks at once.

**Tool Call:**
```json
{
  "tool": "timeentry_create",
  "input": {
    "accountId": "ABC123",
    "duration": 10800,
    "isLogged": true,
    "startedAt": "2024-12-20T09:00:00Z",
    "note": "Client meeting and project planning session",
    "projectId": 42,
    "clientId": 100,
    "serviceId": 5,
    "billable": true,
    "internal": false
  }
}
```

**Input Details:**
- `duration`: 10800 seconds = 3 hours
- `isLogged`: true (this is completed time, not an active timer)
- `startedAt`: When the work started
- `billable`: true (can be billed to client)

**Response:**
```json
{
  "id": 12346,
  "duration": 10800,
  "note": "Client meeting and project planning session",
  "isLogged": true,
  "startedAt": "2024-12-20T09:00:00Z",
  "createdAt": "2024-12-21T15:00:00Z",
  "projectId": 42,
  "clientId": 100,
  "serviceId": 5,
  "billable": true,
  "billed": false
}
```

---

## Workflow 3: Associating Time with Tasks

For detailed project tracking using tasks.

### Step 1: Find Available Tasks

Get tasks associated with your project.

**Tool Call:**
```json
{
  "tool": "task_list",
  "input": {
    "accountId": "ABC123"
  }
}
```

**Response:**
```json
{
  "tasks": [
    {
      "id": 88,
      "name": "Frontend Development",
      "billable": true,
      "rate": {
        "amount": "150.00",
        "code": "USD"
      }
    },
    {
      "id": 89,
      "name": "Backend Development",
      "billable": true
    }
  ]
}
```

### Step 2: Start Timer with Task

**Tool Call:**
```json
{
  "tool": "timer_start",
  "input": {
    "accountId": "ABC123",
    "projectId": 42,
    "clientId": 100,
    "serviceId": 5,
    "taskId": 88,
    "note": "Building responsive navigation component",
    "billable": true
  }
}
```

**Response:**
```json
{
  "id": 12347,
  "duration": 0,
  "note": "Building responsive navigation component",
  "projectId": 42,
  "clientId": 100,
  "serviceId": 5,
  "taskId": 88,
  "active": true,
  "billable": true
}
```

---

## Workflow 4: Reviewing and Editing Time Entries

### Step 1: List Time Entries

View time entries for a specific period or project.

**Tool Call:**
```json
{
  "tool": "timeentry_list",
  "input": {
    "accountId": "ABC123",
    "projectId": 42,
    "billable": true,
    "billed": false,
    "startedAfter": "2024-12-01T00:00:00Z",
    "startedBefore": "2024-12-31T23:59:59Z",
    "perPage": 50
  }
}
```

**Response:**
```json
{
  "timeEntries": [
    {
      "id": 12345,
      "duration": 7260,
      "note": "Completed user authentication",
      "startedAt": "2024-12-21T14:30:00Z",
      "projectId": 42,
      "billable": true,
      "billed": false
    },
    {
      "id": 12346,
      "duration": 10800,
      "note": "Client meeting and project planning",
      "startedAt": "2024-12-20T09:00:00Z",
      "projectId": 42,
      "billable": true,
      "billed": false
    }
  ],
  "pagination": {
    "page": 1,
    "pages": 1,
    "total": 2
  }
}
```

### Step 2: Update Time Entry

Correct details or add more information.

**Tool Call:**
```json
{
  "tool": "timeentry_update",
  "input": {
    "accountId": "ABC123",
    "timeEntryId": 12345,
    "note": "Completed user authentication - login, logout, password reset, session management",
    "duration": 9000
  }
}
```

**Response:**
```json
{
  "id": 12345,
  "duration": 9000,
  "note": "Completed user authentication - login, logout, password reset, session management",
  "billable": true,
  "billed": false
}
```

---

## Workflow 5: Billing Time to Client

Time entries become billable when added to an invoice.

### Step 1: Get Unbilled Time

Find all billable, unbilled time for a client.

**Tool Call:**
```json
{
  "tool": "timeentry_list",
  "input": {
    "accountId": "ABC123",
    "clientId": 100,
    "billable": true,
    "billed": false
  }
}
```

**Response:**
```json
{
  "timeEntries": [
    {
      "id": 12345,
      "duration": 9000,
      "note": "User authentication implementation",
      "serviceId": 5,
      "billable": true,
      "billed": false
    },
    {
      "id": 12346,
      "duration": 10800,
      "note": "Client meeting",
      "serviceId": 5,
      "billable": true,
      "billed": false
    }
  ]
}
```

**Total Time:** 19800 seconds = 5.5 hours

### Step 2: Get Service Rate

Get the hourly rate for billing.

**Tool Call:**
```json
{
  "tool": "service_rate_get",
  "input": {
    "accountId": "ABC123",
    "serviceId": 5
  }
}
```

**Response:**
```json
{
  "serviceId": 5,
  "rate": {
    "amount": "150.00",
    "code": "USD"
  }
}
```

**Calculation:** 5.5 hours × $150/hour = $825.00

### Step 3: Create Invoice with Time Entries

**Tool Call:**
```json
{
  "tool": "invoice_create",
  "input": {
    "accountId": "ABC123",
    "customerId": 100,
    "createDate": "2024-12-21",
    "dueDate": "2025-01-20",
    "lines": [
      {
        "name": "Web Development - December 2024",
        "description": "User authentication implementation\nClient meeting and planning",
        "qty": 5.5,
        "unitCost": {
          "amount": "150.00",
          "code": "USD"
        }
      }
    ],
    "notes": "Thank you for your business!",
    "terms": "Net 30"
  }
}
```

**Response:**
```json
{
  "id": 98765,
  "invoiceNumber": "INV-2024-012",
  "customerId": 100,
  "amount": {
    "amount": "825.00",
    "code": "USD"
  },
  "status": "draft",
  "lines": [
    {
      "name": "Web Development - December 2024",
      "qty": 5.5,
      "amount": {
        "amount": "150.00",
        "code": "USD"
      }
    }
  ]
}
```

**Note:** After creating the invoice, manually mark the time entries as billed in FreshBooks UI, or they will remain as unbilled.

---

## Common Variations

### Variation 1: Non-Billable Internal Time

For internal meetings, training, or administrative work:

```json
{
  "tool": "timer_start",
  "input": {
    "accountId": "ABC123",
    "note": "Team standup meeting",
    "billable": false,
    "internal": true
  }
}
```

### Variation 2: Discarding an Accidental Timer

If you started a timer by mistake:

```json
{
  "tool": "timer_discard",
  "input": {
    "accountId": "ABC123",
    "timeEntryId": 12345
  }
}
```

**Response:**
```json
{
  "success": true,
  "timeEntryId": 12345,
  "message": "Timer discarded successfully"
}
```

### Variation 3: Bulk Time Entry

Logging multiple days of work:

```json
// Monday
{
  "tool": "timeentry_create",
  "input": {
    "accountId": "ABC123",
    "duration": 28800,
    "startedAt": "2024-12-16T09:00:00Z",
    "note": "Feature development",
    "projectId": 42,
    "billable": true
  }
}

// Tuesday
{
  "tool": "timeentry_create",
  "input": {
    "accountId": "ABC123",
    "duration": 28800,
    "startedAt": "2024-12-17T09:00:00Z",
    "note": "Testing and bug fixes",
    "projectId": 42,
    "billable": true
  }
}
```

---

## Error Handling Tips

### Error: Timer Already Running

**Error Response:**
```json
{
  "error": {
    "code": -32007,
    "message": "CONFLICT: A timer is already running"
  }
}
```

**Recovery:**
1. Call `timer_current` to get the running timer ID
2. Call `timer_stop` with that ID
3. Retry `timer_start`

### Error: Invalid Project/Client ID

**Error Response:**
```json
{
  "error": {
    "code": -32013,
    "message": "Invalid project ID: 999 does not exist"
  }
}
```

**Recovery:**
1. Call `project_list` to find valid project IDs
2. Verify client ID with `client_list`
3. Retry with correct IDs

### Error: Cannot Modify Billed Time

**Error Response:**
```json
{
  "error": {
    "code": -32007,
    "message": "Cannot modify time entry that has been billed"
  }
}
```

**Recovery:**
- Billed time entries are locked
- Contact client to void/adjust invoice if changes needed
- Create adjustment invoice with new time entry

---

## Best Practices

1. **Always use timers for active work** - More accurate than manual entry
2. **Stop timers promptly** - Don't leave timers running overnight
3. **Add detailed notes** - Helps with invoicing and client communication
4. **Associate with projects** - Enables better reporting and tracking
5. **Review before billing** - Check all time entries for accuracy
6. **Use tasks for granularity** - Break down work into specific tasks
7. **Mark internal time correctly** - Separate billable from non-billable work
8. **Regular time entry review** - Don't wait until month-end to log time

---

## Time Conversion Reference

**Common durations in seconds:**
- 15 minutes = 900 seconds
- 30 minutes = 1800 seconds
- 1 hour = 3600 seconds
- 2 hours = 7200 seconds
- 4 hours = 14400 seconds
- 8 hours = 28800 seconds

**Converting hours to seconds:**
```
seconds = hours × 3600
```

**Converting seconds to hours:**
```
hours = seconds ÷ 3600
```
