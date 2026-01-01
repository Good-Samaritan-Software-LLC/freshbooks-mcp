import { faker } from "@faker-js/faker";
import {
  createProject,
  createProjectList,
  type ProjectOverrides,
} from "../factories/project.factory";
import type {
  FreshBooksResponse,
  ProjectSingleData,
  ProjectListData,
  Project,
} from "../../../src/types/freshbooks";
import { createPaginationMeta } from "./time-entry.responses";

/**
 * Mock successful single Project response
 */
export function mockProjectSingleResponse(
  overrides: ProjectOverrides = {}
): FreshBooksResponse<ProjectSingleData> {
  return {
    ok: true,
    data: {
      project: createProject(overrides),
    },
  };
}

/**
 * Mock successful Project list response
 */
export function mockProjectListResponse(
  count: number = 10,
  page: number = 1,
  perPage: number = 30
): FreshBooksResponse<ProjectListData> {
  const total = count;
  const itemsOnPage = Math.min(perPage, Math.max(0, total - (page - 1) * perPage));

  return {
    ok: true,
    data: {
      projects: createProjectList(itemsOnPage),
      pages: createPaginationMeta(page, total, perPage),
    },
  };
}

/**
 * Mock empty Project list response
 */
export function mockProjectEmptyListResponse(): FreshBooksResponse<ProjectListData> {
  return {
    ok: true,
    data: {
      projects: [],
      pages: createPaginationMeta(1, 0, 30),
    },
  };
}

/**
 * Mock successful Project create response
 */
export function mockProjectCreateResponse(
  input: Partial<Project>
): FreshBooksResponse<ProjectSingleData> {
  const now = new Date().toISOString();
  return {
    ok: true,
    data: {
      project: createProject({
        ...input,
        id: faker.number.int({ min: 1, max: 999999 }),
        createdAt: now,
        updatedAt: now,
      }),
    },
  };
}

/**
 * Mock successful Project update response
 */
export function mockProjectUpdateResponse(
  id: number,
  changes: Partial<Project>
): FreshBooksResponse<ProjectSingleData> {
  return {
    ok: true,
    data: {
      project: createProject({
        id,
        updatedAt: new Date().toISOString(),
        ...changes,
      }),
    },
  };
}

/**
 * Mock successful Project delete response
 */
export function mockProjectDeleteResponse(): FreshBooksResponse<void> {
  return {
    ok: true,
  };
}

/**
 * Mock first page of multi-page results
 */
export function mockProjectFirstPage(
  total: number = 100,
  perPage: number = 30
): FreshBooksResponse<ProjectListData> {
  return mockProjectListResponse(total, 1, perPage);
}

/**
 * Mock middle page of results
 */
export function mockProjectMiddlePage(
  page: number = 2,
  total: number = 100,
  perPage: number = 30
): FreshBooksResponse<ProjectListData> {
  return mockProjectListResponse(total, page, perPage);
}

/**
 * Mock last page of results
 */
export function mockProjectLastPage(
  total: number = 100,
  perPage: number = 30
): FreshBooksResponse<ProjectListData> {
  const lastPage = Math.ceil(total / perPage);
  return mockProjectListResponse(total, lastPage, perPage);
}

/**
 * Mock page beyond the last page
 */
export function mockProjectBeyondLastPage(
  total: number = 100,
  perPage: number = 30
): FreshBooksResponse<ProjectListData> {
  const beyondPage = Math.ceil(total / perPage) + 1;
  return {
    ok: true,
    data: {
      projects: [],
      pages: {
        page: beyondPage,
        pages: Math.ceil(total / perPage),
        total,
        perPage,
      },
    },
  };
}
