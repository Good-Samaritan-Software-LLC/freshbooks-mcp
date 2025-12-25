/**
 * Tests for project_update tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleProjectUpdate } from '../../../src/tools/project/project-update.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import { createProject } from '../../mocks/factories/project.factory.js';
import type { MockFreshBooksClientWrapper } from '../../mocks/client.js';

describe('project_update tool', () => {
  let mockClientWrapper: MockFreshBooksClientWrapper;

  beforeEach(() => {
    mockClientWrapper = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful updates', () => {
    it('should update project title', async () => {
      const project = createProject({ id: 123, title: 'Updated Title' });
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({ project });

      const result = await handleProjectUpdate(
        { accountId: 'ABC123', projectId: 123, title: 'Updated Title' },
        { client: mockClientWrapper as any }
      );

      expect(result.title).toBe('Updated Title');
    });

    it('should update project description', async () => {
      const project = createProject({ id: 123, description: 'New description' });
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({ project });

      const result = await handleProjectUpdate(
        { accountId: 'ABC123', projectId: 123, description: 'New description' },
        { client: mockClientWrapper as any }
      );

      expect(result.description).toBe('New description');
    });

    it('should update billing rate', async () => {
      const project = createProject({ id: 123, rate: '150.00' });
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({ project });

      const result = await handleProjectUpdate(
        { accountId: 'ABC123', projectId: 123, rate: '150.00' },
        { client: mockClientWrapper as any }
      );

      expect(result.rate).toBe('150.00');
    });

    it('should mark project as complete', async () => {
      const project = createProject({ id: 123, complete: true, active: false });
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({ project });

      const result = await handleProjectUpdate(
        { accountId: 'ABC123', projectId: 123, complete: true },
        { client: mockClientWrapper as any }
      );

      expect(result.complete).toBe(true);
    });

    it('should deactivate project', async () => {
      const project = createProject({ id: 123, active: false });
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({ project });

      const result = await handleProjectUpdate(
        { accountId: 'ABC123', projectId: 123, active: false },
        { client: mockClientWrapper as any }
      );

      expect(result.active).toBe(false);
    });

    it('should update multiple fields', async () => {
      const project = createProject({
        id: 123,
        title: 'Updated',
        rate: '200.00',
        complete: true,
      });
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({ project });

      const result = await handleProjectUpdate(
        {
          accountId: 'ABC123',
          projectId: 123,
          title: 'Updated',
          rate: '200.00',
          complete: true,
        },
        { client: mockClientWrapper as any }
      );

      expect(result.title).toBe('Updated');
      expect(result.rate).toBe('200.00');
      expect(result.complete).toBe(true);
    });

    it('should update billing method', async () => {
      const project = createProject({ id: 123, billingMethod: 'service_rate' });
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({ project });

      const result = await handleProjectUpdate(
        { accountId: 'ABC123', projectId: 123, billingMethod: 'service_rate' },
        { client: mockClientWrapper as any }
      );

      expect(result.billingMethod).toBe('service_rate');
    });

    it('should update due date', async () => {
      const dueDate = '2025-12-31T23:59:59Z';
      const project = createProject({ id: 123, dueDate });
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({ project });

      const result = await handleProjectUpdate(
        { accountId: 'ABC123', projectId: 123, dueDate },
        { client: mockClientWrapper as any }
      );

      expect(result.dueDate).toBe(dueDate);
    });

    it('should update budget', async () => {
      const project = createProject({ id: 123, budget: '100000.00' });
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({ project });

      const result = await handleProjectUpdate(
        { accountId: 'ABC123', projectId: 123, budget: '100000.00' },
        { client: mockClientWrapper as any }
      );

      expect(result.budget).toBe('100000.00');
    });
  });

  describe('error handling', () => {
    it('should handle project not found', async () => {
      mockClientWrapper.executeWithRetry.mockRejectedValueOnce(
        new Error('Project not found')
      );

      await expect(
        handleProjectUpdate(
          { accountId: 'ABC123', projectId: 99999, title: 'Test' },
          { client: mockClientWrapper as any }
        )
      ).rejects.toThrow('Project not found');
    });

    it('should handle unauthorized error', async () => {
      mockClientWrapper.executeWithRetry.mockRejectedValueOnce(
        new Error('Unauthorized')
      );

      await expect(
        handleProjectUpdate(
          { accountId: 'ABC123', projectId: 123, title: 'Test' },
          { client: mockClientWrapper as any }
        )
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('edge cases', () => {
    it('should handle unicode in title', async () => {
      const project = createProject({ id: 123, title: '日本語 🎨' });
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({ project });

      const result = await handleProjectUpdate(
        { accountId: 'ABC123', projectId: 123, title: '日本語 🎨' },
        { client: mockClientWrapper as any }
      );

      expect(result.title).toBe('日本語 🎨');
    });

    it('should handle archive and complete together', async () => {
      const project = createProject({ id: 123, active: false, complete: true });
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({ project });

      const result = await handleProjectUpdate(
        { accountId: 'ABC123', projectId: 123, active: false, complete: true },
        { client: mockClientWrapper as any }
      );

      expect(result.active).toBe(false);
      expect(result.complete).toBe(true);
    });
  });
});
