# Timer API Reference

Timers are active time tracking sessions in FreshBooks. They are implemented as TimeEntry objects with `active: true`. These tools provide a simplified interface for timer-specific operations.

## Important Concepts

- **Timers are TimeEntry objects** with `active: true` and `duration: 0`
- **Only one active timer** per user is typically allowed
- **Duration auto-calculated** from startedAt when stopped
- **Use Timer tools** instead of TimeEntry tools for better semantics

---

## timer_start

Start a new timer for time tracking.

### Description

Creates a new active timer by creating a TimeEntry with `active: true` and `duration: 0`. The timer runs until explicitly stopped, at which point the duration is automatically calculated based on elapsed time.

**When to use:**
- User says "start timer", "begin tracking time", "clock in"
- Starting work on a task or project
- Beginning billable hours

**Important:**
- FreshBooks typically allows only ONE active timer per user
- If a timer is already running, stop it first or you may get an error
- Duration is auto-calculated from startedAt when timer is stopped
- Timer continues indefinitely until stopped

### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| accountId | string | Yes | - | FreshBooks account identifier |
| projectId | number | No | - | Project to associate with timer |
| clientId | number | No | - | Client to associate with timer |
| serviceId | number | No | - | Service/task type being worked on |
| taskId | number | No | - | Specific task being worked on |
| note | string | No | - | Description of work being performed |
| billable | boolean | No | true | Whether time is billable |
| internal | boolean | No | false | Whether this is internal work |

### Input Example

```json
{
  "accountId": "ABC123",
  "projectId": 42,
  "clientId": 100,
  "serviceId": 5,
  "note": "Working on authentication feature",
  "billable": true
}
```

### Output Schema

Returns a TimeEntry object with the active timer.

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | number | No | Time entry ID (use for stopping/discarding) |
| identityId | number | Yes | Associated identity reference |
| duration | number | No | Current duration (0 when started) |
| note | string | Yes | Description of work |
| isLogged | boolean | No | Whether logged (false for active timer) |
| startedAt | string | No | When timer started (ISO 8601) |
| createdAt | string | Yes | When entry created (ISO 8601) |
| projectId | number | Yes | Associated project ID |
| clientId | number | Yes | Associated client ID |
| serviceId | number | Yes | Associated service ID |
| taskId | number | Yes | Associated task ID |
| active | boolean | No | Whether timer is active (true) |
| billable | boolean | Yes | Whether time is billable |
| billed | boolean | Yes | Whether time billed (always false for timer) |
| internal | boolean | Yes | Whether internal work |
| timer | Timer | Yes | Active timer object |

#### Timer Object

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | number | No | Timer identifier |
| isRunning | boolean | Yes | Whether timer is running (true) |

### Output Example

