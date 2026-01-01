# User Prompt Examples - Claude Reference

This document provides real-world examples of how users might ask Claude to interact with FreshBooks. Use these patterns to recognize user intent and map to appropriate tools.

## Table of Contents

- [TimeEntry Prompts](#timeentry-prompts)
- [Timer Prompts](#timer-prompts)
- [Project Prompts](#project-prompts)
- [Service Prompts](#service-prompts)
- [Task Prompts](#task-prompts)
- [Multi-Step Workflows](#multi-step-workflows)

---

## TimeEntry Prompts

### Listing Time Entries

**Simple viewing:**
- "Show me my time entries"
- "What time did I log?"
- "List my hours"
- "What time entries do I have?"
- "Show my logged time"

**Time-based queries:**
- "Show my time from today"
- "What did I log yesterday?"
- "Time entries from this week"
- "Show me last week's hours"
- "What time did I track in January?"
- "Hours from last month"

**Project-specific:**
- "Show time entries for Project Alpha"
- "How much time on the Mobile App project?"
- "Time logged to the Website Redesign"
- "What hours did I put on Project X?"

**Client-specific:**
- "Time entries for Acme Corp"
- "Show hours for client XYZ"
- "What time did I track for John Smith?"

**Status filters:**
- "Show my unbilled hours"
- "What time hasn't been invoiced yet?"
- "Show billable time entries"
- "List non-billable hours"
- "What's currently running?" / "Show active timers"

**Complex queries:**
- "Show all unbilled time entries over 2 hours"
- "What did I work on between January and March?"
- "Compare my time on Project A vs Project B"
- "Show billable time for Acme Corp from last quarter"

**Action → Tool:**
```
"Show my time this week"
→ timeentry_list with startedAfter=Monday 00:00:00Z

"Time on Mobile App project"
→ project_list to find "Mobile App" → projectId
→ timeentry_list with projectId filter
→ Sum durations, present as hours

"What's running?"
→ timeentry_list with active=true
OR timer_current (simpler)
```

---

### Creating Time Entries

**Simple logging:**
- "Log 2 hours"
- "Track 3 hours of work"
- "Add a time entry for 45 minutes"
- "Record 1.5 hours"

**With project:**
- "Log 4 hours on Project Alpha"
- "Track 2 hours for the Mobile App"
- "Add 3 hours to Website Redesign project"
- "Record 5 hours on the API project"

**With description:**
- "Log 2 hours for code review"
- "Track 3 hours of development work"
- "Add 1 hour for client meeting"
- "Record 4 hours of bug fixes"

**Detailed logging:**
- "Log 4 hours on the API Integration project for code review work"
- "Track 2.5 hours for client call with notes about requirements discussion"
- "Add 8 hours to mobile app project, task: bug fixes, service: development"
- "Record 3 hours of design work on the Website Redesign for Acme Corp"

**With dates:**
- "Log 6 hours from yesterday on Project X"
- "Track 4 hours from last Friday for development"
- "Add time entry: 3 hours on Monday for client meeting"

**Action → Tool:**
```
"Log 4 hours on API project for code review"
→ project_list to find "API" → projectId
→ service_list to find "code review" → serviceId
→ timeentry_create:
  - duration: 14400 (4 × 3600)
  - projectId: resolved
  - serviceId: resolved
  - note: "Code review"
  - startedAt: now or specified date
```

---

### Updating Time Entries

**Duration changes:**
- "Change my last time entry to 3 hours instead of 2"
- "Update that entry to 4 hours"
- "Make entry 12345 5 hours"
- "That should have been 2.5 hours, not 3"

**Note updates:**
- "Update the note on my last entry to mention deployment"
- "Add note to entry 12345: finished feature X"
- "Change description to 'code review and testing'"

**Project changes:**
- "Move my last entry to the Design project"
- "Change entry 12345 to Project Alpha"
- "That time should be on the Mobile App project"

**Combined updates:**
- "Update entry 12345: make it 3 hours and add note 'bug fixes'"
- "Change my last entry to 4 hours on Project Beta"

**Action → Tool:**
```
"Change my last entry to 3 hours"
→ timeentry_list with perPage=1 (get most recent)
→ timeentry_update with id from result, duration=10800

"Move morning entry to Design project"
→ project_list to find "Design" → projectId
→ timeentry_list with date filter to find morning entry
→ timeentry_update with new projectId
```

---

### Deleting Time Entries

**Simple deletion:**
- "Delete time entry 12345"
- "Remove my last time entry"
- "Cancel that time entry"
- "Delete the entry I just created"

**With confirmation:**
- "Delete the duplicate entry from yesterday"
- "Remove the accidental time entry"
- "Can you delete my last entry? I logged it wrong"

**Action → Tool:**
```
"Delete entry 12345"
→ (Optional) timeentry_single to show what will be deleted
→ Confirm with user
→ timeentry_delete with id=12345

"Remove duplicate from yesterday"
→ timeentry_list with date filter
→ Show user the entries
→ User confirms which one
→ timeentry_delete with confirmed ID
```

---

## Timer Prompts

### Starting Timers

**Basic start:**
- "Start a timer"
- "Start timer"
- "Begin tracking time"
- "Clock in"
- "Start the clock"

**With project:**
- "Start timer for Project Alpha"
- "Begin tracking time on Mobile App"
- "Clock in to the Website Redesign project"
- "Start timer on API work"

**With description:**
- "Start timer for development work"
- "Begin tracking code review"
- "Clock in for client meeting"
- "Start timer for bug fixes"

**Detailed:**
- "Start tracking time on the Mobile App project for development work"
- "Begin timer for Acme Corp - design work"
- "Clock in to Project Alpha, doing code review"

**Action → Tool:**
```
"Start timer for Mobile App project"
→ timer_current (check for existing timer)
→ If running: "You have a timer on [X]. Stop it first?"
→ project_list to find "Mobile App" → projectId
→ timer_start with projectId

"Begin tracking development work"
→ service_list to find "development" → serviceId
→ timer_start with serviceId, note="Development work"
```

---

### Stopping Timers

**Basic stop:**
- "Stop timer"
- "Stop the timer"
- "Clock out"
- "End timer"
- "Stop tracking"
- "I'm done"

**With note:**
- "Stop timer and add note 'finished feature X'"
- "Clock out, completed API integration"
- "Stop tracking, note: code review completed"

**Action → Tool:**
```
"Stop timer"
→ timer_current to find active timer
→ timer_stop with timeEntryId
→ Calculate hours: duration / 3600
→ "Stopped timer. Logged X hours on [project]"

"Stop timer, add note 'deployment complete'"
→ timer_current to get ID
→ timer_stop with timeEntryId, note="Deployment complete"
→ Present summary
```

---

### Checking Timer Status

**Status queries:**
- "What's running?"
- "Do I have a timer going?"
- "Is a timer active?"
- "What am I working on?"
- "Show current timer"
- "What's my active timer?"
- "Am I tracking time?"

**Action → Tool:**
```
"What's running?"
→ timer_current
→ If found: Calculate elapsed time
→ "Timer on [project] ([service]). Running for X hours."
→ If not found: "No timer currently running."
```

---

### Discarding Timers

**Cancel/discard:**
- "Cancel my timer"
- "Discard the timer"
- "Delete timer without logging"
- "I don't want to log this time"
- "Never mind, cancel that timer"
- "Scratch that, don't log the time"

**Action → Tool:**
```
"Cancel my timer"
→ timer_current to find active timer
→ Calculate elapsed: "You've tracked X time on [project]"
→ Confirm: "Discard without logging?"
→ If yes: timer_discard
```

---

## Project Prompts

### Listing Projects

**Simple listing:**
- "Show my projects"
- "List projects"
- "What projects do I have?"
- "Show all projects"

**Filtered:**
- "Show active projects"
- "List completed projects"
- "What projects are in progress?"
- "Show internal projects"

**Client-specific:**
- "Projects for Acme Corp"
- "What projects do I have with client XYZ?"
- "Show John Smith's projects"

**Search:**
- "Find the Mobile App project"
- "Do I have a project called Website Redesign?"

**Action → Tool:**
```
"Show active projects"
→ project_list with active=true
→ Present list with names, clients, status

"Projects for Acme Corp"
→ client_list to find "Acme Corp" → clientId
→ project_list with clientId filter
```

---

### Creating Projects

**Simple creation:**
- "Create a new project"
- "Start a project called Mobile App"
- "Add project: Website Redesign"
- "New project named API Integration"

**With client:**
- "Create project for Acme Corp: Website Redesign"
- "New project for client XYZ called Mobile Development"
- "Start project Mobile App for John Smith"

**With billing details:**
- "Create hourly project at $150/hr called Development"
- "New fixed price project for $5000: Logo Design"
- "Add project Mobile App, hourly rate $200"

**Internal projects:**
- "Create internal project for training"
- "New non-billable project: Team Building"
- "Add internal project called R&D"

**Detailed:**
- "Create project for Acme Corp: API Integration, hourly at $175, due March 1st"
- "New project Website Redesign for John Smith, fixed price $8000, description: complete site overhaul"

**Action → Tool:**
```
"Create project for Acme Corp: Mobile App at $150/hr"
→ client_list to find "Acme Corp" → clientId
→ project_create:
  - title: "Mobile App"
  - clientId: resolved
  - billingMethod: "project_rate"
  - projectType: "hourly_rate"
  - rate: "150"
```

---

### Updating Projects

**Status changes:**
- "Mark Project Alpha as complete"
- "Complete the Website Redesign project"
- "Deactivate Mobile App project"
- "Make Project X inactive"

**Rate changes:**
- "Change project 123 rate to $200/hr"
- "Update Mobile App hourly rate to $175"
- "Set Project Alpha rate to $150"

**Detail updates:**
- "Update project description"
- "Change project due date to March 15"
- "Update Mobile App budget to $10,000"

**Action → Tool:**
```
"Mark Mobile App as complete"
→ project_list to find "Mobile App" → projectId
→ project_update with complete=true

"Change API project rate to $200/hr"
→ project_list to find "API"
→ project_update with rate="200"
```

---

### Deleting Projects

**Deletion:**
- "Delete project 12345"
- "Remove the test project"
- "Delete Mobile App project"

**Action → Tool:**
```
"Delete Mobile App project"
→ project_list to find "Mobile App"
→ project_single to show details
→ Confirm: "Delete [title]? This may affect time entries."
→ If confirmed: project_delete
```

---

## Service Prompts

### Listing Services

**Simple listing:**
- "Show my services"
- "List services"
- "What services do I have?"
- "What services can I bill for?"

**Filtered:**
- "Show billable services"
- "List active services"

**Action → Tool:**
```
"What services do I offer?"
→ service_list with visState=0
→ Present names and billable status
```

---

### Creating Services

**Simple creation:**
- "Create a new service called Development"
- "Add service: Consulting"
- "New service named Design"

**With rate:**
- "Create Development service at $150/hr"
- "Add Consulting service, $200 per hour"
- "New service: Design at $125/hr"

**Action → Tool:**
```
"Create Development service at $150/hr"
→ service_create with name="Development", billable=true
→ Get serviceId from response
→ service_rate_set with rate="150", code="USD"
```

---

### Service Rate Queries

**Rate inquiries:**
- "What's the rate for Development?"
- "How much do I charge for Consulting?"
- "Show rate for Design service"

**Rate updates:**
- "Change Development rate to $175/hr"
- "Update Consulting to $200 per hour"
- "Set Design service rate to $150"

**Action → Tool:**
```
"What's the rate for Development?"
→ service_list to find "Development" → serviceId
→ service_rate_get with serviceId
→ "Development is billed at $X/hr"

"Change Development to $175/hr"
→ service_list to find "Development"
→ service_rate_set with rate="175", code="USD"
```

---

## Task Prompts

### Listing Tasks

**Simple listing:**
- "Show my tasks"
- "List tasks"
- "What tasks do I have?"

**Project-specific:**
- "Tasks for Mobile App project"
- "Show tasks in Project Alpha"

**Action → Tool:**
```
"List my tasks"
→ task_list with visState=0 (active)
→ Present task names
```

---

### Creating Tasks

**Simple creation:**
- "Create task: Code Review"
- "Add task for Bug Fixes"
- "New task called Testing"

**With details:**
- "Create billable task: Senior Development at $200/hr"
- "Add task Feature Implementation, $175 per hour"

**Action → Tool:**
```
"Create task Code Review at $150/hr"
→ task_create:
  - name: "Code Review"
  - billable: true
  - rate: {amount: "150", code: "USD"}
```

---

### Updating Tasks

**Updates:**
- "Update task 123 rate to $200"
- "Change Code Review task to non-billable"
- "Archive Bug Fixes task"

**Action → Tool:**
```
"Change task rate to $200"
→ task_list to find task
→ task_update with rate={amount: "200", code: "USD"}
```

---

### Deleting Tasks

**Deletion:**
- "Delete task 123"
- "Remove Code Review task"

**Action → Tool:**
```
"Delete Code Review task"
→ task_list to find "Code Review"
→ Confirm deletion
→ task_delete with taskId
```

---

## Multi-Step Workflows

These are complex user requests that require multiple tool calls in sequence.

### Starting a Work Day

**User says:**
- "I'm starting work on the Mobile App project"
- "Beginning my day working on API Integration"
- "Clock in for Acme Corp work"

**Claude actions:**
1. timer_current (check for existing timer)
2. If timer running: Ask to stop first or auto-stop
3. project_list to resolve "Mobile App" → projectId
4. timer_start with projectId
5. Confirm: "Timer started on Mobile App. Happy coding!"

---

### Ending a Work Day

**User says:**
- "I'm done for the day"
- "End my work day, show summary"
- "Clock out and show what I worked on"

**Claude actions:**
1. timer_current to find active timer
2. If timer running: timer_stop
3. timeentry_list with startedAfter=today 00:00:00Z
4. Sum total durations
5. Group by project
6. Present summary:
   - "Stopped timer. Today's total: X hours"
   - "Project Alpha: 3 hours"
   - "Mobile App: 2.5 hours"
   - "Total: 5.5 hours"

---

### Weekly Time Report

**User says:**
- "How many hours did I work this week?"
- "Show my time for the week"
- "Weekly time summary"
- "What did I work on this week?"

**Claude actions:**
1. Calculate date range (Monday 00:00 to Sunday 23:59 or now)
2. timeentry_list with startedAfter/Before filters
3. Sum total durations → convert to hours
4. Group by project (aggregate by projectId)
5. Optionally group by client
6. Present formatted summary:
   - "Week of Jan 15-21"
   - "Project Alpha: 12 hours"
   - "Mobile App: 8.5 hours"
   - "Design Work: 5 hours"
   - "Total: 25.5 hours"

---

### Quick Time Entry with Context

**User says:**
- "Log 3 hours for code review on the API project"
- "Track 2 hours of design work for Acme Corp"
- "Add 4 hours: bug fixes on Mobile App"

**Claude actions:**
1. project_list to resolve "API project" → projectId
2. service_list to resolve "code review" → serviceId (optional)
3. timeentry_create:
   - duration: 10800 (3 × 3600)
   - projectId: resolved
   - serviceId: resolved (if found)
   - note: "Code review"
   - startedAt: now or today
4. Confirm: "Logged 3 hours on API project (Code review)"

---

### Project Setup Workflow

**User says:**
- "Create a new billable project for Acme Corp: Website Redesign at $150/hr with Development and Design services"

**Claude actions:**
1. client_list to find "Acme Corp" → clientId
2. project_create:
   - title: "Website Redesign"
   - clientId: resolved
   - billingMethod: "service_rate"
   - projectType: "hourly_rate"
3. service_list to find/create "Development" and "Design"
4. If services don't exist:
   - service_create "Development", service_rate_set $150
   - service_create "Design", service_rate_set $150
5. Confirm: "Created Website Redesign project for Acme Corp. Services: Development ($150/hr), Design ($150/hr). Ready to track time!"

---

### Billing Preparation

**User says:**
- "Show me unbilled time for Acme Corp from January"
- "What hours can I invoice to client XYZ?"
- "Prepare invoice data for last month"

**Claude actions:**
1. client_list to find "Acme Corp" → clientId
2. Calculate January date range
3. timeentry_list:
   - clientId: resolved
   - startedAfter: "2024-01-01T00:00:00Z"
   - startedBefore: "2024-02-01T00:00:00Z"
   - billed: false
4. Group by project and service
5. Calculate totals (hours × rates)
6. Present summary:
   - "Unbilled time for Acme Corp - January"
   - "Mobile App (Development): 20 hours @ $150 = $3,000"
   - "Mobile App (Design): 10 hours @ $125 = $1,250"
   - "Total: 30 hours, $4,250"

---

### Correcting Time Entries

**User says:**
- "I logged the wrong time yesterday, it should have been on Project B not Project A"
- "Fix my time from yesterday - change 4 hours to 5 hours"

**Claude actions:**
1. timeentry_list with startedAfter/Before for "yesterday"
2. Show user the entries
3. User confirms which one to update
4. If changing project:
   - project_list to find "Project B" → projectId
   - timeentry_update with new projectId
5. If changing duration:
   - timeentry_update with new duration (5 × 3600)
6. Confirm: "Updated entry: 5 hours on Project B"

---

### Comparing Project Time

**User says:**
- "Compare time spent on Project A vs Project B this month"
- "Which project did I work on more?"
- "Show time breakdown by project"

**Claude actions:**
1. Calculate month date range
2. timeentry_list with date filters
3. Group entries by projectId
4. Sum durations per project
5. project_list to get project names
6. Present comparison:
   - "January Time by Project"
   - "Project Alpha: 45 hours (60%)"
   - "Mobile App: 30 hours (40%)"
   - "Total: 75 hours"

---

## Recognition Patterns

### Duration Indicators
- "X hours" → timeentry_create
- "X minutes" → timeentry_create
- "start timer" → timer_start
- "stop timer" → timer_stop

### Action Verbs
- "log", "track", "record", "add" → timeentry_create
- "show", "list", "display", "what" → *_list tools
- "start", "begin", "clock in" → timer_start
- "stop", "end", "clock out" → timer_stop
- "create", "new", "add" → *_create tools
- "update", "change", "modify" → *_update tools
- "delete", "remove", "cancel" → *_delete tools

### Entity References
- "project X" → Need projectId (use project_list)
- "client Y" → Need clientId (use client_list)
- "service Z" → Need serviceId (use service_list)
- "task W" → Need taskId (use task_list)

### Time References
- "today" → Calculate today's date range
- "yesterday" → Calculate yesterday
- "this week" → Monday to Sunday/now
- "last week" → Previous Monday-Sunday
- "this month" → First of month to now
- "January" / month name → Calculate month range

### Status Indicators
- "unbilled" → billed=false filter
- "billable" → billable=true filter
- "active", "running" → active=true filter
- "completed" → complete=true (projects)
