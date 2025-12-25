# Timer Tools - Quick Reference

## At a Glance

| Tool | Purpose | Key Input | Key Output |
|------|---------|-----------|------------|
| `timer_start` | Start new timer | projectId, note | timeEntry.id (save this!) |
| `timer_stop` | Stop & log time | timeEntryId | duration (auto-calculated) |
| `timer_current` | Get running timer | accountId only | activeTimers array |
| `timer_discard` | Delete timer | timeEntryId | success confirmation |

## Quick Examples

### Start Timer
```typescript
const timer = await timerStartHandler({
  accountId: "abc123",
  projectId: 12345,
  note: "Bug fixes"
}, context);
// Save timer.id for later!
```

### Check Timer
```typescript
const { activeTimers, count } = await timerCurrentHandler({
  accountId: "abc123"
}, context);

if (count > 0) {
  console.log(`Timer ${activeTimers[0].id} is running`);
}
```

### Stop Timer
```typescript
await timerStopHandler({
  accountId: "abc123",
  timeEntryId: 67890,
  note: "Completed bug fixes"
}, context);
```

### Discard Timer
```typescript
await timerDiscardHandler({
  accountId: "abc123",
  timeEntryId: 67890
}, context);
```

## Key Concepts

### Timer = Active TimeEntry
- Timer is NOT a separate resource
- Starting timer → Creates TimeEntry with `active=true`
- Stopping timer → Updates TimeEntry with `active=false`
- Current timer → Lists TimeEntry where `active=true`

### Duration Auto-Calculation
- Start: `duration=0`, `startedAt=now`
- Stop: FreshBooks calculates `duration = now - startedAt`
- You never manually set duration when stopping

### One Timer Rule
- FreshBooks typically allows ONE active timer per user
- Always check current timer before starting new one
- Attempting to start when one exists may cause conflict

## Common Patterns

### Safe Start
```typescript
const current = await timerCurrentHandler({ accountId });
if (current.count === 0) {
  await timerStartHandler({ accountId, note: "..." });
} else {
  // Handle existing timer
}
```

### Get ID from Current
```typescript
const current = await timerCurrentHandler({ accountId });
if (current.count > 0) {
  const timerId = current.activeTimers[0].id;
  await timerStopHandler({ accountId, timeEntryId: timerId });
}
```

### Elapsed Time
```typescript
const timer = activeTimers[0];
const elapsed = Math.floor(
  (Date.now() - new Date(timer.startedAt).getTime()) / 1000
);
console.log(`${elapsed} seconds elapsed`);
```

## Critical Differences

| Operation | Result | When to Use |
|-----------|--------|-------------|
| `timer_stop` | Saves time entry with duration | Normal workflow - log worked time |
| `timer_discard` | **DELETES** time entry | Started by mistake, no work done |

## Error Quick Reference

| Error Code | Meaning | Solution |
|------------|---------|----------|
| -32005 | Timer not found | Check ID with timer_current |
| -32007 | Timer already exists | Stop current timer first |
| -32001 | Not authenticated | Re-authenticate |
| -32602 | Invalid params | Check required fields |

## Field Reference

### Input Fields (timer_start)
- `accountId` - REQUIRED
- `projectId` - Recommended for billing
- `note` - Recommended for clarity
- `billable` - Default: true
- `clientId`, `serviceId`, `taskId` - Optional associations

### Output Fields
- `id` - Timer ID (SAVE THIS!)
- `active` - true=running, false=stopped
- `duration` - Seconds elapsed
- `startedAt` - ISO 8601 timestamp
- `isLogged` - false=timer, true=logged time

## Integration Points

### With TimeEntry Tools
Timer tools create/modify TimeEntry records:
- Use `timeentry_list` to see all time entries (logged + timers)
- Use `timeentry_update` for advanced modifications
- Use `timeentry_single` to get full details

### With Project Tools
Associate timers with projects:
```typescript
// Start timer for specific project
await timerStartHandler({
  accountId: "abc123",
  projectId: 12345,  // Links to project
  note: "Development"
});
```

### With Auth Tools
Always get accountId from auth:
```typescript
const auth = await authStatusHandler();
const accountId = auth.accounts[0].id;

await timerStartHandler({ accountId, ... });
```

## Testing Checklist

- [ ] Start timer without timer running
- [ ] Start timer when one already exists (should error)
- [ ] Stop timer with valid ID
- [ ] Stop timer with invalid ID (should error)
- [ ] Get current timer when running
- [ ] Get current timer when not running
- [ ] Discard timer with confirmation
- [ ] Duration auto-calculation works
- [ ] All optional fields accepted
- [ ] Error normalization works

## File Locations

```
src/tools/timer/
├── schemas.ts           # Zod schemas
├── timer-start.ts       # Start timer tool
├── timer-stop.ts        # Stop timer tool
├── timer-current.ts     # Get current timer tool
├── timer-discard.ts     # Discard timer tool
├── index.ts            # Exports
├── README.md           # Full documentation
└── QUICK_REFERENCE.md  # This file
```

## Next Steps

After implementing timer tools:
1. Run `npm run typecheck` to validate TypeScript
2. Run `npm test -- timer` to run tests (once tests are written)
3. Test with real FreshBooks account
4. Update server.ts to register tools with MCP server

## Resources

- FreshBooks SDK: `@freshbooks/api`
- SDK Method: `client.timeEntries.*`
- Error Handler: `ErrorHandler.wrapHandler()`
- Full docs: `./README.md`
