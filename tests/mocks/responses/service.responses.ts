import { faker } from "@faker-js/faker";
import {
  createService,
  createServiceList,
  type ServiceOverrides,
} from "../factories/service.factory";
import type {
  FreshBooksResponse,
  ServiceSingleData,
  ServiceListData,
  Service,
} from "../../../src/types/freshbooks";
import { createPaginationMeta } from "./time-entry.responses";

/**
 * Mock successful single Service response
 */
export function mockServiceSingleResponse(
  overrides: ServiceOverrides = {}
): FreshBooksResponse<ServiceSingleData> {
  return {
    ok: true,
    data: {
      service: createService(overrides),
    },
  };
}

/**
 * Mock successful Service list response
 */
export function mockServiceListResponse(
  count: number = 10,
  page: number = 1,
  perPage: number = 30
): FreshBooksResponse<ServiceListData> {
  const total = count;
  const itemsOnPage = Math.min(perPage, Math.max(0, total - (page - 1) * perPage));

  return {
    ok: true,
    data: {
      services: createServiceList(itemsOnPage),
      pages: createPaginationMeta(page, total, perPage),
    },
  };
}

/**
 * Mock empty Service list response
 */
export function mockServiceEmptyListResponse(): FreshBooksResponse<ServiceListData> {
  return {
    ok: true,
    data: {
      services: [],
      pages: createPaginationMeta(1, 0, 30),
    },
  };
}

/**
 * Mock successful Service create response
 */
export function mockServiceCreateResponse(
  input: Partial<Service>
): FreshBooksResponse<ServiceSingleData> {
  return {
    ok: true,
    data: {
      service: createService({
        ...input,
        id: faker.number.int({ min: 1, max: 999999 }),
      }),
    },
  };
}

/**
 * Mock successful Service delete response (actually sets visState=1)
 */
export function mockServiceDeleteResponse(
  id: number
): FreshBooksResponse<ServiceSingleData> {
  return {
    ok: true,
    data: {
      service: createService({
        id,
        visState: 1, // 1 = deleted
      }),
    },
  };
}

/**
 * Mock first page of multi-page results
 */
export function mockServiceFirstPage(
  total: number = 100,
  perPage: number = 30
): FreshBooksResponse<ServiceListData> {
  return mockServiceListResponse(total, 1, perPage);
}

/**
 * Mock middle page of results
 */
export function mockServiceMiddlePage(
  page: number = 2,
  total: number = 100,
  perPage: number = 30
): FreshBooksResponse<ServiceListData> {
  return mockServiceListResponse(total, page, perPage);
}

/**
 * Mock last page of results
 */
export function mockServiceLastPage(
  total: number = 100,
  perPage: number = 30
): FreshBooksResponse<ServiceListData> {
  const lastPage = Math.ceil(total / perPage);
  return mockServiceListResponse(total, lastPage, perPage);
}

/**
 * Mock page beyond the last page
 */
export function mockServiceBeyondLastPage(
  total: number = 100,
  perPage: number = 30
): FreshBooksResponse<ServiceListData> {
  const beyondPage = Math.ceil(total / perPage) + 1;
  return {
    ok: true,
    data: {
      services: [],
      pages: {
        page: beyondPage,
        pages: Math.ceil(total / perPage),
        total,
        perPage,
      },
    },
  };
}
