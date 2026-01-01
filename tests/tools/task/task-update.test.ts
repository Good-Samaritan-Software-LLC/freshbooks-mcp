/**
 * Tests for task_update tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { taskUpdateTool } from '../../../src/tools/task/task-update.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import { createTask } from '../../mocks/factories/task.factory.js';
import type { MockFreshBooksClientWrapper } from '../../mocks/client.js';

describe('task_update tool', () => {
  let mockClient: MockFreshBooksClientWrapper;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful updates', () => {
    it('should update task name', async () => {
      const task = createTask({ id: 123, name: 'Updated Name' });
      const mockResponse = {
        ok: true,
        data: task,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskUpdateTool.execute(
        { businessId: 12345, taskId: 123, name: 'Updated Name' },
        mockClient as any
      );

      expect(result.name).toBe('Updated Name');
    });

    it('should update task description', async () => {
      const task = createTask({ id: 123, description: 'New description' });
      const mockResponse = {
        ok: true,
        data: task,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskUpdateTool.execute(
        { businessId: 12345, taskId: 123, description: 'New description' },
        mockClient as any
      );

      expect(result.description).toBe('New description');
    });

    it('should update task rate', async () => {
      const task = createTask({
        id: 123,
        rate: { amount: '175.00', code: 'USD' },
      });
      const mockResponse = {
        ok: true,
        data: task,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskUpdateTool.execute(
        {
          businessId: 12345,
          taskId: 123,
          rate: { amount: '175.00', code: 'USD' },
        },
        mockClient as any
      );

      expect(result.rate?.amount).toBe('175.00');
    });

    it('should update billable status', async () => {
      const task = createTask({ id: 123, billable: false });
      const mockResponse = {
        ok: true,
        data: task,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskUpdateTool.execute(
        { businessId: 12345, taskId: 123, billable: false },
        mockClient as any
      );

      expect(result.billable).toBe(false);
    });

    it('should archive task using visState', async () => {
      const task = createTask({ id: 123, visState: 2 });
      const mockResponse = {
        ok: true,
        data: task,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskUpdateTool.execute(
        { businessId: 12345, taskId: 123, visState: 2 },
        mockClient as any
      );

      expect(result.visState).toBe(2);
    });

    it('should update multiple fields simultaneously', async () => {
      const task = createTask({
        id: 123,
        name: 'Updated',
        description: 'Updated description',
        billable: true,
        rate: { amount: '200.00', code: 'USD' },
      });
      const mockResponse = {
        ok: true,
        data: task,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskUpdateTool.execute(
        {
          businessId: 12345,
          taskId: 123,
          name: 'Updated',
          description: 'Updated description',
          billable: true,
          rate: { amount: '200.00', code: 'USD' },
        },
        mockClient as any
      );

      expect(result.name).toBe('Updated');
      expect(result.description).toBe('Updated description');
      expect(result.billable).toBe(true);
      expect(result.rate?.amount).toBe('200.00');
    });

    it('should update rate currency', async () => {
      const task = createTask({
        id: 123,
        rate: { amount: '85.00', code: 'EUR' },
      });
      const mockResponse = {
        ok: true,
        data: task,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskUpdateTool.execute(
        {
          businessId: 12345,
          taskId: 123,
          rate: { amount: '85.00', code: 'EUR' },
        },
        mockClient as any
      );

      expect(result.rate?.code).toBe('EUR');
    });
  });

  describe('error handling', () => {
    it('should handle task not found', async () => {
      const mockResponse = {
        ok: false,
        error: new Error('Task not found'),
      } as any;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      await expect(
        taskUpdateTool.execute(
          { businessId: 12345, taskId: 99999, name: 'Test' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(new Error('Unauthorized'));

      await expect(
        taskUpdateTool.execute(
          { businessId: 12345, taskId: 123, name: 'Test' },
          mockClient as any
        )
      ).rejects.toThrow('Unauthorized');
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(
        new Error('Internal Server Error')
      );

      await expect(
        taskUpdateTool.execute(
          { businessId: 12345, taskId: 123, name: 'Test' },
          mockClient as any
        )
      ).rejects.toThrow('Internal Server Error');
    });
  });

  describe('edge cases', () => {
    it('should handle unicode in name', async () => {
      const task = createTask({ id: 123, name: 'アップデート 🔄' });
      const mockResponse = {
        ok: true,
        data: task,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskUpdateTool.execute(
        { businessId: 12345, taskId: 123, name: 'アップデート 🔄' },
        mockClient as any
      );

      expect(result.name).toBe('アップデート 🔄');
    });

    it('should handle alternate field names in response', async () => {
      const task = createTask({
        id: 123,
        name: null,
        tname: 'Alternate Name',
      });
      const mockResponse = {
        ok: true,
        data: task,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskUpdateTool.execute(
        { businessId: 12345, taskId: 123, name: 'Alternate Name' },
        mockClient as any
      );

      expect(result.tname).toBe('Alternate Name');
    });

    it('should handle archiving instead of deleting', async () => {
      const task = createTask({ id: 123, visState: 1 });
      const mockResponse = {
        ok: true,
        data: task,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskUpdateTool.execute(
        { businessId: 12345, taskId: 123, visState: 1 },
        mockClient as any
      );

      expect(result.visState).toBe(1);
    });

    it('should handle updating rate to zero', async () => {
      const task = createTask({
        id: 123,
        rate: { amount: '0.00', code: 'USD' },
      });
      const mockResponse = {
        ok: true,
        data: task,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskUpdateTool.execute(
        {
          businessId: 12345,
          taskId: 123,
          rate: { amount: '0.00', code: 'USD' },
        },
        mockClient as any
      );

      expect(result.rate?.amount).toBe('0.00');
    });
  });
});
