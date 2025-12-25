/**
 * Tests for timer_start tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { timerStartTool, timerStartHandler } from '../../../src/tools/timer/timer-start.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  createMockActiveTimer,
  mockTimeEntryCreateResponse,
} from '../../mocks/responses/time-entry.js';
import {
  mockUnauthorizedError,
  mockConflictError,
  mockServerError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('timer_start tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful timer start', () => {
    it('should start a timer successfully with minimal input', async () => {
      const mockResponse = mockTimeEntryCreateResponse({
        duration: 0,
        active: true,
        isLogged: false,
        timer: { id: 55555, isRunning: true },
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerStartHandler(
        { accountId: 'ABC123' },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.active).toBe(true);
      expect(result.duration).toBe(0);
      expect(result.isLogged).toBe(false);
      expect(result.timer?.isRunning).toBe(true);
    });

    it('should start a timer with project association', async () => {
      const mockResponse = mockTimeEntryCreateResponse({
        duration: 0,
        active: true,
        isLogged: false,
        projectId: 100,
        timer: { id: 55555, isRunning: true },
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerStartHandler(
        { accountId: 'ABC123', projectId: 100 },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.projectId).toBe(100);
      expect(result.active).toBe(true);
    });

    it('should start a timer with client association', async () => {
      const mockResponse = mockTimeEntryCreateResponse({
        duration: 0,
        active: true,
        isLogged: false,
        clientId: 200,
        timer: { id: 55555, isRunning: true },
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerStartHandler(
        { accountId: 'ABC123', clientId: 200 },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.clientId).toBe(200);
      expect(result.active).toBe(true);
    });

    it('should start a timer with note', async () => {
      const mockResponse = mockTimeEntryCreateResponse({
        duration: 0,
        active: true,
        isLogged: false,
        note: 'Working on feature development',
        timer: { id: 55555, isRunning: true },
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerStartHandler(
        { accountId: 'ABC123', note: 'Working on feature development' },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.note).toBe('Working on feature development');
      expect(result.active).toBe(true);
    });

    it('should start a timer with all optional fields', async () => {
      const mockResponse = mockTimeEntryCreateResponse({
        duration: 0,
        active: true,
        isLogged: false,
        projectId: 100,
        clientId: 200,
        serviceId: 300,
        taskId: 400,
        note: 'Full timer details',
        billable: true,
        internal: false,
        timer: { id: 55555, isRunning: true },
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerStartHandler(
        {
          accountId: 'ABC123',
          projectId: 100,
          clientId: 200,
          serviceId: 300,
          taskId: 400,
          note: 'Full timer details',
          billable: true,
          internal: false,
        },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.projectId).toBe(100);
      expect(result.clientId).toBe(200);
      expect(result.serviceId).toBe(300);
      expect(result.taskId).toBe(400);
      expect(result.note).toBe('Full timer details');
      expect(result.billable).toBe(true);
      expect(result.internal).toBe(false);
    });

    it('should start a non-billable timer', async () => {
      const mockResponse = mockTimeEntryCreateResponse({
        duration: 0,
        active: true,
        isLogged: false,
        billable: false,
        timer: { id: 55555, isRunning: true },
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerStartHandler(
        { accountId: 'ABC123', billable: false },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.billable).toBe(false);
    });

    it('should start an internal timer', async () => {
      const mockResponse = mockTimeEntryCreateResponse({
        duration: 0,
        active: true,
        isLogged: false,
        internal: true,
        timer: { id: 55555, isRunning: true },
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerStartHandler(
        { accountId: 'ABC123', internal: true },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.internal).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle already running timer conflict', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            create: vi.fn().mockResolvedValue(
              mockConflictError('Timer', 'active')
            ),
          },
        };
        return apiCall(client);
      });

      await expect(
        timerStartHandler(
          { accountId: 'ABC123' },
          { accountId: 'ABC123', client: mockClient as any }
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            create: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        timerStartHandler(
          { accountId: 'ABC123' },
          { accountId: 'ABC123', client: mockClient as any }
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            create: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        timerStartHandler(
          { accountId: 'ABC123' },
          { accountId: 'ABC123', client: mockClient as any }
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        timerStartHandler({} as any, { client: mockClient as any } as any)
      ).rejects.toThrow();
    });

    it('should reject empty accountId', async () => {
      await expect(
        timerStartHandler(
          { accountId: '' },
          { accountId: '', client: mockClient as any }
        )
      ).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty note', async () => {
      const mockResponse = mockTimeEntryCreateResponse({
        duration: 0,
        active: true,
        isLogged: false,
        note: '',
        timer: { id: 55555, isRunning: true },
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerStartHandler(
        { accountId: 'ABC123', note: '' },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.note).toBe('');
    });

    it('should handle unicode characters in note', async () => {
      const unicodeNote = '日本語 🎉 émojis';
      const mockResponse = mockTimeEntryCreateResponse({
        duration: 0,
        active: true,
        isLogged: false,
        note: unicodeNote,
        timer: { id: 55555, isRunning: true },
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerStartHandler(
        { accountId: 'ABC123', note: unicodeNote },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.note).toBe(unicodeNote);
    });

    it('should handle very long note', async () => {
      const longNote = 'A'.repeat(1000);
      const mockResponse = mockTimeEntryCreateResponse({
        duration: 0,
        active: true,
        isLogged: false,
        note: longNote,
        timer: { id: 55555, isRunning: true },
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerStartHandler(
        { accountId: 'ABC123', note: longNote },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.note).toBe(longNote);
    });

    it('should verify timer object structure', async () => {
      const mockResponse = mockTimeEntryCreateResponse({
        duration: 0,
        active: true,
        isLogged: false,
        timer: { id: 99999, isRunning: true },
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerStartHandler(
        { accountId: 'ABC123' },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.timer).toBeDefined();
      expect(result.timer?.id).toBe(99999);
      expect(result.timer?.isRunning).toBe(true);
    });
  });
});
