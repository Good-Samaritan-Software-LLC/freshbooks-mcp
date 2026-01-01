/**
 * Tests for project_single tool
 *
 * Covers:
 * - Success scenarios with and without includes
 * - Error handling (not found, unauthorized, server errors)
 * - Input validation
 * - Edge cases (null fields, includes)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleProjectSingle } from '../../../src/tools/project/project-single.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import { createProject } from '../../mocks/factories/project.factory.js';
import type { MockFreshBooksClientWrapper } from '../../mocks/client.js';

describe('project_single tool', () => {
  let mockClientWrapper: MockFreshBooksClientWrapper;

  beforeEach(() => {
    mockClientWrapper = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should retrieve a single project by ID', async () => {
      const project = createProject({ id: 12345, title: 'Test Project' });
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({ project });

      const result = await handleProjectSingle(
        { accountId: 'ABC123', projectId: 12345 },
        { client: mockClientWrapper as any }
      );

      expect(result.id).toBe(12345);
      expect(result.title).toBe('Test Project');
    });

    it('should handle project without wrapper object', async () => {
      const project = createProject({ id: 67890 });
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce(project);

      const result = await handleProjectSingle(
        { accountId: 'ABC123', projectId: 67890 },
        { client: mockClientWrapper as any }
      );

      expect(result.id).toBe(67890);
    });

    it('should retrieve project with client include', async () => {
      const project = createProject({ id: 99999 });
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({ project });

      const result = await handleProjectSingle(
        { accountId: 'ABC123', projectId: 99999, includes: ['client'] },
        { client: mockClientWrapper as any }
      );

      expect(result.id).toBe(99999);
    });

    it('should retrieve project with services include', async () => {
      const project = createProject({
        id: 11111,
        services: [{ id: 1, name: 'Development' }],
      } as any);
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({ project });

      const result = await handleProjectSingle(
        { accountId: 'ABC123', projectId: 11111, includes: ['services'] },
        { client: mockClientWrapper as any }
      );

      expect(result.id).toBe(11111);
    });

    it('should retrieve project with group include', async () => {
      const project = createProject({ id: 22222, groupId: '555' } as any);
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({ project });

      const result = await handleProjectSingle(
        { accountId: 'ABC123', projectId: 22222, includes: ['group'] },
        { client: mockClientWrapper as any }
      );

      expect(result.id).toBe(22222);
    });

    it('should retrieve project with multiple includes', async () => {
      const project = createProject({ id: 33333 });
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({ project });

      const result = await handleProjectSingle(
        {
          accountId: 'ABC123',
          projectId: 33333,
          includes: ['client', 'services', 'group'],
        },
        { client: mockClientWrapper as any }
      );

      expect(result.id).toBe(33333);
    });

    it('should retrieve complete project details', async () => {
      const project = createProject({
        id: 44444,
        title: 'Complete Project',
        description: 'Full description',
        clientId: '789',
        projectType: 'hourly_rate',
        billingMethod: 'project_rate',
        rate: '125.50',
        active: true,
        complete: false,
      });
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({ project });

      const result = await handleProjectSingle(
        { accountId: 'ABC123', projectId: 44444 },
        { client: mockClientWrapper as any }
      );

      expect(result.title).toBe('Complete Project');
      expect(result.description).toBe('Full description');
      expect(result.clientId).toBe('789');
      expect(result.projectType).toBe('hourly_rate');
      expect(result.billingMethod).toBe('project_rate');
      expect(result.rate).toBe('125.50');
      expect(result.active).toBe(true);
      expect(result.complete).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle project not found error', async () => {
      const notFoundError = new Error('Project not found');
      mockClientWrapper.executeWithRetry.mockRejectedValueOnce(notFoundError);

      await expect(
        handleProjectSingle(
          { accountId: 'ABC123', projectId: 99999 },
          { client: mockClientWrapper as any }
        )
      ).rejects.toThrow('Project not found');
    });

    it('should handle unauthorized error', async () => {
      const authError = new Error('Unauthorized');
      mockClientWrapper.executeWithRetry.mockRejectedValueOnce(authError);

      await expect(
        handleProjectSingle(
          { accountId: 'ABC123', projectId: 12345 },
          { client: mockClientWrapper as any }
        )
      ).rejects.toThrow('Unauthorized');
    });

    it('should handle server error', async () => {
      const serverError = new Error('Internal Server Error');
      mockClientWrapper.executeWithRetry.mockRejectedValueOnce(serverError);

      await expect(
        handleProjectSingle(
          { accountId: 'ABC123', projectId: 12345 },
          { client: mockClientWrapper as any }
        )
      ).rejects.toThrow('Internal Server Error');
    });

    it('should handle network timeout', async () => {
      const timeoutError = new Error('ETIMEDOUT');
      mockClientWrapper.executeWithRetry.mockRejectedValueOnce(timeoutError);

      await expect(
        handleProjectSingle(
          { accountId: 'ABC123', projectId: 12345 },
          { client: mockClientWrapper as any }
        )
      ).rejects.toThrow('Request timed out');
    });
  });

  describe('edge cases', () => {
    it('should handle project with all null optional fields', async () => {
      const project = createProject({
        id: 55555,
        description: null,
        dueDate: null,
        clientId: null,
        budget: null,
        fixedPrice: null,
        rate: null,
        billingMethod: null,
        projectManagerId: null,
        retainerId: null,
        groupId: null,
        group: null,
        services: null,
      } as any);
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({ project });

      const result = await handleProjectSingle(
        { accountId: 'ABC123', projectId: 55555 },
        { client: mockClientWrapper as any }
      );

      expect(result.description).toBeNull();
      expect(result.clientId).toBeNull();
      expect(result.budget).toBeNull();
      expect(result.rate).toBeNull();
    });

    it('should handle project with unicode in title', async () => {
      const project = createProject({
        id: 66666,
        title: '日本語プロジェクト 🚀',
        description: 'Description with émojis and àccents',
      });
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({ project });

      const result = await handleProjectSingle(
        { accountId: 'ABC123', projectId: 66666 },
        { client: mockClientWrapper as any }
      );

      expect(result.title).toBe('日本語プロジェクト 🚀');
      expect(result.description).toBe('Description with émojis and àccents');
    });

    it('should handle internal non-billable project', async () => {
      const project = createProject({
        id: 77777,
        internal: true,
        billingMethod: null,
        clientId: null,
      } as any);
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({ project });

      const result = await handleProjectSingle(
        { accountId: 'ABC123', projectId: 77777 },
        { client: mockClientWrapper as any }
      );

      expect(result.internal).toBe(true);
      expect(result.billingMethod).toBeNull();
    });

    it('should handle completed archived project', async () => {
      const project = createProject({
        id: 88888,
        active: false,
        complete: true,
        billedStatus: 'billed',
      });
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({ project });

      const result = await handleProjectSingle(
        { accountId: 'ABC123', projectId: 88888 },
        { client: mockClientWrapper as any }
      );

      expect(result.active).toBe(false);
      expect(result.complete).toBe(true);
      expect(result.billedStatus).toBe('billed');
    });

    it('should handle project with very large logged duration', async () => {
      const project = createProject({
        id: 99999,
        loggedDuration: 9999999999,
      });
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({ project });

      const result = await handleProjectSingle(
        { accountId: 'ABC123', projectId: 99999 },
        { client: mockClientWrapper as any }
      );

      expect(result.loggedDuration).toBe(9999999999);
    });

    it('should handle fixed-price project', async () => {
      const project = createProject({
        id: 11111,
        projectType: 'fixed_price',
        billingMethod: 'flat_rate',
        fixedPrice: '50000.00',
        rate: null,
      });
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({ project });

      const result = await handleProjectSingle(
        { accountId: 'ABC123', projectId: 11111 },
        { client: mockClientWrapper as any }
      );

      expect(result.projectType).toBe('fixed_price');
      expect(result.fixedPrice).toBe('50000.00');
      expect(result.rate).toBeNull();
    });
  });
});
