/**
 * Tests for project_update tool
 *
 * project_update does a read-modify-write: the Projects API 500s on a partial PUT
 * (#70), so the tool fetches the project (projects.single), overlays the user's
 * changes onto the full editable set, and sends the complete object
 * (projects.update). These tests drive that real path through a stub fbClient.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleProjectUpdate } from '../../../src/tools/project/project-update.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import { createProject } from '../../mocks/factories/project.factory.js';
import type { MockFreshBooksClientWrapper } from '../../mocks/client.js';

const BUSINESS_ID = 14694862;

describe('project_update tool', () => {
  let mockClientWrapper: MockFreshBooksClientWrapper;
  let single: ReturnType<typeof vi.fn>;
  let update: ReturnType<typeof vi.fn>;

  /**
   * Wire executeWithRetry to run the tool's real apiCall against a stub fbClient.
   * `existing` is what projects.single returns; the update echoes back the merged
   * payload (id added) so assertions can read the result.
   */
  function wire(existing: Record<string, unknown>) {
    single = vi.fn().mockResolvedValue({ ok: true, data: existing });
    update = vi
      .fn()
      .mockImplementation(async (payload: Record<string, unknown>, _businessId: number, projectId: number) => ({
        ok: true,
        data: { ...payload, id: projectId },
      }));

    mockClientWrapper.executeWithRetry.mockImplementation(
      async (_op: string, apiCall: (c: any) => Promise<any>) =>
        apiCall({ projects: { single, update } })
    );
  }

  /** The payload passed to projects.update (the full object sent to the API). */
  const sentPayload = () => update.mock.calls[0][0] as Record<string, unknown>;

  beforeEach(() => {
    mockClientWrapper = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('read-modify-write behavior', () => {
    it('should fetch the existing project before updating', async () => {
      wire(createProject({ id: 123, title: 'Original' }));

      await handleProjectUpdate(
        { businessId: BUSINESS_ID, projectId: 123, title: 'Updated Title' },
        { client: mockClientWrapper as any }
      );

      expect(single).toHaveBeenCalledWith(BUSINESS_ID, 123);
      expect(single).toHaveBeenCalledTimes(1);
      expect(update).toHaveBeenCalledTimes(1);
    });

    it('should send the FULL editable set, not just the changed field', async () => {
      wire(
        createProject({
          id: 123,
          title: 'Original',
          rate: '99.00',
          billingMethod: 'project_rate',
          projectType: 'hourly_rate',
          budget: '5000.00',
          active: true,
          complete: false,
        })
      );

      await handleProjectUpdate(
        { businessId: BUSINESS_ID, projectId: 123, description: 'just the description' },
        { client: mockClientWrapper as any }
      );

      const payload = sentPayload();
      // The changed field is applied...
      expect(payload.description).toBe('just the description');
      // ...and the untouched editable fields are carried over from `existing`.
      expect(payload.title).toBe('Original');
      expect(payload.rate).toBe('99.00');
      expect(payload.billingMethod).toBe('project_rate');
      expect(payload.projectType).toBe('hourly_rate');
      expect(payload.budget).toBe('5000.00');
      expect(payload.active).toBe(true);
      expect(payload.complete).toBe(false);
    });

    it('should NOT echo read-only/computed fields back to the API', async () => {
      wire(
        createProject({
          id: 123,
          loggedDuration: 12345,
          billedAmount: 999,
          billedStatus: 'billed',
          retainerId: 'ret_1',
          expenseMarkup: 25,
          sample: true,
        })
      );

      await handleProjectUpdate(
        { businessId: BUSINESS_ID, projectId: 123, title: 'X' },
        { client: mockClientWrapper as any }
      );

      const payload = sentPayload();
      for (const readOnly of [
        'loggedDuration',
        'billedAmount',
        'billedStatus',
        'retainerId',
        'expenseMarkup',
        'sample',
        'createdAt',
        'updatedAt',
        'group',
        'services',
      ]) {
        expect(payload).not.toHaveProperty(readOnly);
      }
    });

    it('should normalize an existing Date dueDate to YYYY-MM-DD', async () => {
      const existing = createProject({ id: 123 });
      // Simulate the SDK handing back a parsed JS Date for due_date.
      (existing as any).dueDate = new Date('2025-12-31T05:00:00.000Z');
      wire(existing as any);

      await handleProjectUpdate(
        { businessId: BUSINESS_ID, projectId: 123, title: 'X' },
        { client: mockClientWrapper as any }
      );

      expect(sentPayload().dueDate).toBe('2025-12-31');
    });

    it('should pass a user-provided dueDate through unchanged', async () => {
      wire(createProject({ id: 123, dueDate: null }));

      await handleProjectUpdate(
        { businessId: BUSINESS_ID, projectId: 123, dueDate: '2026-01-15' },
        { client: mockClientWrapper as any }
      );

      expect(sentPayload().dueDate).toBe('2026-01-15');
    });

    it('should map a null existing dueDate to null', async () => {
      wire(createProject({ id: 123, dueDate: null }));

      await handleProjectUpdate(
        { businessId: BUSINESS_ID, projectId: 123, title: 'X' },
        { client: mockClientWrapper as any }
      );

      expect(sentPayload().dueDate).toBeNull();
    });
  });

  describe('successful updates', () => {
    it('should update project title', async () => {
      wire(createProject({ id: 123, title: 'Original' }));

      const result = await handleProjectUpdate(
        { businessId: BUSINESS_ID, projectId: 123, title: 'Updated Title' },
        { client: mockClientWrapper as any }
      );

      expect(result.title).toBe('Updated Title');
    });

    it('should update billing rate', async () => {
      wire(createProject({ id: 123, rate: '50.00' }));

      const result = await handleProjectUpdate(
        { businessId: BUSINESS_ID, projectId: 123, rate: '150.00' },
        { client: mockClientWrapper as any }
      );

      expect(result.rate).toBe('150.00');
    });

    it('should mark project as complete', async () => {
      wire(createProject({ id: 123, complete: false }));

      const result = await handleProjectUpdate(
        { businessId: BUSINESS_ID, projectId: 123, complete: true },
        { client: mockClientWrapper as any }
      );

      expect(result.complete).toBe(true);
    });

    it('should deactivate project', async () => {
      wire(createProject({ id: 123, active: true }));

      const result = await handleProjectUpdate(
        { businessId: BUSINESS_ID, projectId: 123, active: false },
        { client: mockClientWrapper as any }
      );

      expect(result.active).toBe(false);
    });

    it('should update multiple fields', async () => {
      wire(createProject({ id: 123, title: 'Original', rate: '10.00', complete: false }));

      const result = await handleProjectUpdate(
        { businessId: BUSINESS_ID, projectId: 123, title: 'Updated', rate: '200.00', complete: true },
        { client: mockClientWrapper as any }
      );

      expect(result.title).toBe('Updated');
      expect(result.rate).toBe('200.00');
      expect(result.complete).toBe(true);
    });

    it('should update billing method', async () => {
      wire(createProject({ id: 123, billingMethod: 'project_rate' }));

      const result = await handleProjectUpdate(
        { businessId: BUSINESS_ID, projectId: 123, billingMethod: 'service_rate' },
        { client: mockClientWrapper as any }
      );

      expect(result.billingMethod).toBe('service_rate');
    });

    it('should update budget', async () => {
      wire(createProject({ id: 123, budget: '1.00' }));

      const result = await handleProjectUpdate(
        { businessId: BUSINESS_ID, projectId: 123, budget: '100000.00' },
        { client: mockClientWrapper as any }
      );

      expect(result.budget).toBe('100000.00');
    });
  });

  describe('validation', () => {
    it('should reject an update with no fields to change', async () => {
      wire(createProject({ id: 123 }));

      await expect(
        handleProjectUpdate(
          { businessId: BUSINESS_ID, projectId: 123 },
          { client: mockClientWrapper as any }
        )
      ).rejects.toThrow(/No fields provided/);

      // No round-trip should happen when there's nothing to change.
      expect(single).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should throw when the project is not found (single fails)', async () => {
      single = vi.fn().mockResolvedValue({ ok: false, error: new Error('Project not found') });
      update = vi.fn();
      mockClientWrapper.executeWithRetry.mockImplementation(
        async (_op: string, apiCall: (c: any) => Promise<any>) =>
          apiCall({ projects: { single, update } })
      );

      await expect(
        handleProjectUpdate(
          { businessId: BUSINESS_ID, projectId: 99999, title: 'Test' },
          { client: mockClientWrapper as any }
        )
      ).rejects.toThrow('Project not found');

      // Must not attempt the write if the read failed.
      expect(update).not.toHaveBeenCalled();
    });

    it('should throw when the update fails', async () => {
      single = vi.fn().mockResolvedValue({ ok: true, data: createProject({ id: 123 }) });
      update = vi.fn().mockResolvedValue({ ok: false, error: new Error('Unauthorized') });
      mockClientWrapper.executeWithRetry.mockImplementation(
        async (_op: string, apiCall: (c: any) => Promise<any>) =>
          apiCall({ projects: { single, update } })
      );

      await expect(
        handleProjectUpdate(
          { businessId: BUSINESS_ID, projectId: 123, title: 'Test' },
          { client: mockClientWrapper as any }
        )
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('edge cases', () => {
    it('should handle unicode in title', async () => {
      wire(createProject({ id: 123, title: 'Original' }));

      const result = await handleProjectUpdate(
        { businessId: BUSINESS_ID, projectId: 123, title: '日本語 🎨' },
        { client: mockClientWrapper as any }
      );

      expect(result.title).toBe('日本語 🎨');
    });

    it('should handle archive and complete together', async () => {
      wire(createProject({ id: 123, active: true, complete: false }));

      const result = await handleProjectUpdate(
        { businessId: BUSINESS_ID, projectId: 123, active: false, complete: true },
        { client: mockClientWrapper as any }
      );

      expect(result.active).toBe(false);
      expect(result.complete).toBe(true);
    });
  });
});
