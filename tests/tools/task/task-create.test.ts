/**
 * Tests for task_create tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { taskCreateTool } from '../../../src/tools/task/task-create.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import { createTask } from '../../mocks/factories/task.factory.js';
import type { MockFreshBooksClientWrapper } from '../../mocks/client.js';

describe('task_create tool', () => {
  let mockClient: MockFreshBooksClientWrapper;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful creation', () => {
    it('should create billable task with name only', async () => {
      const task = createTask({ name: 'Development', billable: true });
      const mockResponse = {
        ok: true,
        data: task,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskCreateTool.execute(
        { businessId: 12345, name: 'Development' },
        mockClient as any
      );

      expect(result.name).toBe('Development');
      expect(result.billable).toBe(true);
    });

    it('should create task with description', async () => {
      const task = createTask({
        name: 'Testing',
        description: 'Quality assurance tasks',
      });
      const mockResponse = {
        ok: true,
        data: task,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskCreateTool.execute(
        {
          businessId: 12345,
          name: 'Testing',
          description: 'Quality assurance tasks',
        },
        mockClient as any
      );

      expect(result.description).toBe('Quality assurance tasks');
    });

    it('should create task with rate', async () => {
      const task = createTask({
        name: 'Consulting',
        rate: { amount: '150.00', code: 'USD' },
      });
      const mockResponse = {
        ok: true,
        data: task,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskCreateTool.execute(
        {
          businessId: 12345,
          name: 'Consulting',
          rate: { amount: '150.00', code: 'USD' },
        },
        mockClient as any
      );

      expect(result.rate?.amount).toBe('150.00');
      expect(result.rate?.code).toBe('USD');
    });

    it('should create non-billable task', async () => {
      const task = createTask({ name: 'Internal Meeting', billable: false });
      const mockResponse = {
        ok: true,
        data: task,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskCreateTool.execute(
        { businessId: 12345, name: 'Internal Meeting', billable: false },
        mockClient as any
      );

      expect(result.billable).toBe(false);
    });

    it('should create task with all fields', async () => {
      const task = createTask({
        name: 'Full Task',
        description: 'Complete task setup',
        billable: true,
        rate: { amount: '125.00', code: 'USD' },
      });
      const mockResponse = {
        ok: true,
        data: task,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskCreateTool.execute(
        {
          businessId: 12345,
          name: 'Full Task',
          description: 'Complete task setup',
          billable: true,
          rate: { amount: '125.00', code: 'USD' },
        },
        mockClient as any
      );

      expect(result.name).toBe('Full Task');
      expect(result.description).toBe('Complete task setup');
      expect(result.billable).toBe(true);
      expect(result.rate?.amount).toBe('125.00');
    });

    it('should create task with EUR currency', async () => {
      const task = createTask({
        name: 'European Project',
        rate: { amount: '95.00', code: 'EUR' },
      });
      const mockResponse = {
        ok: true,
        data: task,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskCreateTool.execute(
        {
          businessId: 12345,
          name: 'European Project',
          rate: { amount: '95.00', code: 'EUR' },
        },
        mockClient as any
      );

      expect(result.rate?.code).toBe('EUR');
    });
  });

  describe('error handling', () => {
    it('should handle validation error for empty name', async () => {
      const mockResponse = {
        ok: false,
        error: new Error('Name is required'),
      } as any;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      await expect(
        taskCreateTool.execute(
          { businessId: 12345, name: '' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle duplicate task error', async () => {
      const mockResponse = {
        ok: false,
        error: new Error('Task already exists'),
      } as any;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      await expect(
        taskCreateTool.execute(
          { businessId: 12345, name: 'Duplicate' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(new Error('Unauthorized'));

      await expect(
        taskCreateTool.execute(
          { businessId: 12345, name: 'Test Task' },
          mockClient as any
        )
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('edge cases', () => {
    it('should handle unicode characters in name', async () => {
      const task = createTask({ name: 'タスク 🎯' });
      const mockResponse = {
        ok: true,
        data: task,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskCreateTool.execute(
        { businessId: 12345, name: 'タスク 🎯' },
        mockClient as any
      );

      expect(result.name).toBe('タスク 🎯');
    });

    it('should handle very long task name', async () => {
      const longName = 'A'.repeat(255);
      const task = createTask({ name: longName });
      const mockResponse = {
        ok: true,
        data: task,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskCreateTool.execute(
        { businessId: 12345, name: longName },
        mockClient as any
      );

      expect(result.name).toBe(longName);
    });

    it('should handle zero rate', async () => {
      const task = createTask({
        name: 'Zero Rate Task',
        rate: { amount: '0.00', code: 'USD' },
      });
      const mockResponse = {
        ok: true,
        data: task,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskCreateTool.execute(
        {
          businessId: 12345,
          name: 'Zero Rate Task',
          rate: { amount: '0.00', code: 'USD' },
        },
        mockClient as any
      );

      expect(result.rate?.amount).toBe('0.00');
    });

    it('should handle very large rate values', async () => {
      const task = createTask({
        name: 'High Rate Task',
        rate: { amount: '9999.99', code: 'USD' },
      });
      const mockResponse = {
        ok: true,
        data: task,
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskCreateTool.execute(
        {
          businessId: 12345,
          name: 'High Rate Task',
          rate: { amount: '9999.99', code: 'USD' },
        },
        mockClient as any
      );

      expect(result.rate?.amount).toBe('9999.99');
    });
  });
});
