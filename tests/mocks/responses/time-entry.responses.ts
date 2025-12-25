import { faker } from "@faker-js/faker";
import {
  createTimeEntry,
  createTimeEntryList,
  type TimeEntryOverrides,
} from "../factories/time-entry.factory";
import type {
  FreshBooksResponse,
  TimeEntrySingleData,
  TimeEntryListData,
  PaginationMeta,
  TimeEntry,
} from "../../../src/types/freshbooks";

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  page: number = 1,
  total: number = 10,
  perPage: number = 30
): PaginationMeta {
  return {
    page,
    pages: Math.ceil(total / perPage),
    total,
    perPage,
  };
}

/**
 * Mock successful single TimeEntry response
 */
export function mockTimeEntrySingleResponse(
  overrides: TimeEntryOverrides = {}
): FreshBooksResponse<TimeEntrySingleData> {
  return {
    ok: true,
    data: {
      timeEntry: createTimeEntry(overrides),
    },
  };
}

/**
 * Mock successful TimeEntry list response
 */
export function mockTimeEntryListResponse(
  count: number = 10,
  page: number = 1,
  perPage: number = 30
): FreshBooksResponse<TimeEntryListData> {
  const total = count;
  const itemsOnPage = Math.min(perPage, Math.max(0, total - (page - 1) * perPage));

  return {
    ok: true,
    data: {
      timeEntries: createTimeEntryList(itemsOnPage),
      pages: createPaginationMeta(page, total, perPage),
    },
  };
}

/**
 * Mock empty TimeEntry list response
 */
export function mockTimeEntryEmptyListResponse(): FreshBooksResponse<TimeEntryListData> {
  return {
    ok: true,
    data: {
      timeEntries: [],
      pages: createPaginationMeta(1, 0, 30),
    },
  };
}

/**
 * Mock successful TimeEntry create response
 */
export function mockTimeEntryCreateResponse(
  input: Partial<TimeEntry>
): FreshBooksResponse<TimeEntrySingleData> {
  const now = new Date().toISOString();
  return {
    ok: true,
    data: {
      timeEntry: createTimeEntry({
        ...input,
        id: faker.number.int({ min: 1, max: 999999 }),
        createdAt: now,
      }),
    },
  };
}

/**
 * Mock successful TimeEntry update response
 */
export function mockTimeEntryUpdateResponse(
  id: number,
  changes: Partial<TimeEntry>
): FreshBooksResponse<TimeEntrySingleData> {
  return {
    ok: true,
    data: {
      timeEntry: createTimeEntry({
        id,
        ...changes,
      }),
    },
  };
}

/**
 * Mock successful TimeEntry delete response
 */
export function mockTimeEntryDeleteResponse(): FreshBooksResponse<void> {
  return {
    ok: true,
  };
}

/**
 * Mock first page of multi-page results
 */
export function mockTimeEntryFirstPage(
  total: number = 100,
  perPage: number = 30
): FreshBooksResponse<TimeEntryListData> {
  return mockTimeEntryListResponse(total, 1, perPage);
}

/**
 * Mock middle page of results
 */
export function mockTimeEntryMiddlePage(
  page: number = 2,
  total: number = 100,
  perPage: number = 30
): FreshBooksResponse<TimeEntryListData> {
  return mockTimeEntryListResponse(total, page, perPage);
}

/**
 * Mock last page of results (possibly partial)
 */
export function mockTimeEntryLastPage(
  total: number = 100,
  perPage: number = 30
): FreshBooksResponse<TimeEntryListData> {
  const lastPage = Math.ceil(total / perPage);
  return mockTimeEntryListResponse(total, lastPage, perPage);
}

/**
 * Mock page beyond the last page (empty but valid)
 */
export function mockTimeEntryBeyondLastPage(
  total: number = 100,
  perPage: number = 30
): FreshBooksResponse<TimeEntryListData> {
  const beyondPage = Math.ceil(total / perPage) + 1;
  return {
    ok: true,
    data: {
      timeEntries: [],
      pages: {
        page: beyondPage,
        pages: Math.ceil(total / perPage),
        total,
        perPage,
      },
    },
  };
}

/**
 * Mock active timer response (for timer_current)
 */
export function mockActiveTimerResponse(
  overrides: TimeEntryOverrides = {}
): FreshBooksResponse<TimeEntryListData> {
  return {
    ok: true,
    data: {
      timeEntries: [
        createTimeEntry({
          active: true,
          isLogged: false,
          duration: 0,
          timer: {
            id: faker.number.int({ min: 1, max: 999999 }),
            isRunning: true,
          },
          ...overrides,
        }),
      ],
      pages: createPaginationMeta(1, 1, 30),
    },
  };
}

/**
 * Mock no active timer response (for timer_current when no timer running)
 */
export function mockNoActiveTimerResponse(): FreshBooksResponse<TimeEntryListData> {
  return mockTimeEntryEmptyListResponse();
}
