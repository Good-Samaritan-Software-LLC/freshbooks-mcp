/**
 * Tests for project_delete tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleProjectDelete } from '../../../src/tools/project/project-delete.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import type { MockFreshBooksClientWrapper } from '../../mocks/client.js';

describe('project_delete tool', () => {
  let mockClientWrapper: MockFreshBooksClientWrapper;

  beforeEach(() => {
    mockClientWrapper = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful deletion', () => {
    it('should delete project successfully', async () => {
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({});

      const result = await handleProjectDelete(
        { accountId: 'ABC123', projectId: 123 },
        { client: mockClientWrapper as any }
      );

      expect(result.success).toBe(true);
      expect(result.projectId).toBe(123);
    });

    it('should return success for different project IDs', async () => {
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({});

      const result = await handleProjectDelete(
        { accountId: 'ABC123', projectId: 99999 },
        { client: mockClientWrapper as any }
      );

      expect(result.success).toBe(true);
      expect(result.projectId).toBe(99999);
    });
  });

  describe('error handling', () => {
    it('should handle project not found error', async () => {
      mockClientWrapper.executeWithRetry.mockRejectedValueOnce(
        new Error('Project not found')
      );

      await expect(
        handleProjectDelete(
          { accountId: 'ABC123', projectId: 99999 },
          { client: mockClientWrapper as any }
        )
      ).rejects.toThrow('Project not found');
    });

    it('should handle unauthorized error', async () => {
      mockClientWrapper.executeWithRetry.mockRejectedValueOnce(
        new Error('Unauthorized')
      );

      await expect(
        handleProjectDelete(
          { accountId: 'ABC123', projectId: 123 },
          { client: mockClientWrapper as any }
        )
      ).rejects.toThrow('Unauthorized');
    });

    it('should handle server error', async () => {
      mockClientWrapper.executeWithRetry.mockRejectedValueOnce(
        new Error('Internal Server Error')
      );

      await expect(
        handleProjectDelete(
          { accountId: 'ABC123', projectId: 123 },
          { client: mockClientWrapper as any }
        )
      ).rejects.toThrow('Internal Server Error');
    });

    it('should handle network timeout', async () => {
      mockClientWrapper.executeWithRetry.mockRejectedValueOnce(
        new Error('ETIMEDOUT')
      );

      await expect(
        handleProjectDelete(
          { accountId: 'ABC123', projectId: 123 },
          { client: mockClientWrapper as any }
        )
      ).rejects.toThrow('Request timed out');
    });
  });

  describe('edge cases', () => {
    it('should handle deletion of project with time entries', async () => {
      // This should ideally warn or fail, but testing actual behavior
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({});

      const result = await handleProjectDelete(
        { accountId: 'ABC123', projectId: 456 },
        { client: mockClientWrapper as any }
      );

      expect(result.success).toBe(true);
    });

    it('should handle deletion of already deleted project', async () => {
      mockClientWrapper.executeWithRetry.mockRejectedValueOnce(
        new Error('Project not found')
      );

      await expect(
        handleProjectDelete(
          { accountId: 'ABC123', projectId: 789 },
          { client: mockClientWrapper as any }
        )
      ).rejects.toThrow('Project not found');
    });
  });
});
