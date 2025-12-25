/**
 * Mock data and response factories for FreshBooks MCP Server testing
 *
 * This module provides comprehensive mock factories for:
 * - Entity data (TimeEntry, Project, Service, Task, etc.)
 * - API responses (success and error scenarios)
 * - OAuth authentication flows
 * - FreshBooks SDK client
 *
 * Usage:
 * ```typescript
 * import {
 *   createTimeEntry,
 *   mockTimeEntryListResponse,
 *   mockNotFoundError,
 *   createMockFreshBooksClient,
 * } from '../mocks';
 *
 * const entry = createTimeEntry({ duration: 3600 });
 * const response = mockTimeEntryListResponse(10);
 * const error = mockNotFoundError('TimeEntry', 123);
 * const client = createMockFreshBooksClient();
 * ```
 */

// Re-export all factories
export * from './factories';

// Re-export all response mocks
export * from './responses';

// Re-export all error mocks
export * from './errors';

// Re-export auth mocks
export * from './auth';

// Re-export client mocks
export * from './client';
