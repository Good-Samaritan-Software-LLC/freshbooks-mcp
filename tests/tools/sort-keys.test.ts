/**
 * Regression tests for live-verified sort behavior (F19/F20):
 * - client_list maps its public sort values to the keys the API honors
 *   (organization -> organization_name, fname/lname -> fullname).
 * - project_list emits the Projects-API bare/minus sort param itself (the SDK's
 *   SortQueryBuilder emits accounting-style `key_asc`, which that API ignores).
 * - timeentry_list does NOT send a sort (no server-side sort exists).
 * - journalentryaccount_list does NOT send account_type (server ignores it).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clientListTool } from '../../src/tools/client/client-list.js';
import { projectListTool } from '../../src/tools/project/project-list.js';
import { timeentryListTool } from '../../src/tools/time-entry/timeentry-list.js';
import { journalEntryAccountListTool } from '../../src/tools/journal-entry-account/journalentryaccount-list.js';
import { createMockClientWrapper } from '../mocks/client.js';

/** Render every query builder the tool passed to the SDK list call. */
const builtParams = (builders: any[]) =>
  (builders ?? []).map((b: any) => (typeof b?.build === 'function' ? b.build() : String(b)));

describe('sort/filter wire params (F19/F20)', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  function capture(resource: string, listResponse: any) {
    const list = vi.fn().mockResolvedValue(listResponse);
    mockClient.executeWithRetry.mockImplementation(
      async (_op: string, apiCall: (c: any) => Promise<any>) => apiCall({ [resource]: { list } })
    );
    return list;
  }

  it('client_list maps organization -> organization_name (F19)', async () => {
    const list = capture('clients', { ok: true, data: { clients: [], pages: { page: 1, pages: 1, per_page: 30, total: 0 } } });

    await clientListTool.execute({ accountId: 'ABC123', sortBy: 'organization', sortOrder: 'asc' } as any, mockClient as any);

    const params = builtParams(list.mock.calls[0][1]);
    expect(params.some((p: string) => p.includes('sort=organization_name_asc'))).toBe(true);
  });

  it('client_list maps fname/lname -> fullname (F19)', async () => {
    const list = capture('clients', { ok: true, data: { clients: [], pages: { page: 1, pages: 1, per_page: 30, total: 0 } } });

    await clientListTool.execute({ accountId: 'ABC123', sortBy: 'fname', sortOrder: 'desc' } as any, mockClient as any);

    const params = builtParams(list.mock.calls[0][1]);
    expect(params.some((p: string) => p.includes('sort=fullname_desc'))).toBe(true);
  });

  it('project_list emits bare/minus Projects-API sort (F19)', async () => {
    const list = capture('projects', { ok: true, data: { projects: [], pages: { page: 1, pages: 1, per_page: 30, total: 0 } } });

    await projectListTool.execute({ businessId: 123, sortBy: 'title', sortOrder: 'asc' } as any, mockClient as any);
    let params = builtParams(list.mock.calls[0][1]);
    expect(params).toContain('sort=title');

    await projectListTool.execute({ businessId: 123, sortBy: 'due_date', sortOrder: 'desc' } as any, mockClient as any);
    params = builtParams(list.mock.calls[1][1]);
    expect(params).toContain('sort=-due_date');
  });

  it('timeentry_list does not send any sort param (no server-side sort)', async () => {
    const list = capture('timeEntries', { ok: true, data: { timeEntries: [], pages: { page: 1, pages: 1, per_page: 30, total: 0 } } });

    await timeentryListTool.execute({ businessId: 123, sortBy: 'started_at', sortOrder: 'asc' } as any, mockClient as any);

    const params = builtParams(list.mock.calls[0][1]);
    expect(params.some((p: string) => p.includes('sort='))).toBe(false);
  });

  it('journalentryaccount_list does not send the ignored account_type filter (F20)', async () => {
    const list = capture('journalEntryAccounts', { ok: true, data: { journalEntryAccounts: [], pages: { page: 1, pages: 1, per_page: 30, total: 0 } } });

    await journalEntryAccountListTool.execute({ accountId: 'ABC123', accountType: 'asset' } as any, mockClient as any);

    const params = builtParams(list.mock.calls[0][1]);
    expect(params.some((p: string) => p.includes('account_type'))).toBe(false);
  });
});
