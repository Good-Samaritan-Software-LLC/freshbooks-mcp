# Tool Descriptions - Claude Optimized

This document provides Claude-optimized descriptions for all FreshBooks MCP tools. Each description includes trigger phrases, parameter details, and usage patterns to help Claude understand when and how to use each tool effectively.

## Table of Contents

- [Authentication Tools](#authentication-tools)
- [TimeEntry Tools](#timeentry-tools)
- [Timer Tools](#timer-tools)
- [Project Tools](#project-tools)
- [Service Tools](#service-tools)
- [Task Tools](#task-tools)

---

## Authentication Tools

### auth_status

**Description:** Get the current authentication status and user information.

**WHEN TO USE:**
- User asks "am I logged in?", "what account am I using?"
- Need to verify authentication before making other calls
- Need to get accountId for subsequent operations
- User asks "who am I logged in as?"

**REQUIRED:**
- None

**RETURNS:**
- authenticated: boolean - whether user is authenticated
- accessToken: Present if authenticated
- accountId: FreshBooks account ID (use this in other tool calls)
- businessId: Business ID
- user: User profile information (name, email, etc.)

**COMMON PATTERNS:**
- Always call this first to get accountId
- Use to verify session before complex operations
- Present user info when asked "who am I?"

**RELATED TOOLS:**
- auth_get_url (if not authenticated)
- auth_exchange_code (to complete authentication)

---

### auth_get_url

**Description:** Get the OAuth authorization URL for FreshBooks authentication.

**WHEN TO USE:**
- User is not authenticated (auth_status returns false)
- User says "log in", "connect to FreshBooks", "authenticate"
- Starting a new session
- Recovering from expired token

**REQUIRED:**
- None (uses configured client ID and redirect URI)

**RETURNS:**
- authorizationUrl: URL user must visit
- state: Security token (stored for verification)

**COMMON PATTERNS:**
- Present URL to user: "Please visit this URL to authorize: [url]"
- User will be redirected back with a code
- Next step: auth_exchange_code with the returned code

**RELATED TOOLS:**
- auth_exchange_code (next step after user authorizes)
- auth_status (to check current state)

---

### auth_exchange_code

**Description:** Exchange authorization code for access token to complete authentication.

**WHEN TO USE:**
- User has visited authorization URL and received a code
- User provides a code value
- Completing the OAuth flow after auth_get_url

**REQUIRED:**
- code: Authorization code from FreshBooks (user provides this)

**RETURNS:**
- success: true if exchange succeeded
- accessToken: Token for API calls (stored automatically)
- refreshToken: Token for refreshing access (stored automatically)
- expiresIn: Token expiration time in seconds

**COMMON PATTERNS:**
- User says "I got code ABC123" → Call with that code
- On success: "Successfully authenticated! You can now use FreshBooks features."
- Token is stored automatically, no need to pass it to other tools

**RELATED TOOLS:**
- auth_get_url (previous step)
- auth_status (to verify authentication worked)

---

## TimeEntry Tools

### timeentry_list

**Description:** List time entries with filtering and pagination.

**WHEN TO USE:**
- User asks "show my time", "list my hours", "what did I work on"
- User wants to see time for a project, client, or date range
- User asks "how much time on X", "what time did I log today"
- Finding specific time entries to update or review

**REQUIRED:**
- accountId: Get from auth_status if not specified

**OPTIONAL FILTERS:**
- projectId: Filter by project (use project_list to resolve name → ID)
- clientId: Filter by client (use client_list to resolve name → ID)
- taskId: Filter by task
- serviceId: Filter by service
- active: true = only running timers, false = only stopped entries
- billable: true = only billable, false = only non-billable
- billed: true = already invoiced, false = not yet invoiced
- startedAfter: ISO 8601 date (e.g., "2024-01-01T00:00:00Z")
- startedBefore: ISO 8601 date
- page: Page number (default 1)
- perPage: Results per page (default 30, max 100)

**RETURNS:**
- timeEntries: Array of time entries
  - id: Entry ID
  - duration: Seconds (convert to hours: duration / 3600)
  - note: Description of work
  - startedAt: When work began
  - projectId, clientId, taskId, serviceId: Associated entities
  - billable, billed: Billing status
  - active: Whether timer is running
- pagination: { page, pages, perPage, total }

**COMMON PATTERNS:**
- "Show my time this week" → Calculate Monday date, use startedAfter
- "Time on Project X" → First project_list to get ID, then filter by projectId
- "All unbilled hours" → Filter by billed=false
- "What's running?" → Filter by active=true
- Large result sets → Use pagination (page, perPage)

**EXAMPLES:**
```
User: "Show my time entries from today"
→ timeentry_list with startedAfter = today at 00:00:00Z

User: "How much time on the Mobile App project?"
→ project_list to find "Mobile App" → get projectId
→ timeentry_list with projectId filter
→ Sum durations, convert to hours

User: "What am I working on right now?"
→ timeentry_list with active=true
```

**RELATED TOOLS:**
- timeentry_create (log new time)
- timeentry_update (modify entries)
- project_list (resolve project names)
- timer_current (simpler way to get active timer)

---

### timeentry_single

**Description:** Get details of a specific time entry by ID.

**WHEN TO USE:**
- User references a specific time entry by ID
- Need full details of one entry
- User says "show me entry 12345", "details on that time entry"

**REQUIRED:**
- accountId: FreshBooks account ID
- timeEntryId: The time entry ID to retrieve

**RETURNS:**
Single time entry object with all fields (same as timeentry_list items)

**COMMON PATTERNS:**
- User provides ID: "Show me time entry 12345" → Call with that ID
- After creating entry: Show details of newly created entry
- Before updating: Fetch current values

**RELATED TOOLS:**
- timeentry_list (find entries first)
- timeentry_update (modify after viewing)
- timeentry_delete (remove after confirming)

---

### timeentry_create

**Description:** Create a new time entry (log completed time).

**WHEN TO USE:**
- User says "log 2 hours", "track time", "add time entry"
- Recording completed work (not starting a timer)
- User provides duration and optional description
- Bulk time entry from memory

**REQUIRED:**
- accountId: FreshBooks account ID
- duration: Time in SECONDS (convert hours/minutes to seconds)
- startedAt: When work began (ISO 8601 date)

**OPTIONAL BUT RECOMMENDED:**
- projectId: Associate with project (important for billing)
- serviceId: Type of work performed
- note: Description of what was done
- billable: Whether time is billable (default: true)
- taskId: Specific task within project
- clientId: Direct client association

**DURATION CONVERSION:**
- User says "2 hours" → 7200 seconds (2 × 3600)
- User says "30 minutes" → 1800 seconds (30 × 60)
- User says "1.5 hours" → 5400 seconds (1.5 × 3600)
- User says "2h 15m" → 8100 seconds ((2 × 3600) + (15 × 60))

**COMMON PATTERNS:**
- "Log 3 hours on Project X for coding" →
  1. project_list to resolve "Project X" → projectId
  2. service_list to resolve "coding" → serviceId (optional)
  3. timeentry_create with duration=10800, projectId, serviceId, note="coding"

- "Track 45 minutes for client meeting" →
  1. duration = 2700 seconds (45 × 60)
  2. note = "client meeting"
  3. billable = true

**EXAMPLES:**
```
User: "Log 4 hours on the API project for code review"
→ project_list to find "API project" → projectId
→ service_list to find "code review" → serviceId
→ timeentry_create:
  - duration: 14400 (4 × 3600)
  - projectId: resolved ID
  - serviceId: resolved ID
  - note: "Code review"
  - startedAt: today or time user specifies
```

**RETURNS:**
Created time entry with:
- id: New entry ID
- All provided fields
- Auto-calculated fields (createdAt, etc.)

**RELATED TOOLS:**
- timer_start (for tracking in real-time instead)
- project_list (resolve project names)
- service_list (resolve service names)
- timeentry_list (view created entries)

---

### timeentry_update

**Description:** Update an existing time entry.

**WHEN TO USE:**
- User says "change time entry X", "update my last entry", "fix that time"
- Correcting duration, note, or associations
- Moving time to different project
- User says "that should have been 3 hours, not 2"

**REQUIRED:**
- accountId: FreshBooks account ID
- timeEntryId: ID of entry to update

**OPTIONAL (provide only fields to change):**
- duration: New duration in seconds
- note: Updated description
- projectId: Move to different project
- serviceId: Change service type
- taskId: Change task
- billable: Update billable status
- startedAt: Correct start time

**COMMON PATTERNS:**
- "Change my last entry to 3 hours" →
  1. timeentry_list to get recent entries → find last one
  2. timeentry_update with duration=10800

- "Update entry 12345 note to mention deployment" →
  1. timeentry_update with id=12345, note="Deployment work"

- "Move my morning entry to the Design project" →
  1. project_list to find "Design" → projectId
  2. Find morning entry via timeentry_list
  3. timeentry_update with new projectId

**EXAMPLES:**
```
User: "That last time entry should be 5 hours, not 4"
→ timeentry_list with perPage=1, page=1 (get most recent)
→ timeentry_update with id from result, duration=18000
```

**RETURNS:**
Updated time entry with all current values

**RELATED TOOLS:**
- timeentry_list (find entry to update)
- timeentry_single (view before updating)
- project_list (resolve new project)

---

### timeentry_delete

**Description:** Delete a time entry permanently.

**WHEN TO USE:**
- User says "delete that time entry", "remove entry X", "cancel that time"
- Duplicate entries to remove
- Mistaken entries
- User confirms deletion

**REQUIRED:**
- accountId: FreshBooks account ID
- timeEntryId: ID of entry to delete

**IMPORTANT:**
- Deletion is PERMANENT
- Cannot be undone
- Confirm with user before deleting
- Consider timeentry_update instead if user wants to change details

**COMMON PATTERNS:**
- User says "delete entry 12345" →
  1. (Optional) timeentry_single to show what will be deleted
  2. Confirm: "This will delete [duration] on [project]. Confirm?"
  3. If confirmed: timeentry_delete

- "Remove duplicate from yesterday" →
  1. timeentry_list with date filter to find duplicates
  2. Show user the entries
  3. User confirms which ID to delete
  4. timeentry_delete with confirmed ID

**RETURNS:**
- success: true if deleted

**RELATED TOOLS:**
- timeentry_list (find entry to delete)
- timeentry_single (confirm before deleting)
- timer_discard (for active timers instead)

---

## Timer Tools

**IMPORTANT:** Timer is not a separate entity. Timers are TimeEntry objects with `active=true`. When you stop a timer, duration is auto-calculated from startedAt to now.

### timer_start

**Description:** Start a new timer for real-time time tracking.

**WHEN TO USE:**
- User says "start timer", "clock in", "begin tracking"
- Starting work and wanting to track time automatically
- User wants duration calculated automatically
- Real-time time tracking instead of manual logging

**REQUIRED:**
- accountId: FreshBooks account ID

**OPTIONAL BUT RECOMMENDED:**
- projectId: What project are you working on?
- serviceId: What type of work?
- taskId: Specific task?
- note: Initial description (can update when stopping)
- billable: Is this billable? (default: true)
- internal: Internal work? (default: false)

**HOW IT WORKS:**
Creates a TimeEntry with:
- active=true (timer is running)
- duration=0 (will auto-calculate when stopped)
- startedAt=now
- isLogged=false (not yet completed)

**IMPORTANT:**
- FreshBooks typically allows only ONE active timer per user
- If timer already running, may need to stop it first (check with timer_current)
- Timer continues until explicitly stopped with timer_stop
- Duration calculated automatically: stop time - start time

**COMMON PATTERNS:**
- "Start timer for Project X" →
  1. Check timer_current (ensure nothing running)
  2. project_list to resolve "Project X"
  3. timer_start with projectId

- "Clock in for coding work" →
  1. service_list to find "coding"
  2. timer_start with serviceId and note="Coding work"

**EXAMPLES:**
```
User: "Start tracking time on the Mobile App project"
→ timer_current (check for existing timer)
→ If timer running: Ask "You have a timer running on [project]. Stop it first?"
→ project_list to find "Mobile App"
→ timer_start with projectId

User: "Begin timer for client call"
→ timer_start with note="Client call", billable=true
```

**RETURNS:**
- id: Timer ID (actually a TimeEntry ID) - use this to stop the timer
- active: true
- duration: 0
- startedAt: When timer started
- timer: { isRunning: true }
- All other provided fields

**RELATED TOOLS:**
- timer_stop (to stop and log the time)
- timer_current (check what's running)
- timer_discard (cancel without logging)
- project_list (resolve project)

---

### timer_stop

**Description:** Stop a running timer and log the time.

**WHEN TO USE:**
- User says "stop timer", "clock out", "stop tracking"
- Finishing work session
- User wants to finalize tracked time
- "I'm done" or "end timer"

**REQUIRED:**
- accountId: FreshBooks account ID
- timeEntryId: ID of the active timer (from timer_start or timer_current)

**OPTIONAL (can update these when stopping):**
- note: Final description of work completed
- billable: Change billable status
- Other TimeEntry fields to update

**HOW IT WORKS:**
Updates the TimeEntry:
- Sets active=false
- Duration is AUTO-CALCULATED from startedAt to now
- isLogged=true
- The entry becomes a completed time entry

**COMMON PATTERNS:**
- "Stop timer" →
  1. timer_current to find active timer
  2. timer_stop with that timeEntryId
  3. Show duration in hours: "Logged X hours on [project]"

- "Stop timer and add note" →
  1. timer_current to get ID
  2. timer_stop with note="Completed feature X"

**EXAMPLES:**
```
User: "Stop my timer"
→ timer_current to get active timer
→ timer_stop with timeEntryId from current timer
→ Calculate hours: duration / 3600
→ "Stopped timer. Logged 2.5 hours on Project Alpha"

User: "Done working, add note 'finished API integration'"
→ timer_current
→ timer_stop with timeEntryId and note="Finished API integration"
```

**RETURNS:**
Completed time entry with:
- id: Entry ID
- active: false
- duration: Auto-calculated seconds
- All other fields

**RELATED TOOLS:**
- timer_current (find active timer)
- timer_start (to start a new timer after)
- timeentry_update (to modify after stopping)

---

### timer_current

**Description:** Get the currently running timer (if any).

**WHEN TO USE:**
- User asks "what's running?", "do I have a timer going?", "what am I working on?"
- Before starting new timer (check for existing)
- Before stopping timer (get the ID)
- Status check

**REQUIRED:**
- accountId: FreshBooks account ID

**RETURNS:**
- If timer running: TimeEntry object with active=true
  - id: Timer ID (use this for timer_stop)
  - duration: 0 (not yet calculated)
  - startedAt: When timer started
  - projectId, note, etc.
  - timer: { isRunning: true }
  - Elapsed time can be calculated: now - startedAt

- If no timer running: Empty response or null

**COMMON PATTERNS:**
- Calculate elapsed time:
  ```
  elapsed_seconds = (Date.now() - new Date(startedAt)) / 1000
  elapsed_hours = elapsed_seconds / 3600
  ```

- Present to user:
  "You have a timer running on [project] for [elapsed_time]. Started at [startedAt]."

**EXAMPLES:**
```
User: "What am I working on?"
→ timer_current
→ If found: "Timer running on Project Alpha (Coding). Started 45 minutes ago."
→ If not found: "No timer currently running."

User: "Stop timer"
→ timer_current to get the ID
→ timer_stop with that ID
```

**RELATED TOOLS:**
- timer_stop (to stop the found timer)
- timer_start (to start if none running)
- timeentry_list (with active=true, same result but more verbose)

---

### timer_discard

**Description:** Delete a running timer without logging the time.

**WHEN TO USE:**
- User says "cancel timer", "discard timer", "delete timer without logging"
- Timer was started by mistake
- User doesn't want to count this time
- "Never mind, don't log that time"

**REQUIRED:**
- accountId: FreshBooks account ID
- timeEntryId: ID of the active timer

**IMPORTANT:**
- This DELETES the timer completely
- Time is NOT logged
- Cannot be recovered
- Confirm with user: "This will discard the timer without logging time. Confirm?"

**COMMON PATTERNS:**
- "Cancel my timer" →
  1. timer_current to find active timer
  2. Confirm: "You've been tracking for X time on [project]. Discard without logging?"
  3. If confirmed: timer_discard

- Accidental timer:
  "I accidentally started a timer" → timer_discard

**DIFFERENCE FROM TIMER_STOP:**
- timer_stop: Logs the time (creates completed entry)
- timer_discard: Deletes without logging

**RETURNS:**
- success: true if discarded

**RELATED TOOLS:**
- timer_current (find timer to discard)
- timer_stop (alternative: stop and log instead)

---

## Project Tools

### project_list

**Description:** List all projects with filtering and pagination.

**WHEN TO USE:**
- User asks "show my projects", "list projects", "what projects do I have?"
- Need to find a project ID by name
- User mentions a project by name (resolve name → ID)
- Checking project status or details

**REQUIRED:**
- accountId: FreshBooks account ID

**OPTIONAL FILTERS:**
- clientId: Filter by client
- active: true = only active projects, false = inactive
- complete: true = only completed, false = not completed
- internal: true = only internal, false = only client projects
- title: Search by project title (partial match)
- page, perPage: Pagination

**RETURNS:**
- projects: Array of projects
  - id: Project ID (use this in time entry tools)
  - title: Project name
  - description: Project details
  - clientId: Associated client
  - active: Whether accepting new time
  - complete: Whether project is finished
  - billingMethod: How it's billed
  - rate: Hourly rate if applicable
  - loggedDuration: Total time logged in seconds
  - budget: Project budget
- pagination: { page, pages, perPage, total }

**COMMON PATTERNS:**
- Resolve project name to ID:
  ```
  User mentions "Mobile App project"
  → project_list (no filters)
  → Search results for "mobile app" (case-insensitive)
  → Return matching project ID
  ```

- List active projects:
  "Show my active projects" → project_list with active=true

- Find projects for client:
  "Projects for Acme Corp" →
  1. client_list to find "Acme Corp" → clientId
  2. project_list with clientId filter

**EXAMPLES:**
```
User: "What projects am I working on?"
→ project_list with active=true
→ Present list with names and status

User: "Log time on the Website Redesign project"
→ project_list to search for "Website Redesign"
→ Get projectId from match
→ Use that ID in timeentry_create
```

**RELATED TOOLS:**
- project_create (create new project)
- project_single (get full details)
- timeentry_list (see time on project)
- client_list (find client for filtering)

---

### project_single

**Description:** Get full details of a specific project by ID.

**WHEN TO USE:**
- User asks about specific project: "Tell me about project 123"
- Need complete project information
- Before updating a project
- Showing project status and stats

**REQUIRED:**
- accountId: FreshBooks account ID
- projectId: The project ID

**RETURNS:**
Complete project object with all fields including:
- Basic info: title, description, clientId
- Billing: billingMethod, rate, fixedPrice, budget
- Status: active, complete, loggedDuration
- Metadata: createdAt, updatedAt

**COMMON PATTERNS:**
- User references project by ID: "Show me project 456"
- After project_list: Get full details of selected project
- Before updating: Fetch current values

**RELATED TOOLS:**
- project_list (find project first)
- project_update (modify after viewing)
- timeentry_list (see time entries for project)

---

### project_create

**Description:** Create a new project.

**WHEN TO USE:**
- User says "create project", "new project", "start a project"
- Setting up work tracking for new initiative
- User provides project name and optionally client/billing details

**REQUIRED:**
- accountId: FreshBooks account ID
- title: Project name (user must provide)

**OPTIONAL BUT HELPFUL:**
- clientId: Associate with client (recommended for billable work)
- description: What the project is about
- dueDate: When project should be completed (ISO 8601)
- billingMethod: project_rate | service_rate | flat_rate | team_member_rate
- projectType: fixed_price | hourly_rate
- rate: Hourly rate for hourly_rate type (decimal string)
- fixedPrice: Total price for fixed_price type (decimal string)
- budget: Project budget amount
- internal: true for non-billable internal work

**BILLING METHODS EXPLAINED:**
- **project_rate**: Bill all time at the project's hourly rate
- **service_rate**: Bill based on the service assigned to time entries
- **flat_rate**: Fixed total price, time tracking for reference only
- **team_member_rate**: Bill at individual team member's rates

**COMMON PATTERNS:**
- Simple project:
  ```
  "Create project called Website Redesign"
  → project_create with title="Website Redesign"
  ```

- Billable project for client:
  ```
  "New project for Acme Corp: Mobile App at $150/hr"
  → client_list to find "Acme Corp" → clientId
  → project_create:
    - title: "Mobile App"
    - clientId: resolved ID
    - billingMethod: "project_rate"
    - projectType: "hourly_rate"
    - rate: "150"
  ```

- Internal project:
  ```
  "Create internal training project"
  → project_create:
    - title: "Training"
    - internal: true
  ```

**EXAMPLES:**
```
User: "Start a new project for client XYZ called API Integration"
→ client_list to find "XYZ"
→ project_create:
  - title: "API Integration"
  - clientId: from client_list
  - description: "API Integration work"
```

**RETURNS:**
Created project with:
- id: New project ID (use this for time tracking)
- All provided fields
- Auto-generated fields

**RELATED TOOLS:**
- client_list (find client for association)
- service_list (understand service-based billing)
- timeentry_create (log time to new project)

---

### project_update

**Description:** Update an existing project.

**WHEN TO USE:**
- User says "update project X", "change project details", "mark project complete"
- Modifying project settings
- Changing rates, budget, or status
- Marking project as complete

**REQUIRED:**
- accountId: FreshBooks account ID
- projectId: ID of project to update

**OPTIONAL (provide only fields to change):**
- title: New name
- description: Updated description
- clientId: Change client association
- dueDate: Update deadline
- rate: Change hourly rate
- budget: Update budget
- active: false to deactivate project
- complete: true to mark as completed
- billingMethod, projectType: Change billing structure

**COMMON PATTERNS:**
- Mark complete:
  "Mark Project X as complete" → project_update with complete=true

- Update rate:
  "Change project 123 rate to $175/hr" → project_update with rate="175"

- Change client:
  "Move project to different client" →
  1. client_list to find new client
  2. project_update with new clientId

**RETURNS:**
Updated project with all current values

**RELATED TOOLS:**
- project_list (find project)
- project_single (view before updating)

---

### project_delete

**Description:** Delete a project permanently.

**WHEN TO USE:**
- User says "delete project X", "remove project"
- Project was created by mistake
- Cleanup of test/obsolete projects
- User confirms deletion

**REQUIRED:**
- accountId: FreshBooks account ID
- projectId: ID of project to delete

**IMPORTANT:**
- Deletion may be PERMANENT
- May affect associated time entries
- Confirm with user before deleting
- Consider marking as inactive (project_update with active=false) instead

**COMMON PATTERNS:**
- Always confirm:
  ```
  "Delete Project X?"
  → project_single to show what will be deleted
  → Confirm: "This will delete [title]. This may affect time entries. Confirm?"
  → If confirmed: project_delete
  ```

**RETURNS:**
- success: true if deleted

**RELATED TOOLS:**
- project_update (set active=false as alternative)
- project_single (view before deleting)

---

## Service Tools

Services define billable work types (e.g., "Development", "Design", "Consulting") with associated rates. They're used when billing by service_rate.

### service_list

**Description:** List all services with filtering and pagination.

**WHEN TO USE:**
- User asks "what services do I have?", "list services"
- Need to find a service ID by name
- User mentions a service type (resolve name → ID)
- Setting up billing rates

**REQUIRED:**
- accountId: FreshBooks account ID

**OPTIONAL FILTERS:**
- billable: true = only billable, false = non-billable
- visState: 0 = active, 1 = deleted, 2 = archived
- page, perPage: Pagination

**RETURNS:**
- services: Array of services
  - id: Service ID (use in time entries)
  - name: Service name (e.g., "Development", "Design")
  - billable: Whether billable
  - visState: Status (0=active, 1=deleted, 2=archived)
- pagination: { page, pages, perPage, total }

**COMMON PATTERNS:**
- Resolve service name to ID:
  ```
  User says "log time for development work"
  → service_list
  → Search for "development" (case-insensitive)
  → Return matching service ID
  ```

- List billable services:
  "What services can I bill for?" → service_list with billable=true

**EXAMPLES:**
```
User: "Track time for design work"
→ service_list to find "design"
→ Get serviceId
→ Use in timeentry_create

User: "What services do I offer?"
→ service_list with visState=0 (active only)
→ Present list of service names
```

**RELATED TOOLS:**
- service_create (create new service)
- service_rate_get (get service rate)
- timeentry_create (use service in time entry)

---

### service_single

**Description:** Get details of a specific service by ID.

**WHEN TO USE:**
- User asks about specific service by ID
- Need complete service information including rate
- Before updating a service

**REQUIRED:**
- accountId: FreshBooks account ID
- serviceId: The service ID

**RETURNS:**
Complete service object:
- id, name, billable, visState
- Rate information if available

**RELATED TOOLS:**
- service_list (find service first)
- service_rate_get (get detailed rate info)

---

### service_create

**Description:** Create a new service type.

**WHEN TO USE:**
- User says "create service", "add new service type"
- Setting up billing for new type of work
- User provides service name

**REQUIRED:**
- accountId: FreshBooks account ID
- name: Service name (e.g., "Consulting", "Training")

**OPTIONAL:**
- billable: Whether service is billable (default: true)

**IMPORTANT:**
- Services are IMMUTABLE once created
- Cannot update service details after creation
- To change: archive old service (visState=1) and create new one
- Use service_rate_set to set/update the rate

**COMMON PATTERNS:**
- Create billable service:
  ```
  "Add Development service at $150/hr"
  → service_create with name="Development", billable=true
  → Get returned serviceId
  → service_rate_set with rate="150", code="USD"
  ```

**RETURNS:**
Created service with:
- id: New service ID
- name, billable
- visState: 0 (active)

**RELATED TOOLS:**
- service_rate_set (set the rate after creation)
- service_list (view created service)

---

### service_rate_get

**Description:** Get the rate configuration for a service.

**WHEN TO USE:**
- User asks "what's the rate for X service?"
- Need to know service pricing
- Before updating a rate

**REQUIRED:**
- accountId: FreshBooks account ID
- serviceId: The service ID

**RETURNS:**
Rate object:
- rate: Decimal amount as string (e.g., "150.00")
- code: Currency code (e.g., "USD")

**COMMON PATTERNS:**
- "What's the rate for Development?" →
  1. service_list to find "Development"
  2. service_rate_get with that serviceId
  3. Present: "Development is billed at $X/hr"

**RELATED TOOLS:**
- service_rate_set (update the rate)
- service_list (find service first)

---

### service_rate_set

**Description:** Set or update the rate for a service.

**WHEN TO USE:**
- User says "set service rate", "update rate for X"
- After creating a new service
- Changing billing rate for existing service

**REQUIRED:**
- accountId: FreshBooks account ID
- serviceId: The service ID
- rate: Decimal amount as string (e.g., "150.00")
- code: Currency code (e.g., "USD")

**COMMON PATTERNS:**
- Set rate for new service:
  ```
  After service_create:
  → service_rate_set with rate="150", code="USD"
  ```

- Update existing rate:
  ```
  "Change Consulting rate to $200/hr"
  → service_list to find "Consulting"
  → service_rate_set with rate="200", code="USD"
  ```

**RETURNS:**
Updated rate object with rate and code

**RELATED TOOLS:**
- service_create (create service first)
- service_rate_get (view current rate)

---

## Task Tools

Tasks are work items within projects for detailed time tracking.

### task_list

**Description:** List tasks with filtering and pagination.

**WHEN TO USE:**
- User asks "what tasks are in project X?", "list tasks"
- Need to find task ID by name
- User mentions a task (resolve name → ID)
- Viewing project breakdown

**REQUIRED:**
- accountId: FreshBooks account ID

**OPTIONAL FILTERS:**
- billable: true = only billable, false = non-billable
- visState: 0 = active, 1 = deleted, 2 = archived
- page, perPage: Pagination

**RETURNS:**
- tasks: Array of tasks
  - id: Task ID
  - name: Task name
  - description: Task details
  - billable: Whether billable
  - rate: Task-specific rate if set
  - visState: Status
- pagination: { page, pages, perPage, total }

**COMMON PATTERNS:**
- Find task by name:
  ```
  User says "log time on bug fixes task"
  → task_list to find "bug fixes"
  → Get taskId for timeentry_create
  ```

**RELATED TOOLS:**
- task_create (create new task)
- timeentry_create (log time to task)

---

### task_single

**Description:** Get details of a specific task by ID.

**WHEN TO USE:**
- User asks about specific task
- Need complete task information
- Before updating a task

**REQUIRED:**
- accountId: FreshBooks account ID
- taskId: The task ID

**RETURNS:**
Complete task object with all fields

**RELATED TOOLS:**
- task_list (find task first)
- task_update (modify after viewing)

---

### task_create

**Description:** Create a new task.

**WHEN TO USE:**
- User says "create task", "add task", "new task"
- Breaking down project into work items
- Setting up detailed time tracking

**REQUIRED:**
- accountId: FreshBooks account ID
- name: Task name

**OPTIONAL:**
- description: Task details
- billable: Whether billable (default: true)
- rate: Task-specific hourly rate

**COMMON PATTERNS:**
- Simple task:
  "Create task for code review" → task_create with name="Code Review"

- Task with rate:
  "Add senior development task at $200/hr" →
  task_create with name="Senior Development", rate={amount: "200", code: "USD"}

**RETURNS:**
Created task with id and all fields

**RELATED TOOLS:**
- task_list (view created task)
- timeentry_create (log time to task)

---

### task_update

**Description:** Update an existing task.

**WHEN TO USE:**
- User says "update task X", "change task details"
- Modifying task information
- Changing rates or status

**REQUIRED:**
- accountId: FreshBooks account ID
- taskId: ID of task to update

**OPTIONAL (provide only fields to change):**
- name: New task name
- description: Updated details
- billable: Change billable status
- rate: Update hourly rate
- visState: Archive/activate task

**RETURNS:**
Updated task with all current values

**RELATED TOOLS:**
- task_list (find task)
- task_single (view before updating)

---

### task_delete

**Description:** Delete a task permanently.

**WHEN TO USE:**
- User says "delete task X"
- Cleanup of obsolete tasks
- User confirms deletion

**REQUIRED:**
- accountId: FreshBooks account ID
- taskId: ID of task to delete

**IMPORTANT:**
- Confirm before deleting
- May affect time entries
- Consider archiving instead (task_update with visState=2)

**RETURNS:**
- success: true if deleted

**RELATED TOOLS:**
- task_update (archive instead of delete)
- task_single (view before deleting)

---

## Cross-Tool Patterns

### Resolving Names to IDs

Claude often needs to convert user-provided names to FreshBooks IDs:

```
User mentions: "Mobile App project"
→ project_list (no filters)
→ Search results for "mobile" or "app" (case-insensitive)
→ If one match: use that ID
→ If multiple matches: ask user to clarify
→ If no matches: suggest creating new project
```

### Date Handling

Convert user date expressions to ISO 8601:

```
"today" → "2024-01-15T00:00:00Z" (current date at midnight)
"this week" → Monday of current week at 00:00:00Z
"last month" → First day of previous month
"January 15" → "2024-01-15T00:00:00Z"
```

### Duration Conversion

Always convert user duration to seconds:

```
"2 hours" → 7200
"30 minutes" → 1800
"1.5 hours" → 5400
"2h 15m" → 8100
```

### Error Recovery

When tools fail:

1. **Authentication errors**: Direct to auth_get_url
2. **Not found**: Suggest using list tool to find correct ID
3. **Validation errors**: Ask user for missing/correct information
4. **Rate limiting**: Wait and retry automatically

### Chaining Tools

Common multi-tool workflows:

```
Log time on project:
1. project_list → find projectId
2. service_list → find serviceId (optional)
3. timeentry_create with resolved IDs

Weekly time report:
1. Calculate date range (Monday to Sunday)
2. timeentry_list with startedAfter/Before
3. Sum durations, convert to hours
4. Group by project
5. Present summary

Start work session:
1. timer_current (check for existing timer)
2. If running: ask to stop first
3. project_list (resolve project name)
4. timer_start with projectId
```
