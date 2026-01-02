/**
 * Tests for project_create tool
 *
 * Covers:
 * - Success scenarios with various billing methods and project types
 * - Error handling (validation, conflicts, server errors)
 * - Input validation
 * - Edge cases (minimal fields, all fields, special values)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleProjectCreate } from '../../../src/tools/project/project-create.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import { createProject } from '../../mocks/factories/project.factory.js';
import type { MockFreshBooksClientWrapper } from '../../mocks/client.js';

describe('project_create tool', () => {
  let mockClientWrapper: MockFreshBooksClientWrapper;

  beforeEach(() => {
    mockClientWrapper = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful creation', () => {
    it('should create project with title only', async () => {
      const project = createProject({ title: 'New Project' });
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({ project });

      const result = await handleProjectCreate(
        { accountId: 'ABC123', title: 'New Project' },
        { client: mockClientWrapper as any }
      );

      expect(result.title).toBe('New Project');
    });

    it('should create hourly-rate project with all fields', async () => {
      const project = createProject({
        title: 'Hourly Project',
        description: 'Test description',
        clientId: '12345',
        projectType: 'hourly_rate',
        billingMethod: 'project_rate',
        rate: '125.00',
        budget: '50000.00',
        internal: false,
      });
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({ project });

      const result = await handleProjectCreate(
        {
          accountId: 'ABC123',
          title: 'Hourly Project',
          description: 'Test description',
          clientId: '12345',
          projectType: 'hourly_rate',
          billingMethod: 'project_rate',
          rate: '125.00',
          budget: '50000.00',
          internal: false,
        },
        { client: mockClientWrapper as any }
      );

      expect(result.title).toBe('Hourly Project');
      expect(result.description).toBe('Test description');
      expect(result.clientId).toBe('12345');
      expect(result.projectType).toBe('hourly_rate');
      expect(result.billingMethod).toBe('project_rate');
      expect(result.rate).toBe('125.00');
    });

    it('should create fixed-price project', async () => {
      const project = createProject({
        title: 'Fixed Price Project',
        projectType: 'fixed_price',
        billingMethod: 'flat_rate',
        fixedPrice: '25000.00',
      });
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({ project });

      const result = await handleProjectCreate(
        {
          accountId: 'ABC123',
          title: 'Fixed Price Project',
          projectType: 'fixed_price',
          billingMethod: 'flat_rate',
          fixedPrice: '25000.00',
        },
        { client: mockClientWrapper as any }
      );

      expect(result.projectType).toBe('fixed_price');
      expect(result.fixedPrice).toBe('25000.00');
    });

    it('should create project with service_rate billing method', async () => {
      const project = createProject({
        title: 'Service Rate Project',
        billingMethod: 'service_rate',
      });
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({ project });

      const result = await handleProjectCreate(
        {
          accountId: 'ABC123',
          title: 'Service Rate Project',
          billingMethod: 'service_rate',
        },
        { client: mockClientWrapper as any }
      );

      expect(result.billingMethod).toBe('service_rate');
    });

    it('should create project with team_member_rate billing method', async () => {
      const project = createProject({
        title: 'Team Member Rate Project',
        billingMethod: 'team_member_rate',
      });
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({ project });

      const result = await handleProjectCreate(
        {
          accountId: 'ABC123',
          title: 'Team Member Rate Project',
          billingMethod: 'team_member_rate',
        },
        { client: mockClientWrapper as any }
      );

      expect(result.billingMethod).toBe('team_member_rate');
    });

    it('should create internal non-billable project', async () => {
      const project = createProject({
        title: 'Internal Project',
        internal: true,
      });
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({ project });

      const result = await handleProjectCreate(
        {
          accountId: 'ABC123',
          title: 'Internal Project',
          internal: true,
        },
        { client: mockClientWrapper as any }
      );

      expect(result.internal).toBe(true);
    });

    it('should create project with due date', async () => {
      const dueDate = '2025-12-31T23:59:59Z';
      const project = createProject({
        title: 'Project with Deadline',
        dueDate,
      });
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({ project });

      const result = await handleProjectCreate(
        {
          accountId: 'ABC123',
          title: 'Project with Deadline',
          dueDate,
        },
        { client: mockClientWrapper as any }
      );

      expect(result.dueDate).toBe(dueDate);
    });

    it('should create project with budget', async () => {
      const project = createProject({
        title: 'Budgeted Project',
        budget: '75000.00',
      });
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({ project });

      const result = await handleProjectCreate(
        {
          accountId: 'ABC123',
          title: 'Budgeted Project',
          budget: '75000.00',
        },
        { client: mockClientWrapper as any }
      );

      expect(result.budget).toBe('75000.00');
    });

    it('should create project with project manager', async () => {
      const project = createProject({
        title: 'Managed Project',
        projectManagerId: '999',
      });
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({ project });

      const result = await handleProjectCreate(
        {
          accountId: 'ABC123',
          title: 'Managed Project',
          projectManagerId: '999',
        },
        { client: mockClientWrapper as any }
      );

      expect(result.projectManagerId).toBe('999');
    });
  });

  describe('error handling', () => {
    it('should handle validation error for missing title', async () => {
      const validationError = new Error('Title is required');
      mockClientWrapper.executeWithRetry.mockRejectedValueOnce(validationError);

      await expect(
        handleProjectCreate(
          { accountId: 'ABC123', title: '' },
          { client: mockClientWrapper as any }
        )
      ).rejects.toThrow('Title is required');
    });

    it('should handle unauthorized error', async () => {
      const authError = new Error('Unauthorized');
      mockClientWrapper.executeWithRetry.mockRejectedValueOnce(authError);

      await expect(
        handleProjectCreate(
          { accountId: 'ABC123', title: 'Test Project' },
          { client: mockClientWrapper as any }
        )
      ).rejects.toThrow('Unauthorized');
    });

    it('should handle server error', async () => {
      const serverError = new Error('Internal Server Error');
      mockClientWrapper.executeWithRetry.mockRejectedValueOnce(serverError);

      await expect(
        handleProjectCreate(
          { accountId: 'ABC123', title: 'Test Project' },
          { client: mockClientWrapper as any }
        )
      ).rejects.toThrow('Internal Server Error');
    });

    it('should handle conflict error for duplicate project', async () => {
      const conflictError = new Error('Project already exists');
      mockClientWrapper.executeWithRetry.mockRejectedValueOnce(conflictError);

      await expect(
        handleProjectCreate(
          { accountId: 'ABC123', title: 'Duplicate Project' },
          { client: mockClientWrapper as any }
        )
      ).rejects.toThrow('Project already exists');
    });
  });

  describe('edge cases', () => {
    it('should handle unicode characters in title', async () => {
      const project = createProject({
        title: 'プロジェクト 🚀 émojis',
      });
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({ project });

      const result = await handleProjectCreate(
        {
          accountId: 'ABC123',
          title: 'プロジェクト 🚀 émojis',
        },
        { client: mockClientWrapper as any }
      );

      expect(result.title).toBe('プロジェクト 🚀 émojis');
    });

    it('should handle very long description', async () => {
      const longDescription = 'A'.repeat(5000);
      const project = createProject({
        title: 'Long Description Project',
        description: longDescription,
      });
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({ project });

      const result = await handleProjectCreate(
        {
          accountId: 'ABC123',
          title: 'Long Description Project',
          description: longDescription,
        },
        { client: mockClientWrapper as any }
      );

      expect(result.description).toBe(longDescription);
    });

    it('should handle decimal rate values', async () => {
      const project = createProject({
        title: 'Decimal Rate Project',
        rate: '125.75',
      });
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({ project });

      const result = await handleProjectCreate(
        {
          accountId: 'ABC123',
          title: 'Decimal Rate Project',
          rate: '125.75',
        },
        { client: mockClientWrapper as any }
      );

      expect(result.rate).toBe('125.75');
    });

    it('should handle very large budget values', async () => {
      const project = createProject({
        title: 'Large Budget Project',
        budget: '999999.99',
      });
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({ project });

      const result = await handleProjectCreate(
        {
          accountId: 'ABC123',
          title: 'Large Budget Project',
          budget: '999999.99',
        },
        { client: mockClientWrapper as any }
      );

      expect(result.budget).toBe('999999.99');
    });

    it('should handle YYYY-MM-DD date formats', async () => {
      const project = createProject({
        title: 'Date Project',
        dueDate: '2025-06-15T00:00:00Z',
      });
      mockClientWrapper.executeWithRetry.mockResolvedValueOnce({ project });

      const result = await handleProjectCreate(
        {
          accountId: 'ABC123',
          title: 'Date Project',
          dueDate: '2025-06-15',
        },
        { client: mockClientWrapper as any }
      );

      // API returns full datetime, but input accepts YYYY-MM-DD
      expect(result.dueDate).toBe('2025-06-15T00:00:00Z');
    });
  });
});
