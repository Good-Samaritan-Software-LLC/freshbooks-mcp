/**
 * Tests for task_list tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { taskListTool } from '../../../src/tools/task/task-list.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import { createTaskList, createTask } from '../../mocks/factories/task.factory.js';
import type { MockFreshBooksClientWrapper } from '../../mocks/client.js';

describe('task_list tool', () => {
  let mockClient: MockFreshBooksClientWrapper;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should list tasks with default pagination', async () => {
      const tasks = createTaskList(10);
      const mockResponse = {
        ok: true,
        data: {
          tasks,
          pages: { page: 1, pages: 1, perPage: 30, total: 10 },
        },
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskListTool.execute(
        { businessId: 12345 },
        mockClient as any
      );

      expect(result.tasks).toHaveLength(10);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.perPage).toBe(30);
    });

    it('should list tasks with custom pagination', async () => {
      const tasks = createTaskList(5);
      const mockResponse = {
        ok: true,
        data: {
          tasks,
          pages: { page: 2, pages: 3, perPage: 5, total: 15 },
        },
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskListTool.execute(
        { businessId: 12345, page: 2, perPage: 5 },
        mockClient as any
      );

      expect(result.tasks).toHaveLength(5);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.perPage).toBe(5);
    });

    it('should return empty array when no tasks exist', async () => {
      const mockResponse = {
        ok: true,
        data: {
          tasks: [],
          pages: { page: 1, pages: 1, perPage: 30, total: 0 },
        },
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskListTool.execute(
        { businessId: 12345 },
        mockClient as any
      );

      expect(result.tasks).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should handle maximum pagination value', async () => {
      const tasks = createTaskList(100);
      const mockResponse = {
        ok: true,
        data: {
          tasks,
          pages: { page: 1, pages: 1, perPage: 100, total: 100 },
        },
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskListTool.execute(
        { businessId: 12345, perPage: 100 },
        mockClient as any
      );

      expect(result.tasks).toHaveLength(100);
    });
  });

  describe('error handling', () => {
    it('should throw error when API returns not ok', async () => {
      const mockResponse = {
        ok: false,
        error: new Error('API Error'),
      } as any;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      await expect(
        taskListTool.execute({ businessId: 12345 }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(new Error('Unauthorized'));

      await expect(
        taskListTool.execute({ businessId: 12345 }, mockClient as any)
      ).rejects.toThrow('Unauthorized');
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(new Error('ETIMEDOUT'));

      await expect(
        taskListTool.execute({ businessId: 12345 }, mockClient as any)
      ).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle tasks with different visStates', async () => {
      const tasks = [
        ...createTaskList(3, { visState: 0 }), // active
        ...createTaskList(2, { visState: 2 }), // archived
      ];
      const mockResponse = {
        ok: true,
        data: {
          tasks,
          pages: { page: 1, pages: 1, perPage: 30, total: 5 },
        },
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskListTool.execute(
        { businessId: 12345 },
        mockClient as any
      );

      expect(result.tasks).toHaveLength(5);
    });

    it('should handle tasks with alternate field names', async () => {
      const tasks = [
        createTask({ id: 1, name: 'Task Name', tname: 'Task Name' }),
        createTask({ id: 2, name: null, tname: 'Alternate Name' }),
      ];
      const mockResponse = {
        ok: true,
        data: {
          tasks,
          pages: { page: 1, pages: 1, perPage: 30, total: 2 },
        },
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskListTool.execute(
        { businessId: 12345 },
        mockClient as any
      );

      expect(result.tasks).toHaveLength(2);
      expect(result.tasks[1].tname).toBe('Alternate Name');
    });

    it('should handle unicode in task names', async () => {
      const tasks = createTaskList(1, { name: 'タスク 📝' });
      const mockResponse = {
        ok: true,
        data: {
          tasks,
          pages: { page: 1, pages: 1, perPage: 30, total: 1 },
        },
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskListTool.execute(
        { businessId: 12345 },
        mockClient as any
      );

      expect(result.tasks[0].name).toBe('タスク 📝');
    });

    it('should handle billable and non-billable tasks', async () => {
      const tasks = [
        ...createTaskList(5, { billable: true }),
        ...createTaskList(3, { billable: false }),
      ];
      const mockResponse = {
        ok: true,
        data: {
          tasks,
          pages: { page: 1, pages: 1, perPage: 30, total: 8 },
        },
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            list: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskListTool.execute(
        { businessId: 12345 },
        mockClient as any
      );

      expect(result.tasks).toHaveLength(8);
    });
  });
});
