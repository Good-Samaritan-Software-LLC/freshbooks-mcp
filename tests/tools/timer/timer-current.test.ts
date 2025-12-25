/**
 * Tests for timer_current tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { timerCurrentTool, timerCurrentHandler } from '../../../src/tools/timer/timer-current.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockActiveTimersResponse,
  mockTimeEntryEmptyListResponse,
  createMockActiveTimer,
} from '../../mocks/responses/time-entry.js';
import {
  mockUnauthorizedError,
  mockServerError,
} from '../../mocks/errors/freshbooks-errors.js';

// Mock the FreshBooks SDK query builders
vi.mock('@freshbooks/api', () => ({
  SearchQueryBuilder: class {
    private filters: any[] = [];
    boolean(field: string, value: boolean) {
      this.filters.push({ type: 'boolean', field, value });
      return this;
    }
    build() {
      return this.filters;
    }
  },
}));

describe('timer_current tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should return active timer when one is running', async () => {
      const mockResponse = mockActiveTimersResponse(1);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerCurrentHandler(
        { accountId: 'ABC123' },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.count).toBe(1);
      expect(result.activeTimers).toHaveLength(1);
      expect(result.activeTimers[0].active).toBe(true);
      expect(result.activeTimers[0].isLogged).toBe(false);
    });

    it('should return empty when no timer is running', async () => {
      const mockResponse = mockTimeEntryEmptyListResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerCurrentHandler(
        { accountId: 'ABC123' },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.count).toBe(0);
      expect(result.activeTimers).toHaveLength(0);
    });

    it('should return timer with project details', async () => {
      const mockResponse = mockActiveTimersResponse(1);
      mockResponse.data.timeEntries[0].projectId = 100;
      mockResponse.data.timeEntries[0].note = 'Working on feature X';

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerCurrentHandler(
        { accountId: 'ABC123' },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.activeTimers[0].projectId).toBe(100);
      expect(result.activeTimers[0].note).toBe('Working on feature X');
    });

    it('should return timer with client details', async () => {
      const mockResponse = mockActiveTimersResponse(1);
      mockResponse.data.timeEntries[0].clientId = 200;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerCurrentHandler(
        { accountId: 'ABC123' },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.activeTimers[0].clientId).toBe(200);
    });

    it('should return timer with startedAt timestamp', async () => {
      const startTime = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
      const mockResponse = mockActiveTimersResponse(1);
      mockResponse.data.timeEntries[0].startedAt = startTime;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerCurrentHandler(
        { accountId: 'ABC123' },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.activeTimers[0].startedAt).toBe(startTime);
    });

    it('should include timer object with isRunning flag', async () => {
      const mockResponse = mockActiveTimersResponse(1);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerCurrentHandler(
        { accountId: 'ABC123' },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.activeTimers[0].timer).toBeDefined();
      expect(result.activeTimers[0].timer?.isRunning).toBe(true);
    });

    it('should include billable status', async () => {
      const mockResponse = mockActiveTimersResponse(1);
      mockResponse.data.timeEntries[0].billable = true;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerCurrentHandler(
        { accountId: 'ABC123' },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.activeTimers[0].billable).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            list: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        timerCurrentHandler(
          { accountId: 'ABC123' },
          { accountId: 'ABC123', client: mockClient as any }
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            list: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        timerCurrentHandler(
          { accountId: 'ABC123' },
          { accountId: 'ABC123', client: mockClient as any }
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        timerCurrentHandler({} as any, { client: mockClient as any } as any)
      ).rejects.toThrow();
    });

    it('should reject empty accountId', async () => {
      await expect(
        timerCurrentHandler(
          { accountId: '' },
          { accountId: '', client: mockClient as any }
        )
      ).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle multiple concurrent timers (rare case)', async () => {
      const mockResponse = mockActiveTimersResponse(2);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerCurrentHandler(
        { accountId: 'ABC123' },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.count).toBe(2);
      expect(result.activeTimers).toHaveLength(2);
      expect(result.activeTimers[0].active).toBe(true);
      expect(result.activeTimers[1].active).toBe(true);
    });

    it('should handle timer with null optional fields', async () => {
      const mockResponse = mockActiveTimersResponse(1);
      mockResponse.data.timeEntries[0].projectId = null;
      mockResponse.data.timeEntries[0].clientId = null;
      mockResponse.data.timeEntries[0].note = null;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerCurrentHandler(
        { accountId: 'ABC123' },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.activeTimers[0].projectId).toBeNull();
      expect(result.activeTimers[0].clientId).toBeNull();
      expect(result.activeTimers[0].note).toBeNull();
    });

    it('should handle timer with unicode in note', async () => {
      const unicodeNote = '日本語作業 🎉 testing';
      const mockResponse = mockActiveTimersResponse(1);
      mockResponse.data.timeEntries[0].note = unicodeNote;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerCurrentHandler(
        { accountId: 'ABC123' },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.activeTimers[0].note).toBe(unicodeNote);
    });

    it('should handle timer started very recently (< 1 second)', async () => {
      const justNow = new Date().toISOString();
      const mockResponse = mockActiveTimersResponse(1);
      mockResponse.data.timeEntries[0].startedAt = justNow;
      mockResponse.data.timeEntries[0].duration = 0;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerCurrentHandler(
        { accountId: 'ABC123' },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.activeTimers[0].duration).toBe(0);
      expect(result.activeTimers[0].active).toBe(true);
    });

    it('should handle timer running for very long time', async () => {
      const longAgo = new Date(Date.now() - 86400000 * 7).toISOString(); // 7 days ago
      const mockResponse = mockActiveTimersResponse(1);
      mockResponse.data.timeEntries[0].startedAt = longAgo;
      mockResponse.data.timeEntries[0].duration = 86400 * 7; // 7 days in seconds

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerCurrentHandler(
        { accountId: 'ABC123' },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.activeTimers[0].duration).toBe(86400 * 7);
    });

    it('should return consistent count with array length', async () => {
      const mockResponse = mockActiveTimersResponse(3);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerCurrentHandler(
        { accountId: 'ABC123' },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.count).toBe(result.activeTimers.length);
      expect(result.count).toBe(3);
    });

    it('should handle timer with all optional associations', async () => {
      const mockResponse = mockActiveTimersResponse(1);
      mockResponse.data.timeEntries[0].projectId = 100;
      mockResponse.data.timeEntries[0].clientId = 200;
      mockResponse.data.timeEntries[0].serviceId = 300;
      mockResponse.data.timeEntries[0].taskId = 400;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerCurrentHandler(
        { accountId: 'ABC123' },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.activeTimers[0].projectId).toBe(100);
      expect(result.activeTimers[0].clientId).toBe(200);
      expect(result.activeTimers[0].serviceId).toBe(300);
      expect(result.activeTimers[0].taskId).toBe(400);
    });
  });
});
