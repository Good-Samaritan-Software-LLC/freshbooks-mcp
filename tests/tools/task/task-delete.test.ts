/**
 * Tests for task_delete tool
 *
 * NOTE: The tool documentation warns users to prefer archiving (visState=1) over deletion.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { taskDeleteTool } from '../../../src/tools/task/task-delete.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import type { MockFreshBooksClientWrapper } from '../../mocks/client.js';

describe('task_delete tool', () => {
  let mockClient: MockFreshBooksClientWrapper;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful deletion', () => {
    it('should delete task successfully', async () => {
      const mockResponse = {
        ok: true,
        data: {},
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskDeleteTool.execute(
        { businessId: 12345, taskId: 123 },
        mockClient as any
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('123');
      expect(result.message).toContain('deleted');
    });

    it('should return success message with task ID', async () => {
      const mockResponse = {
        ok: true,
        data: {},
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskDeleteTool.execute(
        { businessId: 12345, taskId: 999 },
        mockClient as any
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('999');
    });

    it('should handle deletion of different task IDs', async () => {
      const mockResponse = {
        ok: true,
        data: {},
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskDeleteTool.execute(
        { businessId: 12345, taskId: 456 },
        mockClient as any
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('456');
    });
  });

  describe('error handling', () => {
    it('should handle task not found error', async () => {
      const mockResponse = {
        ok: false,
        error: new Error('Task not found'),
      } as any;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      await expect(
        taskDeleteTool.execute(
          { businessId: 12345, taskId: 99999 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(new Error('Unauthorized'));

      await expect(
        taskDeleteTool.execute(
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
        taskDeleteTool.execute(
          { businessId: 12345, taskId: 123 },
          mockClient as any
        )
      ).rejects.toThrow('Internal Server Error');
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(new Error('ETIMEDOUT'));

      await expect(
        taskDeleteTool.execute(
          { businessId: 12345, taskId: 123 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle deletion of task with time entries (warning scenario)', async () => {
      // This tests that the tool executes deletion even when it might not be advisable
      const mockResponse = {
        ok: true,
        data: {},
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskDeleteTool.execute(
        { businessId: 12345, taskId: 789 },
        mockClient as any
      );

      expect(result.success).toBe(true);
      // Note: In real usage, the tool should warn users before this operation
    });

    it('should handle deletion of already deleted task', async () => {
      const mockResponse = {
        ok: false,
        error: new Error('Task not found'),
      } as any;

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      await expect(
        taskDeleteTool.execute(
          { businessId: 12345, taskId: 111 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle deletion of archived task', async () => {
      // Archived tasks can still be deleted
      const mockResponse = {
        ok: true,
        data: {},
      };

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          tasks: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await taskDeleteTool.execute(
        { businessId: 12345, taskId: 222 },
        mockClient as any
      );

      expect(result.success).toBe(true);
    });
  });
});