```json
{
  "id": 12345,
  "identityId": 1,
  "duration": 0,
  "note": "Working on authentication feature",
  "isLogged": false,
  "startedAt": "2024-12-21T14:30:00Z",
  "createdAt": "2024-12-21T14:30:00Z",
  "projectId": 42,
  "clientId": 100,
  "serviceId": 5,
  "taskId": null,
  "pendingClient": null,
  "pendingProject": null,
  "pendingTask": null,
  "active": true,
  "billable": true,
  "billed": false,
  "internal": false,
  "retainerId": null,
  "timer": {
    "id": 9876,
    "isRunning": true
  }
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid accountId | No | Provide valid account ID |
| -32007 | Timer already running | Yes | Stop existing timer first with timer_stop |
| -32013 | Invalid project/client/service ID | Yes | Verify IDs exist in FreshBooks |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Usage Notes

**Starting a timer:**
```
User: "Start timer for Project Alpha"
→ Use timer_start with projectId
→ Save the returned id for stopping later
```

**Save the timer ID:**
The `id` field in the response is needed to stop or discard the timer. Store this value.

**Only one timer:**
If you get a CONFLICT error, there's already an active timer. Use `timer_current` to find it, then `timer_stop` to stop it before starting a new one.

### Related Tools

- [timer_stop](#timer_stop) - Stop this timer and log time
- [timer_current](#timer_current) - Check if timer already running
- [timer_discard](#timer_discard) - Delete timer without logging
- [timeentry_list](./time-entries.md#timeentry_list) - View logged time after stopping

---

## timer_stop

Stop a running timer and log the time.

### Description

Stops an active timer by setting `active: false` on the TimeEntry. FreshBooks automatically calculates the duration based on the elapsed time since `startedAt`. The time is then logged and can be billed to the client.

**When to use:**
- User says "stop timer", "clock out", "finish tracking"
- Completing work on a task
- End of work session

**What happens:**
- Timer stopped (active: false)
- Duration auto-calculated from elapsed time
- Time is logged (isLogged: true)
- Entry can now be billed

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| timeEntryId | number | Yes | ID of the time entry (timer) to stop |
| note | string | No | Update description before stopping |

### Input Example

```json
{
  "accountId": "ABC123",
  "timeEntryId": 12345,
  "note": "Completed authentication feature implementation"
}
```

### Output Schema

Returns the stopped TimeEntry with calculated duration (see [timer_start](#output-schema) for full schema).

### Output Example

```json
{
  "id": 12345,
  "identityId": 1,
  "duration": 5420,
  "note": "Completed authentication feature implementation",
  "isLogged": true,
  "startedAt": "2024-12-21T14:30:00Z",
  "createdAt": "2024-12-21T14:30:00Z",
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
  "timer": {
    "id": 9876,
    "isRunning": false
  }
}
```

**Note:** In this example, duration is 5420 seconds (1 hour 30 minutes 20 seconds) - automatically calculated from the time between start and stop.

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid timeEntryId | No | Provide valid time entry ID |
| -32005 | Timer not found | No | Verify timer ID is correct |
| -32022 | Timer not active | No | Timer already stopped |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Usage Notes

**Duration calculation:**
FreshBooks calculates: `duration = now - startedAt`

For example:
- Started: 2024-12-21T14:30:00Z
- Stopped: 2024-12-21T16:00:20Z
- Duration: 5420 seconds (90 minutes 20 seconds)

**Updating the note:**
You can update the note/description when stopping. This is useful for adding final details about what was accomplished.

### Related Tools

- [timer_start](#timer_start) - Start the timer
- [timer_current](#timer_current) - Get timer ID if you don't have it
- [timeentry_list](./time-entries.md#timeentry_list) - View logged time
- [timeentry_update](./time-entries.md#timeentry_update) - Edit logged time later

---

## timer_current

Get the currently running timer.

### Description

Retrieves any active timers for the user. Returns an array of active TimeEntry objects (typically 0 or 1 timer).

**When to use:**
- User asks "what am I working on", "show my timer", "what's running"
- Check if timer already running before starting new one
- Get timer ID for stopping

**Important:**
- Most users have 0 or 1 active timer
- Returns empty array if no timer running
- Use the `id` field to stop the timer

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
| activeTimers | TimeEntry[] | Array of active timers (0 or 1) |
| count | number | Number of active timers |

See [timer_start](#output-schema) for TimeEntry schema.

### Output Example

**With active timer:**

```json
{
  "activeTimers": [
    {
      "id": 12345,
      "identityId": 1,
      "duration": 0,
      "note": "Working on authentication feature",
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
  ],
  "count": 1
}
```

**No active timer:**

```json
{
  "activeTimers": [],
  "count": 0
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid accountId | No | Provide valid account ID |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Usage Notes

**Check before starting:**
```
1. Call timer_current
2. If count > 0, timer already running
3. Either stop it or don't start new one
```

**Get timer ID:**
```
User: "Stop my timer"
1. Call timer_current to get the timer
2. Extract id from activeTimers[0].id
3. Call timer_stop with that id
```

### Related Tools

- [timer_start](#timer_start) - Start new timer if none running
- [timer_stop](#timer_stop) - Stop the active timer
- [timer_discard](#timer_discard) - Delete timer without logging
- [timeentry_list](./time-entries.md#timeentry_list) - Use `active: true` filter (alternative method)

---

## timer_discard

Delete a timer without logging the time.

### Description

Permanently deletes an active timer without logging the time. Use this when you want to abandon tracking without creating a time entry.

**When to use:**
- User started timer by mistake
- User wants to discard work without logging
- Canceling time tracking for any reason

**Warning:** This permanently deletes the timer. The time is NOT logged. To stop and log time, use [timer_stop](#timer_stop) instead.

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| timeEntryId | number | Yes | ID of the time entry (timer) to discard |

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
| success | boolean | Whether timer was discarded |
| timeEntryId | number | ID of discarded timer |
| message | string | Confirmation message |

### Output Example

```json
{
  "success": true,
  "timeEntryId": 12345,
  "message": "Timer discarded successfully"
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid timeEntryId | No | Provide valid time entry ID |
| -32005 | Timer not found | No | Timer may already be deleted |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Usage Notes

**Discard vs Stop:**
- **timer_discard**: Deletes timer, NO time logged
- **timer_stop**: Logs time, creates billable entry

**When to discard:**
- Accidental timer start
- Testing/demo timers
- Privacy (don't want to record this time)
- Interrupted work you don't want to bill

**Cannot undo:**
Once discarded, the timer is permanently deleted and cannot be recovered.

### Related Tools

- [timer_stop](#timer_stop) - Stop and LOG time instead
- [timer_current](#timer_current) - Get timer ID before discarding
- [timeentry_delete](./time-entries.md#timeentry_delete) - Delete logged time entries

---

## Timer Workflow Examples

### Basic Timer Usage

```
1. Start work:
   timer_start({ accountId, projectId, note: "Feature work" })
   → Returns { id: 12345, active: true, ... }

2. Stop when done:
   timer_stop({ accountId, timeEntryId: 12345 })
   → Returns { duration: 5420, active: false, isLogged: true }
```

### Check Before Starting

```
1. Check for active timer:
   timer_current({ accountId })
   → Returns { activeTimers: [...], count: 1 }

2. Stop existing timer:
   timer_stop({ accountId, timeEntryId: <id from step 1> })

3. Start new timer:
   timer_start({ accountId, projectId, ... })
```

### Discard Accidental Timer

```
1. Started by mistake:
   timer_start({ accountId })
   → Returns { id: 12345 }

2. Discard immediately:
   timer_discard({ accountId, timeEntryId: 12345 })
   → Returns { success: true }
```

## Notes

### Timer Limitations

- **One timer per user** - FreshBooks typically enforces this
- **No pause/resume** - Can only start and stop
- **Cannot edit while running** - Stop first, then edit

### Duration Calculation

- Duration is ALWAYS auto-calculated when stopping
- Based on: `stop_time - startedAt`
- Rounded to nearest second
- Cannot manually set duration on active timer

### Timer vs TimeEntry

Use **Timer tools** for:
- Starting/stopping active time tracking
- Managing running timers
- Current work sessions

Use **TimeEntry tools** for:
- Logging past/completed time
- Editing logged entries
- Querying historical data
