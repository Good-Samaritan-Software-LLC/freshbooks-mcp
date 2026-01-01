# Mock Coverage Checklist

This document tracks which entities and scenarios are covered by the mock system.

## MVP Entities (Priority 1)

### TimeEntry
- [x] Factory with realistic data
- [x] Specialized factories (active timer, logged, billable, billed, internal)
- [x] List response (with pagination)
- [x] Single response
- [x] Create response
- [x] Update response
- [x] Delete response
- [x] Empty list response
- [x] Active timer response (for timer_current)
- [x] No active timer response
- [x] Pagination scenarios (first/middle/last/beyond)

### Project
- [x] Factory with realistic data
- [x] Specialized factories (active, completed, internal, fixed-price, hourly)
- [x] List response (with pagination)
- [x] Single response
- [x] Create response
- [x] Update response
- [x] Delete response
- [x] Empty list response
- [x] Pagination scenarios (first/middle/last/beyond)

### Service
- [x] Factory with realistic data
- [x] Specialized factories (billable, non-billable, archived, deleted)
- [x] Service rate factory
- [x] List response (with pagination)
- [x] Single response
- [x] Create response
- [x] Delete response (soft delete via visState)
- [x] Empty list response
- [x] Pagination scenarios (first/middle/last/beyond)

### Task
- [x] Factory with realistic data
- [x] Specialized factories (billable, non-billable, archived, deleted)
- [x] Money helper
- [x] List response (with pagination)
- [x] Single response
- [x] Create response
- [x] Update response
- [x] Delete response
- [x] Empty list response
- [x] Pagination scenarios (first/middle/last/beyond)

### Timer (Pseudo-entity)
- [x] Timer factory (embedded in TimeEntry)
- [x] Active timer response
- [x] No active timer response
- [x] Concurrent timer error
- [x] No active timer error

## Error Scenarios

### HTTP Errors
- [x] 400 Bad Request
- [x] 401 Unauthorized
- [x] 403 Forbidden
- [x] 404 Not Found
- [x] 409 Conflict
- [x] 429 Rate Limit
- [x] 500 Internal Server Error
- [x] 503 Service Unavailable

### Validation Errors
- [x] Required field missing
- [x] Invalid value
- [x] Invalid type
- [x] Out of range
- [x] Generic validation error

### Business Logic Errors
- [x] Concurrent timer (cannot start when one running)
- [x] No active timer (cannot stop when none running)
- [x] Invalid state transition
- [x] Generic business logic error

### Resource State Errors
- [x] Archived resource
- [x] Deleted resource
- [x] Resource locked
- [x] Immutable resource
- [x] Invalid account

### Network Errors
- [x] Connection timeout
- [x] Connection refused

## OAuth/Authentication

### Token Responses
- [x] Valid token response
- [x] Expired token response
- [x] Token refresh response

### OAuth Errors
- [x] Invalid grant
- [x] Invalid client
- [x] Invalid request
- [x] Unauthorized client
- [x] Unsupported grant type

### Account Selection
- [x] Single business account
- [x] Multiple business accounts
- [x] Empty account list
- [x] Account with specific ID

## Mock Client

### Client Features
- [x] All MVP entity clients (timeEntries, projects, services, tasks)
- [x] All CRUD methods mocked
- [x] Nested resource support (services.rate)
- [x] Setup mock response helper
- [x] Setup mock error helper
- [x] Setup mock sequence helper (for pagination)
- [x] Reset mock helper
- [x] Clear mock helper

### Additional Entities (Ready for expansion)
- [x] Clients
- [x] Invoices
- [x] Expenses
- [x] Expense Categories
- [x] Payments
- [x] Items
- [x] Bills
- [x] Bill Payments
- [x] Bill Vendors
- [x] Credit Notes
- [x] Other Income
- [x] Journal Entries
- [x] Journal Entry Accounts
- [x] Callbacks
- [x] Users
- [x] Payment Options
- [x] Reports

## Pagination Coverage

For each entity with list support:
- [x] First page (page 1 of many)
- [x] Middle page (page N of many)
- [x] Last page (possibly partial results)
- [x] Beyond last page (page > total pages, empty but valid)
- [x] Custom page size (perPage parameter)
- [x] Pagination metadata (page, pages, total, perPage)

## Edge Cases

### Data Edge Cases
- [x] Null values (using TypeScript optional/null types)
- [x] Empty strings (via factory overrides)
- [x] Max integer values (via faker ranges)
- [x] Unicode characters (via faker realistic data)
- [x] Empty arrays (empty list responses)

### Pagination Edge Cases
- [x] Empty list (0 results)
- [x] Single page (results < perPage)
- [x] Exact page boundary (results === perPage)
- [x] Beyond last page
- [x] Large datasets (100+ items)

### Error Edge Cases
- [x] Multiple validation errors on same field
- [x] Validation on nested fields
- [x] Errors with retry-after header (rate limit)
- [x] Errors with field references
- [x] Network errors (non-HTTP)

## Test Coverage Goals

### Unit Tests (per tool)
- [ ] Success scenario
- [ ] Empty results
- [ ] Pagination (first/middle/last)
- [ ] Not found error
- [ ] Validation error
- [ ] Auth error (unauthorized/forbidden)
- [ ] Rate limit error
- [ ] Server error
- [ ] Network error
- [ ] Business logic error (if applicable)

### Integration Tests
- [ ] Full OAuth flow
- [ ] Multi-page data retrieval
- [ ] Error recovery and retry
- [ ] Token refresh
- [ ] Account switching

## Documentation

- [x] README.md with usage examples
- [x] COVERAGE.md (this file)
- [x] Inline JSDoc comments
- [x] TypeScript type definitions
- [x] Example test file

## Quality Metrics

Target for 100% test coverage:

- **Factories**: 5 entities × ~5 specialized factories = 25+ factory functions
- **Responses**: 5 entities × ~9 response types = 45+ response functions
- **Errors**: 25+ error scenarios
- **Auth**: 10+ OAuth scenarios
- **Client**: 1 mock client + 5 helper functions

Current Status:
- Factories: 25+ ✓
- Responses: 45+ ✓
- Errors: 25+ ✓
- Auth: 10+ ✓
- Client: 6 helpers ✓

## Future Enhancements

### Additional Entities (when needed)
- [ ] Client entity factory and responses
- [ ] Invoice entity factory and responses
- [ ] Expense entity factory and responses
- [ ] More specialized scenarios

### Advanced Mocking
- [ ] Snapshot testing data (deterministic faker seed)
- [ ] Performance testing data (large datasets)
- [ ] Relationship testing (entities with includes)
- [ ] Search/filter testing (query builder scenarios)

### Testing Utilities
- [ ] Custom matchers for FreshBooks responses
- [ ] Test data builders (fluent API)
- [ ] Mock data persistence (for integration tests)
- [ ] Visual regression test data

## Notes

- All mocks use @faker-js/faker for realistic data
- TypeScript types ensure type safety
- Factories support partial overrides for flexibility
- Response wrappers match actual FreshBooks API format
- Error mocks cover recoverable and non-recoverable scenarios
- Client mocks use vitest spies for assertion support
- Pagination helpers simplify multi-page testing
- All exports available via single import from `tests/mocks`
