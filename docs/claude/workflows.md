# Common Workflows - Claude Cookbook

This document provides step-by-step workflows for common multi-tool operations in FreshBooks. Use these as templates for handling complex user requests.

## Table of Contents

- [Time Tracking Workflows](#time-tracking-workflows)
- [Project Management Workflows](#project-management-workflows)
- [Billing Workflows](#billing-workflows)
- [Reporting Workflows](#reporting-workflows)
- [Setup Workflows](#setup-workflows)

---

## Time Tracking Workflows

### Workflow: Start Work Day

**User says:** "I'm starting work on the Mobile App project"

**Goal:** Start a timer on the specified project

**Steps:**

1. **Check for existing timer**
   ```
   → timer_current
   ```
   - If timer already running: Ask user if they want to stop it first
   - If no timer: Proceed to step 2

2. **Resolve project name to ID**
   ```
   → project_list (no filters)
   → Search results for "mobile app" (case-insensitive)
   → Extract projectId from matching project
   ```
   - If multiple matches: Ask user to clarify which one
   - If no matches: Ask if they want to create the project

3. **Start the timer**
   ```
   → timer_start with:
      - accountId: from auth_status or context
      - projectId: from step 2
      - (optional) note: "Mobile App work"
   ```

4. **Confirm to user**
   ```
   "Timer started on Mobile App. Happy coding! 🚀"
   ```

**Error Handling:**
- If timer_start fails with "timer already active": Stop existing timer first
- If project not found: Offer to create it or show available projects
- If auth error: Guide to re-authenticate

---

### Workflow: End Work Day

**User says:** "I'm done for the day, show me what I worked on"

**Goal:** Stop any active timer and provide daily summary

**Steps:**

1. **Check for and stop active timer**
   ```
   → timer_current
   ```
   - If timer found:
     ```
     → timer_stop with timeEntryId from current timer
     → Calculate duration: (now - startedAt) / 3600 hours
     → Note the project/service
     ```
   - If no timer: Skip to step 2

2. **Get today's time entries**
   ```
   → Calculate today's start: [current date] at 00:00:00Z
   → timeentry_list with:
      - accountId
      - startedAfter: today at 00:00:00Z
      - perPage: 100 (to get full day)
   ```

3. **Process and summarize**
   ```
   - Sum total duration across all entries
   - Group entries by projectId
   - For each project:
     - Get project name (cache from earlier project_list or make new call)
     - Sum duration for that project
     - Convert to hours: duration / 3600
   ```

4. **Present summary**
   ```
   "Work day complete! Here's your summary:

   📊 Today's Total: 7.5 hours

   By Project:
   - Mobile App: 4 hours
   - Website Redesign: 2.5 hours
   - Internal Admin: 1 hour

   All time logged successfully!"
   ```

**Variations:**
- User says "just stop my timer" → Only step 1
- User says "show today's time" → Skip step 1, do steps 2-4
- User wants breakdown by service → Group by serviceId instead

---

### Workflow: Weekly Time Report

**User says:** "How many hours did I work this week?"

**Goal:** Calculate and present weekly time summary

**Steps:**

1. **Calculate week date range**
   ```
   - Get current date
   - Find Monday of current week (week starts Monday)
   - startedAfter: Monday at 00:00:00Z
   - startedBefore: Sunday at 23:59:59Z (or now if current week)
   ```

   **Date calculation helper:**
   ```javascript
   const now = new Date();
   const dayOfWeek = now.getDay(); // 0=Sunday, 1=Monday, ...
   const monday = new Date(now);
   monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
   monday.setHours(0, 0, 0, 0);
   const startedAfter = monday.toISOString();
   ```

2. **Fetch all week's entries**
   ```
   → timeentry_list with:
      - accountId
      - startedAfter: Monday 00:00:00Z
      - startedBefore: now (or Sunday 23:59:59Z)
      - perPage: 100 (handle pagination if needed)
   ```
   - If total > 100: Make multiple calls with page parameter

3. **Aggregate by project**
   ```
   - Create map: projectId → total duration
   - Loop through all time entries:
     - Add entry.duration to map[entry.projectId]
   - Convert all durations to hours
   ```

4. **Resolve project names**
   ```
   → project_list to get all projects
   → Map projectId → project.title
   ```
   - Cache results to avoid repeated calls

5. **Calculate totals and percentages**
   ```
   - Total hours = sum of all durations / 3600
   - For each project:
     - Hours = project duration / 3600
     - Percentage = (hours / total hours) × 100
   ```

6. **Present formatted report**
   ```
   "📅 Week of Jan 15-21, 2024

   Total Hours: 38.5

   Breakdown by Project:
   ┌────────────────────────┬───────┬──────────┐
   │ Project                │ Hours │ Percent  │
   ├────────────────────────┼───────┼──────────┤
   │ Mobile App             │  18   │  46.8%   │
   │ Website Redesign       │  12   │  31.2%   │
   │ API Integration        │   6   │  15.6%   │
   │ Internal Admin         │  2.5  │   6.5%   │
   └────────────────────────┴───────┴──────────┘"
   ```

**Variations:**
- "Last week" → Calculate previous Monday-Sunday
- "This month" → First day of month to now
- "By client" → Group by clientId instead of projectId
- "By service" → Group by serviceId

---

### Workflow: Quick Time Entry

**User says:** "Log 3 hours for code review on the API project"

**Goal:** Create a time entry with context resolution

**Steps:**

1. **Parse user input**
   ```
   - Duration: "3 hours" → 3 × 3600 = 10800 seconds
   - Work type: "code review" → search services
   - Project: "API project" → search projects
   ```

2. **Resolve project**
   ```
   → project_list (no filters, or with search if available)
   → Find project matching "API" (case-insensitive)
   → Extract projectId
   ```
   - If multiple matches: Show list, ask user to choose
   - If no match: Ask if user wants to create project

3. **Resolve service (optional but recommended)**
   ```
   → service_list with visState=0 (active)
   → Find service matching "code review"
   → Extract serviceId
   ```
   - If not found: Skip, log without service
   - Service affects billing if project uses service_rate method

4. **Create time entry**
   ```
   → timeentry_create with:
      - accountId: from context
      - duration: 10800 (3 hours in seconds)
      - projectId: from step 2
      - serviceId: from step 3 (if found)
      - note: "Code review"
      - startedAt: now (or specific time if user mentioned)
      - billable: true (default, unless user said "non-billable")
   ```

5. **Confirm creation**
   ```
   → Extract created entry ID and details
   → Present confirmation:

   "✅ Time logged successfully!

   Entry #12345
   - Duration: 3 hours
   - Project: API Integration
   - Service: Code Review
   - Date: Jan 15, 2024"
   ```

**Error Handling:**
- If timeentry_create fails validation: Show error, ask for missing info
- If project not found: Offer to create or list available projects
- If duration parsing fails: Ask user to clarify ("Did you mean 3 hours or 3 minutes?")

**Variations:**
- With date: "Log 4 hours from yesterday" → Parse date, set startedAt
- Multiple entries: "Log 2 hours on Project A and 3 hours on Project B" → Create two entries
- With client: "Log time for Acme Corp" → Resolve client, filter projects by clientId

---

### Workflow: Bulk Time Entry from Description

**User says:** "Log my time from yesterday: 3 hours on Mobile App for development, 2 hours on design for Website Redesign, 1 hour internal meeting"

**Goal:** Parse and create multiple time entries

**Steps:**

1. **Parse entries from description**
   ```
   Entry 1: 3 hours, Mobile App, development
   Entry 2: 2 hours, Website Redesign, design
   Entry 3: 1 hour, internal, meeting
   ```

2. **Calculate base date**
   ```
   "from yesterday" → current date - 1 day at 09:00:00Z (or ask for specific time)
   ```

3. **For each entry:**

   **Entry 1:**
   ```
   → project_list to find "Mobile App" → projectId
   → service_list to find "development" → serviceId
   → timeentry_create:
      - duration: 10800
      - projectId: resolved
      - serviceId: resolved
      - note: "Development"
      - startedAt: yesterday 09:00:00Z
   ```

   **Entry 2:**
   ```
   → project_list to find "Website Redesign" → projectId
   → service_list to find "design" → serviceId
   → timeentry_create:
      - duration: 7200
      - projectId: resolved
      - serviceId: resolved
      - note: "Design"
      - startedAt: yesterday 12:00:00Z (3 hours after first)
   ```

   **Entry 3:**
   ```
   → timeentry_create:
      - duration: 3600
      - note: "Internal meeting"
      - internal: true
      - billable: false
      - startedAt: yesterday 14:00:00Z
   ```

4. **Confirm all entries**
   ```
   "✅ Logged 3 time entries for yesterday:

   1. Mobile App - Development: 3 hours
   2. Website Redesign - Design: 2 hours
   3. Internal meeting: 1 hour

   Total: 6 hours"
   ```

---

### Workflow: Correct Time Entry

**User says:** "I logged the wrong time yesterday, it should have been on Project B not Project A"

**Goal:** Find and update incorrect entry

**Steps:**

1. **Get yesterday's entries**
   ```
   → Calculate yesterday date range
   → timeentry_list with:
      - startedAfter: yesterday 00:00:00Z
      - startedBefore: yesterday 23:59:59Z
   ```

2. **Present entries to user**
   ```
   "Here are your entries from yesterday:

   1. Entry #123 - Project Alpha: 3 hours (Code review)
   2. Entry #124 - Mobile App: 2 hours (Design)
   3. Entry #125 - Project Alpha: 1 hour (Meeting)

   Which one should be moved to Project B?"
   ```

3. **User selects entry** (e.g., "The first one" or "Entry 123")

4. **Resolve new project**
   ```
   → project_list to find "Project B" → projectId
   ```

5. **Update entry**
   ```
   → timeentry_update with:
      - accountId
      - timeEntryId: 123 (from user selection)
      - projectId: new resolved projectId
   ```

6. **Confirm update**
   ```
   "✅ Updated entry #123

   Changed: Project Alpha → Project B
   Duration: 3 hours (unchanged)
   Note: Code review (unchanged)"
   ```

**Variations:**
- Change duration: timeentry_update with new duration
- Change multiple fields: Include all updates in single timeentry_update call
- Delete instead: User says "actually delete that" → timeentry_delete

---

## Project Management Workflows

### Workflow: Create Billable Project

**User says:** "Create a new project for Acme Corp: Website Redesign, hourly billing at $150/hr"

**Goal:** Set up project with client and billing configuration

**Steps:**

1. **Resolve client**
   ```
   → client_list (no filters)
   → Search for "Acme Corp" (case-insensitive)
   → Extract clientId
   ```
   - If not found: Ask if user wants to create client (would need client_create tool)
   - If multiple matches: Ask user to clarify

2. **Create project**
   ```
   → project_create with:
      - accountId
      - title: "Website Redesign"
      - clientId: from step 1
      - billingMethod: "project_rate" (bill at project-level rate)
      - projectType: "hourly_rate"
      - rate: "150" (decimal string)
      - description: "Website redesign project for Acme Corp"
   ```

3. **Confirm creation**
   ```
   → Extract created projectId

   "✅ Project created successfully!

   Project: Website Redesign
   Client: Acme Corp
   Billing: Hourly at $150/hr
   ID: 456

   Ready to track time! Say 'start timer for Website Redesign' to begin."
   ```

**Variations:**
- Fixed price: `projectType: "fixed_price"`, `fixedPrice: "5000"`
- Service-based billing: `billingMethod: "service_rate"` (then set up services)
- Internal project: `internal: true`, no client needed

---

### Workflow: Project Status Report

**User says:** "Show me the status of the Mobile App project"

**Goal:** Comprehensive project overview with time summary

**Steps:**

1. **Resolve and get project details**
   ```
   → project_list to find "Mobile App" → projectId
   → project_single with projectId
   ```

2. **Get time entries for project**
   ```
   → timeentry_list with:
      - projectId: from step 1
      - perPage: 100 (or handle pagination)
   ```

3. **Calculate statistics**
   ```
   - Total hours logged: sum(duration) / 3600
   - Billable hours: sum(duration where billable=true) / 3600
   - Unbilled hours: sum(duration where billed=false) / 3600
   - Number of entries: timeEntries.length
   - Date range: min(startedAt) to max(startedAt)
   ```

4. **Calculate value (if hourly)**
   ```
   - If project has rate:
     - Total value = billable hours × rate
     - Billed value = hours (where billed=true) × rate
     - Unbilled value = total value - billed value
   ```

5. **Present comprehensive report**
   ```
   "📊 Project Status: Mobile App

   Client: Acme Corporation
   Status: Active, In Progress
   Due Date: March 31, 2024

   Time Tracking:
   - Total Hours: 45.5
   - Billable: 42 hours
   - Non-billable: 3.5 hours
   - Date Range: Jan 5 - Jan 20

   Billing:
   - Rate: $150/hr
   - Total Value: $6,300
   - Billed: $4,500 (30 hours)
   - Unbilled: $1,800 (12 hours)

   Budget: $10,000
   Spent: 63% ($6,300)
   Remaining: $3,700"
   ```

**Variations:**
- Compare to budget: Calculate % spent vs budget
- Breakdown by service: Group time by serviceId
- Team breakdown: Group by staff member (if available)

---

### Workflow: Complete Project

**User says:** "Mark the Website Redesign project as complete and show final stats"

**Goal:** Mark complete and provide closing summary

**Steps:**

1. **Resolve project**
   ```
   → project_list to find "Website Redesign" → projectId
   ```

2. **Get final statistics** (same as Project Status Report workflow)
   ```
   → project_single
   → timeentry_list with projectId
   → Calculate totals
   ```

3. **Mark as complete**
   ```
   → project_update with:
      - projectId
      - complete: true
      - active: false (stop accepting new time)
   ```

4. **Present closing report**
   ```
   "✅ Project Completed: Website Redesign

   Final Statistics:
   - Duration: Jan 5 - Feb 28 (54 days)
   - Total Hours: 120
   - Total Value: $18,000
   - Team Members: 3
   - Deliverables: Complete

   Project archived successfully. No further time can be logged."
   ```

---

## Billing Workflows

### Workflow: Unbilled Time Report

**User says:** "Show me all unbilled time for Acme Corp"

**Goal:** List time entries that haven't been invoiced yet

**Steps:**

1. **Resolve client**
   ```
   → client_list to find "Acme Corp" → clientId
   ```

2. **Get unbilled time entries**
   ```
   → timeentry_list with:
      - clientId: from step 1 (if supported)
      OR
      - billed: false (get all unbilled)
      Then filter by clientId in code
   ```
   - May need to get projects for client first:
     ```
     → project_list with clientId → get all projectIds
     → For each projectId: timeentry_list with billed=false
     ```

3. **Group by project and service**
   ```
   - Create nested map: project → service → entries
   - For each entry:
     - Add to map[projectId][serviceId]
   ```

4. **Calculate totals**
   ```
   For each project:
     For each service:
       - Hours = sum(duration) / 3600
       - Rate = get from service or project
       - Amount = hours × rate
   ```

5. **Present billing summary**
   ```
   "💰 Unbilled Time for Acme Corp

   Mobile App Project:
   ├─ Development (15 hrs @ $150/hr): $2,250
   ├─ Design (8 hrs @ $125/hr): $1,000
   └─ Testing (5 hrs @ $100/hr): $500
   Subtotal: $3,750

   Website Redesign:
   ├─ Development (10 hrs @ $150/hr): $1,500
   └─ Content (3 hrs @ $75/hr): $225
   Subtotal: $1,725

   Total Unbilled: $5,475
   Total Hours: 41

   Ready to create invoice?"
   ```

---

### Workflow: Month-End Billing Prep

**User says:** "Prepare billing for January - show unbilled time by client"

**Goal:** Monthly billing summary across all clients

**Steps:**

1. **Calculate January date range**
   ```
   startedAfter: "2024-01-01T00:00:00Z"
   startedBefore: "2024-02-01T00:00:00Z"
   ```

2. **Get all unbilled time from January**
   ```
   → timeentry_list with:
      - startedAfter: Jan 1
      - startedBefore: Feb 1
      - billed: false
      - billable: true
      - perPage: 100 (handle pagination)
   ```

3. **Get all projects (for client mapping)**
   ```
   → project_list to get project → client mapping
   ```

4. **Group by client**
   ```
   - Create map: clientId → array of time entries
   - For each entry:
     - Find clientId from project
     - Add entry to map[clientId]
   ```

5. **Calculate per-client totals**
   ```
   For each client:
     - Total hours
     - Total amount (hours × rates)
     - Number of projects
     - Number of entries
   ```

6. **Present summary**
   ```
   "📅 January 2024 Billing Summary

   ┌─────────────────────┬────────┬──────────┬──────────┐
   │ Client              │ Hours  │ Projects │ Amount   │
   ├─────────────────────┼────────┼──────────┼──────────┤
   │ Acme Corp           │  65    │    2     │ $9,750   │
   │ TechStart Inc       │  42    │    1     │ $6,300   │
   │ Design Co           │  28    │    1     │ $3,500   │
   │ Global Systems      │  15    │    1     │ $2,250   │
   └─────────────────────┴────────┴──────────┴──────────┘

   Total Unbilled: $21,800
   Total Hours: 150

   Next steps: Create invoices per client"
   ```

---

## Reporting Workflows

### Workflow: Time Comparison Report

**User says:** "Compare my time on Project A vs Project B for this month"

**Goal:** Side-by-side project comparison

**Steps:**

1. **Resolve both projects**
   ```
   → project_list to find "Project A" → projectId_A
   → project_list to find "Project B" → projectId_B
   ```

2. **Calculate month range**
   ```
   startedAfter: first day of current month
   startedBefore: now
   ```

3. **Get time for Project A**
   ```
   → timeentry_list with:
      - projectId: projectId_A
      - startedAfter, startedBefore
   → Calculate total hours, by service
   ```

4. **Get time for Project B**
   ```
   → timeentry_list with:
      - projectId: projectId_B
      - startedAfter, startedBefore
   → Calculate total hours, by service
   ```

5. **Present comparison**
   ```
   "📊 Project Comparison - January 2024

   Project Alpha vs Mobile App

   ┌──────────────────┬──────────────┬──────────────┐
   │                  │ Project Alpha│ Mobile App   │
   ├──────────────────┼──────────────┼──────────────┤
   │ Total Hours      │    45        │    32        │
   │ Development      │    30        │    25        │
   │ Design           │    10        │     7        │
   │ Testing          │     5        │     0        │
   ├──────────────────┼──────────────┼──────────────┤
   │ Billable Value   │  $6,750      │  $4,800      │
   │ Avg per Day      │   2.25 hrs   │   1.6 hrs    │
   └──────────────────┴──────────────┴──────────────┘

   Project Alpha has 40.6% more hours logged."
   ```

---

### Workflow: Daily Time Breakdown

**User says:** "Show my time today broken down by hour"

**Goal:** Detailed timeline of work

**Steps:**

1. **Get today's entries**
   ```
   → timeentry_list with:
      - startedAfter: today 00:00:00Z
      - startedBefore: now
   ```

2. **Sort by startedAt**
   ```
   - Sort entries chronologically
   ```

3. **Resolve project/service names**
   ```
   - Get project names for all projectIds
   - Get service names for all serviceIds
   ```

4. **Present timeline**
   ```
   "📅 Today's Work Timeline - Jan 15, 2024

   09:00 - 12:00 (3h) - Mobile App [Development]
     └─ "Feature implementation for user authentication"

   12:00 - 13:00 (1h) - [Break / No Entry]

   13:00 - 15:30 (2.5h) - Website Redesign [Design]
     └─ "Homepage mockups and color scheme"

   15:30 - 16:00 (0.5h) - Internal [Admin]
     └─ "Team standup meeting"

   16:00 - now (1h running) - API Integration [Development]
     └─ Timer currently running

   Total: 7 hours (6h logged + 1h running)"
   ```

---

## Setup Workflows

### Workflow: New Client Onboarding

**User says:** "Set up a new client: Acme Corp with a Website Redesign project at $150/hr, using Development and Design services"

**Goal:** Complete client and project setup

**Steps:**

1. **Check if client exists**
   ```
   → client_list to search for "Acme Corp"
   ```
   - If exists: Use existing clientId
   - If not: Would need client_create (not in MVP, note for user)

2. **Ensure services exist**
   ```
   → service_list to find "Development" and "Design"

   For each missing service:
     → service_create with name
     → service_rate_set with rate
   ```

3. **Create project**
   ```
   → project_create with:
      - title: "Website Redesign"
      - clientId: from step 1
      - billingMethod: "service_rate" (uses service rates)
      - projectType: "hourly_rate"
      - description: "Website redesign for Acme Corp"
   ```

4. **Confirm setup**
   ```
   "✅ Client setup complete for Acme Corp!

   Project: Website Redesign (#456)
   Billing Method: Service Rates

   Services configured:
   - Development: $150/hr
   - Design: $150/hr

   Everything ready! You can now:
   - Start timers: 'start timer for Website Redesign'
   - Log time: 'log 3 hours for design work on Website Redesign'
   - Track progress: 'show Website Redesign project status'"
   ```

---

### Workflow: Service Rate Configuration

**User says:** "Set up my standard services: Development at $150, Design at $125, Consulting at $200"

**Goal:** Create services with rates

**Steps:**

1. **For each service:**

   **Development:**
   ```
   → service_list to check if "Development" exists
   → If not exists:
      → service_create with name="Development", billable=true
      → Get serviceId from response
   → service_rate_set with:
      - serviceId: from create or existing
      - rate: "150"
      - code: "USD"
   ```

   **Design:**
   ```
   → Similar flow with rate="125"
   ```

   **Consulting:**
   ```
   → Similar flow with rate="200"
   ```

2. **Verify all services**
   ```
   → service_list to get all services
   → For each created service:
      → service_rate_get to confirm rate
   ```

3. **Confirm setup**
   ```
   "✅ Services configured successfully!

   Your billing rates:
   ├─ Development: $150/hr
   ├─ Design: $125/hr
   └─ Consulting: $200/hr

   These services can now be used when:
   - Logging time entries
   - Setting up projects with service-based billing
   - Tracking different types of work"
   ```

---

## Error Recovery Workflows

### Workflow: Resume After Auth Expiration

**Scenario:** User was in middle of operation, token expired

**Steps:**

1. **Detect auth error**
   ```
   - Any tool returns auth error
   - Check auth_status → authenticated=false
   ```

2. **Preserve context**
   ```
   - Remember what user was trying to do
   - Save any parameters they provided
   ```

3. **Guide re-authentication**
   ```
   → auth_get_url

   "Your FreshBooks session has expired. To continue:

   1. Visit this URL: [authorization URL]
   2. Authorize the application
   3. Return here with the code

   I'll remember you were trying to [original action]."
   ```

4. **Wait for code**
   ```
   User provides code
   → auth_exchange_code with code
   ```

5. **Resume operation**
   ```
   → Retry original tool call with saved parameters

   "✅ Reconnected! Continuing with your request..."
   → Complete original operation
   ```

---

### Workflow: Handle Ambiguous References

**User says:** "Log 2 hours on the mobile project"

**Scenario:** Multiple projects match "mobile"

**Steps:**

1. **Attempt resolution**
   ```
   → project_list
   → Search for "mobile"
   → Find multiple matches: "Mobile App", "Mobile Website", "Mobile Redesign"
   ```

2. **Present options**
   ```
   "I found 3 projects matching 'mobile':

   1. Mobile App (Acme Corp) - Active
   2. Mobile Website (TechStart) - Active
   3. Mobile Redesign (Design Co) - Completed

   Which project did you mean? (Reply with number or name)"
   ```

3. **Wait for clarification**
   ```
   User: "The first one" or "Mobile App"
   → Select projectId for "Mobile App"
   ```

4. **Complete original request**
   ```
   → timeentry_create with selected projectId

   "✅ Logged 2 hours on Mobile App (Acme Corp)"
   ```

**Alternative:** If user says "log to all" → Create separate entries for each match
