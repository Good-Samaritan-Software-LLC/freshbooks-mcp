# Changelog

All notable changes to the FreshBooks MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-21

### Added

#### Core Features
- OAuth2 authentication flow with automatic token refresh
- Secure token storage and management
- Multi-account support with account selection

#### Time Tracking Tools
- `timeentry_list` - List time entries with filtering and pagination
- `timeentry_single` - Get single time entry by ID
- `timeentry_create` - Create new time entry
- `timeentry_update` - Update existing time entry
- `timeentry_delete` - Delete time entry

#### Timer Management Tools
- `timer_start` - Start new timer for active time tracking
- `timer_stop` - Stop running timer and log time
- `timer_current` - Get currently running timer
- `timer_discard` - Delete timer without logging time

#### Project Management Tools
- `project_list` - List projects with filtering
- `project_single` - Get single project by ID
- `project_create` - Create new project
- `project_update` - Update existing project
- `project_delete` - Delete project

#### Service Management Tools
- `service_list` - List billable services
- `service_single` - Get single service by ID
- `service_create` - Create new service
- `service_rate_get` - Get service billing rate
- `service_rate_set` - Set/update service billing rate

#### Task Management Tools
- `task_list` - List project tasks
- `task_single` - Get single task by ID
- `task_create` - Create new task
- `task_update` - Update existing task
- `task_delete` - Delete task

#### Authentication Tools
- `auth_status` - Check authentication status
- `auth_get_url` - Get OAuth authorization URL
- `auth_exchange_code` - Exchange auth code for tokens
- `auth_refresh` - Manually refresh access token

#### Error Handling
- Comprehensive error normalization to MCP format
- Preservation of original FreshBooks error details
- Recoverable error detection with suggestions
- Validation error details with field-level feedback
- Network error handling with retry guidance

#### Documentation
- Complete API reference for all tools
- Schema documentation with examples
- Error code reference with recovery guidance
- Authentication flow documentation
- Claude-optimized tool descriptions
- Usage examples and workflows

#### Developer Features
- TypeScript with full type safety
- Zod schema validation for all inputs/outputs
- Comprehensive test coverage requirements
- Consistent tool naming convention
- Modular agent-based development architecture
- SDK sync monitoring

### Technical Details

#### Dependencies
- @freshbooks/api: ^4.1.0 (FreshBooks Node.js SDK)
- @modelcontextprotocol/sdk: ^1.0.0 (MCP TypeScript SDK)
- zod: ^3.22.0 (Runtime validation)

#### Architecture
- Modular tool structure (`src/tools/{entity}/{entity}-{operation}.ts`)
- Centralized error handling with normalization
- FreshBooks client wrapper with retry logic
- Secure OAuth2 flow with PKCE
- Automatic token refresh
- Comprehensive logging (stderr only)

#### Tool Coverage
- **MVP Priority Complete:**
  - TimeEntry (5 tools)
  - Timer (4 tools)
  - Project (5 tools)
  - Service (5 tools)
  - Task (5 tools)
  - Authentication (4 tools)
- **Total:** 28 tools

#### Data Models
- TimeEntry with embedded Timer support
- Project with billing configuration
- Service with rate sub-resource
- Task with Money type support
- Standardized pagination across all list operations
- Visibility state (visState) support for soft-delete

### Known Limitations

- Services are immutable after creation (FreshBooks API limitation)
- Only one active timer per user (FreshBooks limitation)
- Timer cannot be paused/resumed, only started and stopped
- Maximum perPage of 100 for all list operations
- Business ID required for service/task operations (different from account ID)

### Security

- OAuth2 authorization code flow with PKCE
- Secure token storage with encryption at rest
- Automatic token refresh before expiration
- No token logging or exposure in errors
- HTTPS required for OAuth redirect URIs in production

### Documentation

- Complete API reference: `docs/api/`
  - index.md - Tool index and overview
  - time-entries.md - TimeEntry tools
  - timers.md - Timer tools
  - projects.md - Project tools
  - services.md - Service tools
  - tasks.md - Task tools
  - authentication.md - OAuth flow
  - errors.md - Error codes and handling
  - schemas.md - Schema reference
- Claude documentation: `docs/claude/`
- Setup guide: `docs/AUTH_SETUP.md`
- SDK manifest: `sdk-manifest.json`

### Testing

- Test framework: Vitest
- Coverage requirement: 100% for all tools
- Mock factories for all FreshBooks entities
- Integration test patterns
- Error scenario coverage

---

## Version History

### Unreleased

No unreleased changes.

---

## Migration Guide

### From No Version to 1.0.0

This is the initial release. No migration needed.

---

## Deprecation Notices

None.

---

## Breaking Changes

None (initial release).

---

## Contributors

See AUTHORS file or git history for contributors.

---

## Links

- [FreshBooks API Documentation](https://www.freshbooks.com/api)
- [FreshBooks Node.js SDK](https://github.com/freshbooks/freshbooks-nodejs-sdk)
- [MCP Specification](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

---

## Support

For issues, please file a GitHub issue with:
- Tool name
- Input parameters
- Expected vs actual behavior
- Error code and message
- FreshBooks SDK version (from package.json)

For questions about FreshBooks API behavior, consult the official FreshBooks API documentation.
