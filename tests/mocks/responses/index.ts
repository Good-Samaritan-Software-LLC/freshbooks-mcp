/**
 * Mock response wrappers for FreshBooks API
 * Export all response mock functions
 */

// Pagination helper
export { createPaginationMeta } from './time-entry.responses';

// Time Entry responses
export {
  mockTimeEntrySingleResponse,
  mockTimeEntryListResponse,
  mockTimeEntryEmptyListResponse,
  mockTimeEntryCreateResponse,
  mockTimeEntryUpdateResponse,
  mockTimeEntryDeleteResponse,
  mockTimeEntryFirstPage,
  mockTimeEntryMiddlePage,
  mockTimeEntryLastPage,
  mockTimeEntryBeyondLastPage,
  mockActiveTimerResponse,
  mockNoActiveTimerResponse,
} from './time-entry.responses';

// Project responses
export {
  mockProjectSingleResponse,
  mockProjectListResponse,
  mockProjectEmptyListResponse,
  mockProjectCreateResponse,
  mockProjectUpdateResponse,
  mockProjectDeleteResponse,
  mockProjectFirstPage,
  mockProjectMiddlePage,
  mockProjectLastPage,
  mockProjectBeyondLastPage,
} from './project.responses';

// Service responses
export {
  mockServiceSingleResponse,
  mockServiceListResponse,
  mockServiceEmptyListResponse,
  mockServiceCreateResponse,
  mockServiceDeleteResponse,
  mockServiceFirstPage,
  mockServiceMiddlePage,
  mockServiceLastPage,
  mockServiceBeyondLastPage,
} from './service.responses';

// Task responses
export {
  mockTaskSingleResponse,
  mockTaskListResponse,
  mockTaskEmptyListResponse,
  mockTaskCreateResponse,
  mockTaskUpdateResponse,
  mockTaskDeleteResponse,
  mockTaskFirstPage,
  mockTaskMiddlePage,
  mockTaskLastPage,
  mockTaskBeyondLastPage,
} from './task.responses';
