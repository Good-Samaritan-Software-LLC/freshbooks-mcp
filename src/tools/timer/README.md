# Timer Tools

Timer tools for FreshBooks time tracking. These tools enable starting, stopping, checking, and discarding timers through the FreshBooks API.

## Overview

**Important**: Timer is NOT a standalone resource in FreshBooks. All timer operations are implemented through `TimeEntry` operations:

- **Starting a timer** → Creates a `TimeEntry` with `active=true`, `duration=0`
- **Stopping a timer** → Updates the `TimeEntry` with `active=false` (duration auto-calculated)
- **Getting current timer** → Lists `TimeEntry` records where `active=true`
- **Discarding a timer** → Deletes the `TimeEntry` completely

## Tools

### 1. timer_start

Start a new timer for time tracking.

**When to use:**
- User wants to begin tracking time
- Starting work on a project/task
- Beginning billable hours

**Input:**
```typescript
{
  accountId: string;           // Required: FreshBooks account ID
  projectId?: number;          // Optional: Associate with project
  clientId?: number;           // Optional: Associate with client
  serviceId?: number;          // Optional: Type of work
  taskId?: number;             // Optional: Specific task
  note?: string;               // Optional: Work description
  billable?: boolean;          // Optional: Is billable (default: true)
  internal?: boolean;          // Optional: Internal work (default: false)
}
```

**Output:**
```typescript
{
  id: number;                  // Time entry ID - use this to stop/discard
  active: true;                // Timer is running
  duration: 0;                 // Starts at 0 seconds
  startedAt: string;           // ISO 8601 timestamp
  isLogged: false;             // Not yet logged
  // ... other fields
}
```

**Important notes:**
- FreshBooks typically allows only ONE active timer per user
- If a timer is already running, stop it first or it may cause an error
- Returns the created `TimeEntry` - save the `id` to stop/discard later

**Example:**
```typescript
// Start timer for a project
const timer = await timerStartHandler({
  accountId: "abc123",
  projectId: 12345,
  note: "Working on bug fixes"
}, context);

console.log(`Timer started with ID: ${timer.id}`);
```

---

### 2. timer_stop

Stop a running timer and log the time.

**When to use:**
- User finishes work and wants to log time
- Stopping time tracking
- Clocking out

**Input:**
```typescript
{
  accountId: string;           // Required: FreshBooks account ID
  timeEntryId: number;         // Required: ID from timer_start or timer_current
  note?: string;               // Optional: Update work description
}
```

**Output:**
```typescript
{
  id: number;                  // Time entry ID
  active: false;               // Timer has stopped
  duration: number;            // Auto-calculated seconds
  startedAt: string;           // Original start time
  isLogged: true;              // Time is now logged
  // ... other fields
}
```

**How duration is calculated:**
FreshBooks automatically calculates duration:
- `duration = now - startedAt` (in seconds)
- You don't need to provide duration when stopping

**Important notes:**
- Duration is calculated server-side based on elapsed time
- Updates `active=false` and `isLogged=true`
- Can optionally update the note before stopping

**Example:**
```typescript
// Stop timer and add final note
const stoppedTimer = await timerStopHandler({
  accountId: "abc123",
  timeEntryId: 67890,
  note: "Completed bug fixes and testing"
}, context);

console.log(`Logged ${stoppedTimer.duration} seconds of work`);
```

---

### 3. timer_current

Get currently running timer(s).

**When to use:**
- User asks "what timer is running?"
- Need to find timer ID before stopping
- Check if a timer is active
- See current timer details

**Input:**
```typescript
{
  accountId: string;           // Required: FreshBooks account ID
}
```

**Output:**
```typescript
{
  activeTimers: TimeEntry[];   // Array of active timers (typically 0 or 1)
  count: number;               // Number of active timers
}
```

**Typical results:**
- `count: 0` → No timer is running
- `count: 1` → One active timer (normal case)
- `count: 2+` → Multiple timers (rare, depends on FreshBooks config)

**Important notes:**
- Returns ALL active timers for the user
- Each timer includes full `TimeEntry` details
- Use `activeTimers[0].id` to get the timer ID for stopping/discarding

**Example:**
```typescript
// Check current timer
const current = await timerCurrentHandler({
  accountId: "abc123"
}, context);

if (current.count === 0) {
  console.log("No timer is running");
} else {
  const timer = current.activeTimers[0];
  console.log(`Timer ${timer.id} running for ${timer.duration}s`);
  console.log(`Started at: ${timer.startedAt}`);
  console.log(`Working on: ${timer.note || "No description"}`);
}
```

**Calculating elapsed time:**
```typescript
const timer = current.activeTimers[0];
const startTime = new Date(timer.startedAt);
const now = new Date();
const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
console.log(`Elapsed: ${elapsedSeconds} seconds`);
```

---

### 4. timer_discard

Discard a timer without logging the time.

**When to use:**
- Timer was started by mistake
- Work was not actually performed
- Want to delete tracked time

**Input:**
```typescript
{
  accountId: string;           // Required: FreshBooks account ID
  timeEntryId: number;         // Required: ID of timer to discard
}
```

**Output:**
```typescript
{
  success: boolean;            // true if deleted successfully
  timeEntryId: number;         // ID that was deleted
  message: string;             // Confirmation message
}
```

