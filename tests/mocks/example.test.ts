/**
 * Example test demonstrating mock usage
 * This file shows how to use the mock factories, responses, and client
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  // Factories
  createTimeEntry,
  createActiveTimer,
  createProject,

  // Responses
  mockTimeEntryListResponse,
  mockTimeEntrySingleResponse,
  mockProjectSingleResponse,

  // Errors
  mockNotFoundError,
  mockValidationError,
  mockConcurrentTimerError,

  // Client
  createMockFreshBooksClient,
  setupMockResponse,
  setupMockError,
  resetMockClient,
} from './index';

describe('Mock System Examples', () => {
  describe('Factory Usage', () => {
    it('should create a time entry with defaults', () => {
      const entry = createTimeEntry();

      expect(entry.id).toBeGreaterThan(0);
      expect(entry.duration).toBeGreaterThanOrEqual(0);
      expect(entry.isLogged).toBeDefined();
    });

    it('should create a time entry with overrides', () => {
      const entry = createTimeEntry({
        id: 123,
        duration: 3600,
        note: 'Custom note',
        billable: true,
      });

      expect(entry.id).toBe(123);
      expect(entry.duration).toBe(3600);
      expect(entry.note).toBe('Custom note');
      expect(entry.billable).toBe(true);
    });

    it('should create specialized entities', () => {
      const timer = createActiveTimer();
      expect(timer.active).toBe(true);
      expect(timer.isLogged).toBe(false);
      expect(timer.duration).toBe(0);
      expect(timer.timer?.isRunning).toBe(true);

      const project = createProject({ title: 'My Project' });
      expect(project.title).toBe('My Project');
      expect(project.id).toBeGreaterThan(0);
    });
  });

  describe('Response Usage', () => {
    it('should create a list response', () => {
      const response = mockTimeEntryListResponse(5);

      expect(response.ok).toBe(true);
      expect(response.data?.timeEntries).toHaveLength(5);
      expect(response.data?.pages.total).toBe(5);
      expect(response.data?.pages.page).toBe(1);
    });

    it('should create a single response', () => {
      const response = mockTimeEntrySingleResponse({ id: 123 });

      expect(response.ok).toBe(true);
      expect(response.data?.timeEntry.id).toBe(123);
    });

    it('should create pagination responses', () => {
      const response = mockTimeEntryListResponse(100, 2, 30);

      expect(response.data?.pages.page).toBe(2);
      expect(response.data?.pages.total).toBe(100);
      expect(response.data?.pages.pages).toBe(4); // ceil(100/30)
      expect(response.data?.timeEntries).toHaveLength(30);
    });
  });

  describe('Error Usage', () => {
    it('should create not found error', () => {
      const error = mockNotFoundError('TimeEntry', 999);

      expect(error.ok).toBe(false);
      expect(error.error?.code).toBe('NOT_FOUND');
      expect(error.error?.message).toContain('999');
    });

    it('should create validation error', () => {
      const error = mockValidationError('duration', 'Must be positive');

      expect(error.ok).toBe(false);
      expect(error.error?.code).toBe('VALIDATION_ERROR');
      expect(error.error?.field).toBe('duration');
    });

    it('should create business logic error', () => {
      const error = mockConcurrentTimerError();

      expect(error.ok).toBe(false);
      expect(error.error?.message).toContain('timer');
    });
  });

  describe('Mock Client Usage', () => {
    let mockClient: ReturnType<typeof createMockFreshBooksClient>;

    beforeEach(() => {
      mockClient = createMockFreshBooksClient();
    });

    it('should setup and call mock responses', async () => {
      // Setup the mock
      setupMockResponse(
        mockClient,
        'timeEntries',
        'list',
        mockTimeEntryListResponse(3)
      );

      // Call the mock
      const result = await mockClient.timeEntries.list('ABC123');

      // Verify
      expect(result.ok).toBe(true);
      expect(result.data?.timeEntries).toHaveLength(3);
      expect(mockClient.timeEntries.list).toHaveBeenCalledTimes(1);
      expect(mockClient.timeEntries.list).toHaveBeenCalledWith('ABC123');
    });

    it('should setup and call mock errors', async () => {
      // Setup the mock error
      setupMockError(
        mockClient,
        'projects',
        'single',
        mockNotFoundError('Project', 999)
      );

      // Call the mock
      const result = await mockClient.projects.single('ABC123', 999);

      // Verify
      expect(result.ok).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
      expect(mockClient.projects.single).toHaveBeenCalledTimes(1);
    });

    it('should reset mocks between tests', () => {
      setupMockResponse(
        mockClient,
        'timeEntries',
        'list',
        mockTimeEntryListResponse(5)
      );

      expect(mockClient.timeEntries.list).toHaveBeenCalledTimes(0);

      resetMockClient(mockClient);

      expect(mockClient.timeEntries.list).toHaveBeenCalledTimes(0);
    });
  });

  describe('Complex Scenarios', () => {
    let mockClient: ReturnType<typeof createMockFreshBooksClient>;

    beforeEach(() => {
      mockClient = createMockFreshBooksClient();
    });

    it('should test pagination flow', async () => {
      // Setup sequence of responses
      setupMockResponse(
        mockClient,
        'timeEntries',
        'list',
        mockTimeEntryListResponse(100, 1, 30)
      );

      const page1 = await mockClient.timeEntries.list('ABC123', { page: 1 });
      expect(page1.data?.pages.page).toBe(1);
      expect(page1.data?.timeEntries).toHaveLength(30);

      // Setup next page
      setupMockResponse(
        mockClient,
        'timeEntries',
        'list',
        mockTimeEntryListResponse(100, 2, 30)
      );

      const page2 = await mockClient.timeEntries.list('ABC123', { page: 2 });
      expect(page2.data?.pages.page).toBe(2);
      expect(page2.data?.timeEntries).toHaveLength(30);
    });

    it('should test mixed success and error', async () => {
      // First call succeeds
      setupMockResponse(
        mockClient,
        'timeEntries',
        'single',
        mockTimeEntrySingleResponse({ id: 123 })
      );

      const success = await mockClient.timeEntries.single('ABC123', 123);
      expect(success.ok).toBe(true);

      // Second call fails
      setupMockError(
        mockClient,
        'timeEntries',
        'single',
        mockNotFoundError('TimeEntry', 999)
      );

      const error = await mockClient.timeEntries.single('ABC123', 999);
      expect(error.ok).toBe(false);

      expect(mockClient.timeEntries.single).toHaveBeenCalledTimes(2);
    });
  });
});
