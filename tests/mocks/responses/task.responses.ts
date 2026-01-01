import { faker } from "@faker-js/faker";
import {
  createTask,
  createTaskList,
  type TaskOverrides,
} from "../factories/task.factory";
import type {
  FreshBooksResponse,
  TaskSingleData,
  TaskListData,
  Task,
} from "../../../src/types/freshbooks";
import { createPaginationMeta } from "./time-entry.responses";

/**
 * Mock successful single Task response
 */
export function mockTaskSingleResponse(
  overrides: TaskOverrides = {}
): FreshBooksResponse<TaskSingleData> {
  return {
    ok: true,
    data: {
      task: createTask(overrides),
    },
  };
}

/**
 * Mock successful Task list response
 */
export function mockTaskListResponse(
  count: number = 10,
  page: number = 1,
  perPage: number = 30
): FreshBooksResponse<TaskListData> {
  const total = count;
  const itemsOnPage = Math.min(perPage, Math.max(0, total - (page - 1) * perPage));

  return {
    ok: true,
    data: {
      tasks: createTaskList(itemsOnPage),
      pages: createPaginationMeta(page, total, perPage),
    },
  };
}

/**
 * Mock empty Task list response
 */
export function mockTaskEmptyListResponse(): FreshBooksResponse<TaskListData> {
  return {
    ok: true,
    data: {
      tasks: [],
      pages: createPaginationMeta(1, 0, 30),
    },
  };
}

/**
 * Mock successful Task create response
 */
export function mockTaskCreateResponse(
  input: Partial<Task>
): FreshBooksResponse<TaskSingleData> {
  const now = new Date().toISOString();
  return {
    ok: true,
    data: {
      task: createTask({
        ...input,
        id: faker.number.int({ min: 1, max: 999999 }),
        updated: now,
      }),
    },
  };
}

/**
 * Mock successful Task update response
 */
export function mockTaskUpdateResponse(
  id: number,
  changes: Partial<Task>
): FreshBooksResponse<TaskSingleData> {
  return {
    ok: true,
    data: {
      task: createTask({
        id,
        updated: new Date().toISOString(),
        ...changes,
      }),
    },
  };
}

/**
 * Mock successful Task delete response
 */
export function mockTaskDeleteResponse(): FreshBooksResponse<void> {
  return {
    ok: true,
  };
}

/**
 * Mock first page of multi-page results
 */
export function mockTaskFirstPage(
  total: number = 100,
  perPage: number = 30
): FreshBooksResponse<TaskListData> {
  return mockTaskListResponse(total, 1, perPage);
}

/**
 * Mock middle page of results
 */
export function mockTaskMiddlePage(
  page: number = 2,
  total: number = 100,
  perPage: number = 30
): FreshBooksResponse<TaskListData> {
  return mockTaskListResponse(total, page, perPage);
}

/**
 * Mock last page of results
 */
export function mockTaskLastPage(
  total: number = 100,
  perPage: number = 30
): FreshBooksResponse<TaskListData> {
  const lastPage = Math.ceil(total / perPage);
  return mockTaskListResponse(total, lastPage, perPage);
}

/**
 * Mock page beyond the last page
 */
export function mockTaskBeyondLastPage(
  total: number = 100,
  perPage: number = 30
): FreshBooksResponse<TaskListData> {
  const beyondPage = Math.ceil(total / perPage) + 1;
  return {
    ok: true,
    data: {
      tasks: [],
      pages: {
        page: beyondPage,
        pages: Math.ceil(total / perPage),
        total,
        perPage,
      },
    },
  };
}
