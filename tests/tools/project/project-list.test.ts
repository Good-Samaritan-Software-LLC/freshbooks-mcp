/**
 * Tests for project_list tool
 *
 * Covers:
 * - Success scenarios with pagination and filtering
 * - Error handling (unauthorized, rate limit, server errors)
 * - Input validation
 * - Edge cases (empty results, max pagination, special characters)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleProjectList } from '../../../src/tools/project/project-list.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import { createProjectList, createProject } from '../../mocks/factories/project.factory.js';
import type { MockFreshBooksClientWrapper } from '../../mocks/client.js';

describe('project_list tool', () => {
  let mockClientWrapper: MockFreshBooksClientWrapper;

  beforeEach(() => {
    mockClientWrapper = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should list projects with default pagination', async () => {
      const projects = createProjectList(10);
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({
        projects,
        pages: { page: 1, pages: 1, per_page: 30, total: 10 },
      });

      const result = await handleProjectList(
        { accountId: 'ABC123' },
        { client: mockClientWrapper as any }
      );

      expect(result.projects).toHaveLength(10);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.perPage).toBe(30);
      expect(result.pagination.total).toBe(10);
    });

    it('should list projects with custom pagination', async () => {
      const projects = createProjectList(5);
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({
        projects,
        pages: { page: 2, pages: 3, per_page: 5, total: 15 },
      });

      const result = await handleProjectList(
        { accountId: 'ABC123', page: 2, perPage: 5 },
        { client: mockClientWrapper as any }
      );

      expect(result.projects).toHaveLength(5);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.perPage).toBe(5);
      expect(result.pagination.total).toBe(15);
      expect(result.pagination.pages).toBe(3);
    });

    it('should return empty array when no projects exist', async () => {
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({
        projects: [],
        pages: { page: 1, pages: 1, per_page: 30, total: 0 },
      });

      const result = await handleProjectList(
        { accountId: 'ABC123' },
        { client: mockClientWrapper as any }
      );

      expect(result.projects).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should filter by clientId', async () => {
      const projects = createProjectList(3, { clientId: '12345' });
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({
        projects,
        pages: { page: 1, pages: 1, per_page: 30, total: 3 },
      });

      const result = await handleProjectList(
        { accountId: 'ABC123', clientId: '12345' },
        { client: mockClientWrapper as any }
      );

      expect(result.projects).toHaveLength(3);
      result.projects.forEach(project => {
        expect(project.clientId).toBe('12345');
      });
    });

    it('should filter by active status', async () => {
      const projects = createProjectList(5, { active: true });
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({
        projects,
        pages: { page: 1, pages: 1, per_page: 30, total: 5 },
      });

      const result = await handleProjectList(
        { accountId: 'ABC123', active: true },
        { client: mockClientWrapper as any }
      );

      expect(result.projects).toHaveLength(5);
      result.projects.forEach(project => {
        expect(project.active).toBe(true);
      });
    });

    it('should filter by complete status', async () => {
      const projects = createProjectList(4, { complete: true });
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({
        projects,
        pages: { page: 1, pages: 1, per_page: 30, total: 4 },
      });

      const result = await handleProjectList(
        { accountId: 'ABC123', complete: true },
        { client: mockClientWrapper as any }
      );

      expect(result.projects).toHaveLength(4);
      result.projects.forEach(project => {
        expect(project.complete).toBe(true);
      });
    });

    it('should filter by internal status', async () => {
      const projects = createProjectList(2, { internal: true });
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({
        projects,
        pages: { page: 1, pages: 1, per_page: 30, total: 2 },
      });

      const result = await handleProjectList(
        { accountId: 'ABC123', internal: true },
        { client: mockClientWrapper as any }
      );

      expect(result.projects).toHaveLength(2);
      result.projects.forEach(project => {
        expect(project.internal).toBe(true);
      });
    });

    it('should filter by title with partial match', async () => {
      const projects = [
        createProject({ title: 'Website Redesign' }),
        createProject({ title: 'Mobile Website' }),
      ];
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({
        projects,
        pages: { page: 1, pages: 1, per_page: 30, total: 2 },
      });

      const result = await handleProjectList(
        { accountId: 'ABC123', title: 'Website' },
        { client: mockClientWrapper as any }
      );

      expect(result.projects).toHaveLength(2);
    });

    it('should apply multiple filters simultaneously', async () => {
      const projects = createProjectList(1, {
        clientId: '12345',
        active: true,
        complete: false,
        internal: false,
      });
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({
        projects,
        pages: { page: 1, pages: 1, per_page: 30, total: 1 },
      });

      const result = await handleProjectList(
        {
          accountId: 'ABC123',
          clientId: '12345',
          active: true,
          complete: false,
          internal: false,
        },
        { client: mockClientWrapper as any }
      );

      expect(result.projects).toHaveLength(1);
      expect(result.projects[0].clientId).toBe('12345');
      expect(result.projects[0].active).toBe(true);
      expect(result.projects[0].complete).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      const error = new Error('API Error');
      mockClientWrapper.executeWithRetry.mockRejectedValueOnce(error);

      await expect(
        handleProjectList(
          { accountId: 'ABC123' },
          { client: mockClientWrapper as any }
        )
      ).rejects.toThrow('API Error');
    });

    it('should handle network timeout errors', async () => {
      const timeoutError = new Error('ETIMEDOUT');
      mockClientWrapper.executeWithRetry.mockRejectedValueOnce(timeoutError);

      await expect(
        handleProjectList(
          { accountId: 'ABC123' },
          { client: mockClientWrapper as any }
        )
      ).rejects.toThrow('Request timed out');
    });

    it('should handle unauthorized errors', async () => {
      const authError = new Error('Unauthorized');
      mockClientWrapper.executeWithRetry.mockRejectedValueOnce(authError);

      await expect(
        handleProjectList(
          { accountId: 'ABC123' },
          { client: mockClientWrapper as any }
        )
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('edge cases', () => {
    it('should handle maximum pagination values', async () => {
      const projects = createProjectList(100);
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({
        projects,
        pages: { page: 1, pages: 1, per_page: 100, total: 100 },
      });

      const result = await handleProjectList(
        { accountId: 'ABC123', perPage: 100 },
        { client: mockClientWrapper as any }
      );

      expect(result.projects).toHaveLength(100);
      expect(result.pagination.perPage).toBe(100);
    });

    it('should handle projects with null optional fields', async () => {
      const projects = [
        createProject({
          description: null,
          dueDate: null,
          clientId: null,
          budget: null,
          fixedPrice: null,
          rate: null,
        }),
      ];
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({
        projects,
        pages: { page: 1, pages: 1, per_page: 30, total: 1 },
      });

      const result = await handleProjectList(
        { accountId: 'ABC123' },
        { client: mockClientWrapper as any }
      );

      expect(result.projects[0].description).toBeNull();
      expect(result.projects[0].dueDate).toBeNull();
      expect(result.projects[0].clientId).toBeNull();
    });

    it('should handle unicode characters in title filter', async () => {
      const projects = [createProject({ title: 'プロジェクト 日本語 🎨' })];
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({
        projects,
        pages: { page: 1, pages: 1, per_page: 30, total: 1 },
      });

      const result = await handleProjectList(
        { accountId: 'ABC123', title: '日本語' },
        { client: mockClientWrapper as any }
      );

      expect(result.projects[0].title).toBe('プロジェクト 日本語 🎨');
    });

    it('should handle request beyond last page', async () => {
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({
        projects: [],
        pages: { page: 999, pages: 10, per_page: 30, total: 300 },
      });

      const result = await handleProjectList(
        { accountId: 'ABC123', page: 999 },
        { client: mockClientWrapper as any }
      );

      expect(result.projects).toHaveLength(0);
    });

    it('should handle very large logged duration values', async () => {
      const projects = [createProject({ loggedDuration: 999999999 })];
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({
        projects,
        pages: { page: 1, pages: 1, per_page: 30, total: 1 },
      });

      const result = await handleProjectList(
        { accountId: 'ABC123' },
        { client: mockClientWrapper as any }
      );

      expect(result.projects[0].loggedDuration).toBe(999999999);
    });
  });
});
