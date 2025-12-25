/**
 * Tests for task_single tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { taskSingleTool } from '../../../src/tools/task/task-single.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import { createTask, createMoney } from '../../mocks/factories/task.factory.js';
import type { MockFreshBooksClientWrapper } from '../../mocks/client.js';

describe('task_single tool', () => {
  let mockClient: MockFreshBooksClientWrapper;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should retrieve a single task by ID', async () => {
      const task = createTask({ id: 123, name: 'Development' });
      const mockResponse = {
        ok: true,
        data: task,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskSingleTool.execute(
        { businessId: 12345, taskId: 123 },
        mockClient as any
      );

      expect(result.id).toBe(123);
      expect(result.name).toBe('Development');
    });

    it('should retrieve task with alternate field names', async () => {
      const task = createTask({
        id: 456,
        name: null,
        tname: 'Alternate Name',
        description: null,
        tdesc: 'Alternate Description',
      });
      const mockResponse = {
        ok: true,
        data: task,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskSingleTool.execute(
        { businessId: 12345, taskId: 456 },
        mockClient as any
      );

      expect(result.tname).toBe('Alternate Name');
      expect(result.tdesc).toBe('Alternate Description');
    });

    it('should retrieve billable task with rate', async () => {
      const task = createTask({
        id: 789,
        billable: true,
        rate: createMoney('125.00'),
      });
      const mockResponse = {
        ok: true,
        data: task,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskSingleTool.execute(
        { businessId: 12345, taskId: 789 },
        mockClient as any
      );

      expect(result.billable).toBe(true);
      expect(result.rate?.amount).toBe('125.00');
    });

    it('should retrieve non-billable task', async () => {
      const task = createTask({ id: 999, billable: false });
      const mockResponse = {
        ok: true,
        data: task,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskSingleTool.execute(
        { businessId: 12345, taskId: 999 },
        mockClient as any
      );

      expect(result.billable).toBe(false);
    });

    it('should retrieve archived task', async () => {
      const task = createTask({ id: 111, visState: 2 });
      const mockResponse = {
        ok: true,
        data: task,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskSingleTool.execute(
        { businessId: 12345, taskId: 111 },
        mockClient as any
      );

      expect(result.visState).toBe(2);
    });
  });

  describe('error handling', () => {
    it('should throw when task not found', async () => {
      const mockResponse = {
        ok: false,
        error: new Error('Task not found'),
      } as any;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      await expect(
        taskSingleTool.execute(
          { businessId: 12345, taskId: 99999 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(new Error('Unauthorized'));

      await expect(
        taskSingleTool.execute(
          { businessId: 12345, taskId: 123 },
          mockClient as any
        )
      ).rejects.toThrow('Unauthorized');
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(
        new Error('Internal Server Error')
      );

      await expect(
        taskSingleTool.execute(
          { businessId: 12345, taskId: 123 },
          mockClient as any
        )
      ).rejects.toThrow('Internal Server Error');
    });
  });

  describe('edge cases', () => {
    it('should handle unicode in task name', async () => {
      const task = createTask({ id: 222, name: 'テスト 📝' });
      const mockResponse = {
        ok: true,
        data: task,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskSingleTool.execute(
        { businessId: 12345, taskId: 222 },
        mockClient as any
      );

      expect(result.name).toBe('テスト 📝');
    });

    it('should handle task with different currency', async () => {
      const task = createTask({
        id: 333,
        rate: createMoney('95.00', 'EUR'),
      });
      const mockResponse = {
        ok: true,
        data: task,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskSingleTool.execute(
        { businessId: 12345, taskId: 333 },
        mockClient as any
      );

      expect(result.rate?.code).toBe('EUR');
    });

    it('should handle task with null description', async () => {
      const task = createTask({
        id: 444,
        description: null,
        tdesc: null,
      });
      const mockResponse = {
        ok: true,
        data: task,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskSingleTool.execute(
        { businessId: 12345, taskId: 444 },
        mockClient as any
      );

      expect(result.description).toBeNull();
      expect(result.tdesc).toBeNull();
    });
  });
});
