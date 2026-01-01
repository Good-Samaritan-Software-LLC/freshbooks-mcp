# Entity Relationships - Data Model Guide for Claude

This document explains how FreshBooks entities relate to each other. Understanding these relationships helps Claude make intelligent suggestions and validate user requests.

## Table of Contents

- [Core Time Tracking Domain](#core-time-tracking-domain)
- [Entity Relationship Diagram](#entity-relationship-diagram)
- [Detailed Relationships](#detailed-relationships)
- [Common Patterns](#common-patterns)
- [Validation Rules](#validation-rules)

---

## Core Time Tracking Domain

### High-Level Structure

```
Account (Business)
├── Clients
│   └── Projects
│       ├── Tasks
│       └── TimeEntries
├── Services (billing categories)
├── TimeEntries
│   ├── belongs to Project (optional)
│   ├── belongs to Client (optional, via Project or direct)
│   ├── belongs to Service (optional)
│   ├── belongs to Task (optional)
│   └── has Timer (if active=true)
└── Tasks
```

### Entity Hierarchy

**Top Level:**
- Account/Business - The FreshBooks account (identified by accountId)
- User - The authenticated user (has access to one or more accounts)

**Client Management:**
- Client - Customer/client entity
  - Has many Projects
  - Can have TimeEntries directly or via Projects

**Project Management:**
- Project - Work container
  - Belongs to Client (optional - can be internal)
  - Has many Tasks
  - Has many TimeEntries
  - Has Services associated (for service-based billing)

**Work Categorization:**
- Service - Billable service type (Development, Design, etc.)
  - Can be used across multiple Projects
  - Has a Rate
  - Used in TimeEntries
- Task - Specific work item within a project
  - Belongs to a Project (conceptually, though API may not enforce)
  - Has optional Rate
  - Used in TimeEntries

**Time Tracking:**
- TimeEntry - Record of time worked
  - Belongs to Project (optional)
  - Belongs to Client (optional, usually via Project)
  - Belongs to Service (optional)
  - Belongs to Task (optional)
  - Can have active Timer (active=true)
- Timer - Active time tracker
  - **Not a separate entity** - it's a TimeEntry with active=true
  - When stopped, becomes a completed TimeEntry

---

## Entity Relationship Diagram

### Visual Representation

```
┌─────────────┐
│   Account   │
│ (accountId) │
└──────┬──────┘
       │
       ├──────────────────────┬───────────────────┬──────────────┐
       │                      │                   │              │
       ▼                      ▼                   ▼              ▼
┌──────────┐          ┌──────────┐        ┌──────────┐   ┌──────────┐
│  Client  │          │ Service  │        │   Task   │   │   User   │
│          │          │          │        │          │   │          │
└────┬─────┘          └────┬─────┘        └────┬─────┘   └──────────┘
     │                     │                   │
     │ has many            │ used in           │ used in
     ▼                     │                   │
┌──────────┐              │                   │
│ Project  │◄─────────────┼───────────────────┤
│          │              │                   │
└────┬─────┘              │                   │
     │                     │                   │
     │ has many            │                   │
     ▼                     ▼                   ▼
┌────────────────────────────────────────────────┐
│              TimeEntry                         │
│  - projectId (optional)                        │
│  - clientId (optional)                         │
│  - serviceId (optional)                        │
│  - taskId (optional)                           │
│  - active (if true, it's a running Timer)      │
└────────────────────────────────────────────────┘
```

### Cardinality

- **Client** : **Project** = 1 : Many (one client has many projects)
- **Project** : **TimeEntry** = 1 : Many (one project has many time entries)
- **Service** : **TimeEntry** = 1 : Many (one service used in many entries)
- **Task** : **TimeEntry** = 1 : Many (one task has many entries)
- **TimeEntry** : **Timer** = 1 : 0..1 (a time entry has zero or one active timer)

---

## Detailed Relationships

### TimeEntry → Project

**Relationship:** TimeEntry **belongs to** Project (optional)

**Field:** `projectId` (number | null)

**When to use:**
- Most time entries should have a projectId for proper organization
- Required for client billing (unless using direct clientId)
- Determines billing rate if project uses project_rate billing method

**How it works:**
```
User says: "Log 3 hours on Mobile App"
→ project_list to find "Mobile App" → projectId = 123
→ timeentry_create with projectId: 123
```

**Validation:**
- projectId must exist in the account
- Project should be active (active=true) to accept new time
- If project is complete, may warn user but usually still allowed

**Null case:**
- Can log time without a project (internal/admin work)
- Must have either projectId or clientId or both for billing

---

### TimeEntry → Client

**Relationship:** TimeEntry **belongs to** Client (optional, often via Project)

**Field:** `clientId` (number | null)

**When to use:**
- Usually inherited from the Project's clientId
- Can be set directly for client work without a specific project
- Required for client billing and reporting

**How it works:**
```
Option 1 (via Project):
→ timeentry_create with projectId: 123
→ FreshBooks automatically associates with project's clientId

Option 2 (direct):
→ client_list to find "Acme Corp" → clientId = 456
→ timeentry_create with clientId: 456 (no project)
```

**Validation:**
- clientId must exist in the account
- If both projectId and clientId provided, should match project's client

**Notes:**
- Internal projects may have no client (internal=true)
- For billing reports, entries without clientId won't appear in client summaries

---

### TimeEntry → Service

**Relationship:** TimeEntry **belongs to** Service (optional)

**Field:** `serviceId` (number | null)

**When to use:**
- To categorize type of work (Development, Design, Consulting, etc.)
- Required when project uses service_rate billing method
- Determines billing rate in service-based billing
- Useful for reporting by work type

**How it works:**
```
User says: "Log 3 hours for development work"
→ service_list to find "Development" → serviceId = 789
→ timeentry_create with serviceId: 789
```

**Validation:**
- serviceId must exist and be active (visState=0)
- Service should be billable if time entry is billable
- Some projects require a service (depends on billing method)

**Billing impact:**
- If project.billingMethod = "service_rate":
  - Time is billed at the service's rate
  - Service must have a rate configured (use service_rate_get/set)
- If project.billingMethod = "project_rate":
  - Service is for categorization only
  - Time is billed at project's rate

---

### TimeEntry → Task

**Relationship:** TimeEntry **belongs to** Task (optional)

**Field:** `taskId` (number | null)

**When to use:**
- For detailed project breakdown
- When project has defined tasks
- For granular time tracking and reporting
- Task may have its own rate

**How it works:**
```
User says: "Log 2 hours on bug fixes task"
→ task_list to find "Bug Fixes" → taskId = 321
→ timeentry_create with taskId: 321
```

**Validation:**
- taskId must exist and be active
- Task should belong to the same project (if projectId also provided)

**Notes:**
- Tasks are less commonly used than projects/services
- Useful for detailed project management
- Can have task-specific rates

---

### TimeEntry → Timer

**Relationship:** TimeEntry **has** Timer (embedded, not separate entity)

**Field:** `active` (boolean) - when true, entry is a running timer

**How it works:**

**Starting a timer:**
```
→ timer_start (actually calls timeentry_create):
  - active: true
  - duration: 0
  - isLogged: false
  - startedAt: now

Returns TimeEntry with:
  - id: 12345
  - active: true
  - timer: { isRunning: true }
```

**Stopping a timer:**
```
→ timer_stop (actually calls timeentry_update):
  - active: false
  - duration: auto-calculated (now - startedAt)
  - isLogged: true

Returns TimeEntry with:
  - id: 12345
  - active: false
  - duration: 7200 (2 hours in seconds)
  - timer: null
```

**Important:**
- Only one active timer per user allowed
- Timer is not a separate database entity
- active=true makes a TimeEntry a "timer"
- active=false makes it a "logged entry"

---

### Project → Client

**Relationship:** Project **belongs to** Client (optional)

**Field:** `clientId` (string | null)

**When to use:**
- Most billable projects should have a client
- Internal projects (internal=true) usually don't have a client
- Required for client-based reporting and billing

**How it works:**
```
→ project_create:
  - title: "Mobile App"
  - clientId: 456
  - internal: false

OR for internal project:
→ project_create:
  - title: "Team Training"
  - internal: true
  - (no clientId)
```

**Notes:**
- Client determines who gets billed
- Time entries inherit client from project
- Can filter projects by clientId

---

### Project → Service

**Relationship:** Project **can use** Services (many-to-many conceptually)

**Field:** `billingMethod` determines how services are used

**When to use:**
- When project uses service_rate billing
- Services define what types of work can be logged
- Each service has its own rate

**How it works:**

**Service-based billing:**
```
→ project_create:
  - title: "Website Redesign"
  - billingMethod: "service_rate"
  - clientId: 456

Then log time with services:
→ timeentry_create:
  - projectId: 123
  - serviceId: 789 (Development at $150/hr)
  - duration: 7200

→ timeentry_create:
  - projectId: 123
  - serviceId: 790 (Design at $125/hr)
  - duration: 3600

Bill calculation:
- Development: 2 hours × $150 = $300
- Design: 1 hour × $125 = $125
- Total: $425
```

**Project-rate billing:**
```
→ project_create:
  - title: "Consulting"
  - billingMethod: "project_rate"
  - rate: "200"

Time is billed at project rate regardless of service:
→ timeentry_create with any serviceId → billed at $200/hr
```

---

### Service → Rate

**Relationship:** Service **has** Rate (sub-resource)

**How it works:**
```
Create service:
→ service_create:
  - name: "Development"
  - billable: true
→ Returns serviceId: 789

Set rate:
→ service_rate_set:
  - serviceId: 789
  - rate: "150.00"
  - code: "USD"

Get rate:
→ service_rate_get:
  - serviceId: 789
→ Returns: { rate: "150.00", code: "USD" }
```

**Notes:**
- Rate is required for service_rate billing
- Rate is a decimal string, not a number
- Code is currency (USD, CAD, EUR, etc.)

---

## Common Patterns

### Pattern 1: Simple Time Entry

**Goal:** Log time with minimal context

```
User: "Log 2 hours"

Minimal entry:
→ timeentry_create:
  - duration: 7200
  - startedAt: now
  - note: "Work" (or ask user)
  - (no project, client, service, task)

Better entry (ask for context):
→ "What did you work on?"
→ User: "Mobile App project"
→ Resolve project, create with projectId
```

**When to use:**
- User didn't specify project
- Quick logging
- Internal/admin time

---

### Pattern 2: Full Context Time Entry

**Goal:** Log time with complete billing context

```
User: "Log 4 hours for code review on Mobile App for Acme Corp"

Full resolution:
1. Resolve client: "Acme Corp" → clientId
2. Resolve project: "Mobile App" → projectId (verify it's for Acme)
3. Resolve service: "code review" → serviceId
4. Create entry:
   → timeentry_create:
     - duration: 14400
     - projectId: resolved
     - clientId: from project or direct
     - serviceId: resolved
     - note: "Code review"
```

**When to use:**
- User provides full context
- Billable work
- Professional time tracking
- Service-rate billing projects

---

### Pattern 3: Timer Workflow

**Goal:** Track time in real-time

```
Start timer:
→ timer_current (check for existing)
→ project_list to resolve project
→ timer_start:
  - projectId: 123
  - serviceId: 789 (optional)
  - note: "Development work" (optional)
→ Returns TimeEntry with active=true, id=12345

...work happens...

Stop timer:
→ timer_current (or use saved id)
→ timer_stop:
  - timeEntryId: 12345
  - note: "Completed feature X" (optional, update note)
→ Returns TimeEntry with active=false, duration=auto-calculated
```

**When to use:**
- User starts work and doesn't know duration yet
- Real-time tracking
- Single-focus work sessions

---

### Pattern 4: Project-Centric Reporting

**Goal:** Get all time for a project

```
User: "Show me all time on Mobile App"

Steps:
1. Resolve project:
   → project_list to find "Mobile App" → projectId=123

2. Get project details:
   → project_single with projectId=123
   → Extract: clientId, rate, billingMethod, budget

3. Get all time entries:
   → timeentry_list:
     - projectId: 123
     - perPage: 100 (handle pagination)

4. Calculate totals:
   - Total hours: sum(duration) / 3600
   - Billable hours: sum where billable=true
   - By service: group by serviceId
   - By date range: group by date

5. Calculate value:
   - If service_rate: sum(hours × service.rate) per service
   - If project_rate: total hours × project.rate
```

---

### Pattern 5: Client Billing Report

**Goal:** Get unbilled time for a client

```
User: "Show unbilled time for Acme Corp"

Steps:
1. Resolve client:
   → client_list to find "Acme Corp" → clientId=456

2. Get client's projects:
   → project_list with clientId=456
   → Extract all projectIds

3. Get unbilled time for each project:
   For each projectId:
     → timeentry_list:
       - projectId: current
       - billed: false
       - billable: true

4. Aggregate:
   - Group by project
   - Group by service within project
   - Calculate hours and amounts

5. Present summary ready for invoicing
```

---

## Validation Rules

### TimeEntry Validation

**Required fields:**
- `duration` (number, in seconds, must be > 0 for logged entries)
- `startedAt` (ISO 8601 date)
- `isLogged` (boolean, true for completed entries)

**Optional but recommended:**
- `projectId` - for organization and billing
- `note` - for work description
- `billable` - defaults to true if isLogged=true

**Conditional requirements:**
- If project uses service_rate billing → should have serviceId
- For client billing → need projectId (with client) or direct clientId
- For timer → active=true, duration=0, isLogged=false

**Constraints:**
- Only one active timer per user
- duration >= 0
- If active=true, then duration should be 0
- startedAt must be valid date (not future for completed entries)

---

### Project Validation

**Required fields:**
- `title` (string, project name)

**Conditional requirements:**
- If `projectType` = "hourly_rate" → should have `rate`
- If `projectType` = "fixed_price" → should have `fixedPrice`
- If `billingMethod` = "service_rate" → services must have rates
- If not internal → should have `clientId`

**Billing method options:**
- `project_rate` - bill at project's hourly rate
- `service_rate` - bill at service rates
- `flat_rate` - fixed price (use fixedPrice)
- `team_member_rate` - bill at individual rates

---

### Service Validation

**Required for create:**
- `name` (string, service type name)

**Immutability:**
- Services cannot be updated after creation
- To change: archive (visState=1) and create new
- Rates can be updated via service_rate_set

**Rate requirements:**
- If used in service_rate billing → must have rate configured
- Rate is decimal string: "150.00", not number 150

---

### Lookup Cascades

**When user mentions a project:**
1. Resolve project name → projectId
2. Get project details → includes clientId
3. Now have both projectId and clientId for time entry

**When user mentions a client:**
1. Resolve client name → clientId
2. Get projects for client → list of projectIds
3. If only one project → use it
4. If multiple → ask which project

**When user mentions "unbilled for client":**
1. Resolve client → clientId
2. Get client's projects → projectIds
3. For each project: get unbilled time entries
4. Aggregate across all projects

---

## Data Integrity Notes

### Orphaned References

**What happens if project is deleted:**
- TimeEntries keep the projectId (as historical record)
- May return null when fetching project details
- Consider this when reporting

**What happens if client is deleted:**
- Projects may keep clientId
- Historical data preserved
- May affect reporting

**What happens if service is archived:**
- visState set to 1 or 2
- Historical TimeEntries still reference it
- Can't be used in new entries
- Rates preserved

### Consistency Checks

**Before creating TimeEntry:**
- Verify projectId exists (if provided)
- Verify serviceId is active (if provided)
- Verify project accepts new time (active=true)

**Before starting timer:**
- Check no other timer is active (timer_current)
- If timer exists, must stop it first

**Before billing:**
- Verify all time has required fields
- Check service rates are configured
- Verify project billing method matches data

---

## Summary for Claude

**Key takeaways:**

1. **TimeEntry is central** - connects to Project, Client, Service, Task
2. **Timer is not separate** - it's a TimeEntry with active=true
3. **Projects usually have Clients** - unless internal=true
4. **Services define work types** - and rates for service_rate billing
5. **Multiple paths to same data** - can access via project, client, service, etc.
6. **Always resolve names to IDs** - users say names, tools need IDs
7. **Validate relationships** - project's client should match entry's client
8. **One active timer** - per user at a time
9. **Immutable services** - archive old, create new
10. **Billing depends on method** - project_rate vs service_rate vs fixed

**Common mistakes to avoid:**
- Don't create timer as separate entity (use timeentry_create with active=true)
- Don't forget to resolve project/service names to IDs
- Don't assume project has client (could be internal)
- Don't set duration > 0 when starting timer (use 0)
- Don't forget to check for existing timer before starting new one