**CRITICAL DIFFERENCE: Discard vs Stop**
- `timer_stop`: **Keeps** the time entry, logs the duration
- `timer_discard`: **Deletes** the time entry, no record remains

**WARNING:**
- This PERMANENTLY deletes the time entry
- Tracked time CANNOT be recovered
- Use with caution

**Important notes:**
- Completely removes the `TimeEntry` from FreshBooks
- No duration is logged or saved
- Should confirm with user before discarding

**Example:**
```typescript
// Discard timer (after user confirmation)
const result = await timerDiscardHandler({
  accountId: "abc123",
  timeEntryId: 67890
}, context);

console.log(result.message);
// "Timer 67890 has been discarded successfully..."
```

---

## Common Workflows

### Start → Check → Stop
```typescript
// 1. Start timer
const timer = await timerStartHandler({
  accountId: "abc123",
  projectId: 12345,
  note: "Development work"
}, context);

// 2. Later, check current timer
const current = await timerCurrentHandler({
  accountId: "abc123"
}, context);

console.log(`Timer running for ${current.activeTimers[0].duration}s`);

// 3. Stop timer
const stopped = await timerStopHandler({
  accountId: "abc123",
  timeEntryId: timer.id,
  note: "Development work - completed feature X"
}, context);

console.log(`Logged ${stopped.duration} seconds`);
```

### Check before starting
```typescript
// Always check if timer is already running
const current = await timerCurrentHandler({
  accountId: "abc123"
}, context);

if (current.count > 0) {
  console.log("Timer already running! Stop it first or use the existing one.");
} else {
  // Safe to start new timer
  const timer = await timerStartHandler({
    accountId: "abc123",
    note: "New task"
  }, context);
}
```

### Discard with confirmation
```typescript
// Get current timer
const current = await timerCurrentHandler({
  accountId: "abc123"
}, context);

if (current.count === 0) {
  console.log("No timer to discard");
} else {
  const timer = current.activeTimers[0];

  // Confirm with user (pseudo-code)
  if (await confirmWithUser(`Discard timer? This will delete ${timer.duration}s of tracked time.`)) {
    await timerDiscardHandler({
      accountId: "abc123",
      timeEntryId: timer.id
    }, context);
  }
}
```

---

## Error Handling

All timer tools use automatic error normalization through `ErrorHandler.wrapHandler()`.

### Common errors:

**No timer running:**
```typescript
// timer_stop or timer_discard with invalid ID
{
  code: -32005,  // RESOURCE_NOT_FOUND
  message: "TimeEntry with id 12345 was not found",
  data: {
    recoverable: false,
    suggestion: "Verify the timer ID is correct..."
  }
}
```

**Timer already exists:**
```typescript
// Trying to start when one is already running
{
  code: -32007,  // CONFLICT
  message: "A timer is already running",
  data: {
    recoverable: true,
    suggestion: "Stop the current timer first..."
  }
}
```

**Authentication error:**
```typescript
{
  code: -32001,  // NOT_AUTHENTICATED
  message: "Not authenticated",
  data: {
    recoverable: true,
    suggestion: "Please re-authenticate using auth_get_url"
  }
}
```

---

## Implementation Details

### SDK Mapping

| Tool | SDK Method | Parameters |
|------|------------|------------|
| `timer_start` | `client.timeEntries.create()` | `{ active: true, duration: 0, ... }` |
| `timer_stop` | `client.timeEntries.update()` | `{ active: false, isLogged: true }` |
| `timer_current` | `client.timeEntries.list()` | Search: `active=true` |
| `timer_discard` | `client.timeEntries.delete()` | `(accountId, timeEntryId)` |

### Key Fields

**When creating (timer_start):**
- `active: true` - Makes it a running timer
- `duration: 0` - Timer starts at 0
- `isLogged: false` - Not yet logged
- `startedAt: new Date()` - Current timestamp

**When updating (timer_stop):**
- `active: false` - Stops the timer
- `isLogged: true` - Marks as logged
- Duration is auto-calculated by FreshBooks

**When searching (timer_current):**
- Use `SearchQueryBuilder`
- Filter: `boolean("active", true)`
- Returns array of matching `TimeEntry` records

---

## Testing

See `tests/tools/timer/` for comprehensive test suites:

- `timer-start.test.ts` - Starting timers, validation, conflicts
- `timer-stop.test.ts` - Stopping timers, duration calculation
- `timer-current.test.ts` - Finding active timers, empty results
- `timer-discard.test.ts` - Deleting timers, confirmations

Run tests:
```bash
npm test -- timer
```

---

## Claude Usage Examples

**Starting a timer:**
> "Start a timer for Project Alpha. I'm working on bug fixes."

**Checking timer:**
> "What timer is running right now?"
> "How long has my timer been running?"

**Stopping timer:**
> "Stop my timer and log the time."
> "Clock out and note: completed code review"

**Discarding timer:**
> "I started a timer by mistake. Can you discard it?"
> "Delete my current timer - I didn't actually work on it"

---

## Notes

- Always check for existing timers before starting a new one
- Timer duration is in seconds (3600 = 1 hour)
- `startedAt` is ISO 8601 format: `"2024-12-21T10:30:00Z"`
- The `timer` field in responses contains nested timer object with `isRunning` flag
- Consider time zones when displaying timer information to users
