import { faker } from "@faker-js/faker";
import type { Service, ServiceRate, VisState } from "../../../src/types/freshbooks";

export interface ServiceOverrides {
  id?: number;
  businessId?: number;
  name?: string;
  billable?: boolean;
  visState?: VisState;
}

export interface ServiceRateOverrides {
  rate?: string;
  code?: string;
}

/**
 * Create a mock Service with realistic data
 */
export function createService(overrides: ServiceOverrides = {}): Service {
  const serviceNames = [
    'Consulting',
    'Web Development',
    'Design',
    'Project Management',
    'Code Review',
    'Training',
    'Support',
    'Database Administration',
    'DevOps',
    'Quality Assurance',
  ];

  return {
    id: overrides.id ?? faker.number.int({ min: 1, max: 999999 }),
    businessId: overrides.businessId ?? faker.number.int({ min: 1, max: 10000 }),
    name: overrides.name ?? faker.helpers.arrayElement(serviceNames),
    billable: overrides.billable ?? true,
    visState: overrides.visState ?? 0, // 0 = active
  };
}

/**
 * Create a list of mock Services
 */
export function createServiceList(
  count: number = 10,
  overrides: ServiceOverrides = {}
): Service[] {
  return Array.from({ length: count }, (_, i) =>
    createService({ ...overrides, id: (overrides.id ?? 1) + i })
  );
}

/**
 * Create a mock ServiceRate
 */
export function createServiceRate(overrides: ServiceRateOverrides = {}): ServiceRate {
  return {
    rate: overrides.rate ?? faker.finance.amount({ min: 50, max: 500, dec: 2 }),
    code: overrides.code ?? 'USD',
  };
}

/**
 * Create a billable service
 */
export function createBillableService(overrides: ServiceOverrides = {}): Service {
  return createService({
    billable: true,
    visState: 0,
    ...overrides,
  });
}

/**
 * Create a non-billable service
 */
export function createNonBillableService(overrides: ServiceOverrides = {}): Service {
  return createService({
    billable: false,
    ...overrides,
  });
}

/**
 * Create an archived service
 */
export function createArchivedService(overrides: ServiceOverrides = {}): Service {
  return createService({
    visState: 2, // 2 = archived
    ...overrides,
  });
}

/**
 * Create a deleted service
 */
export function createDeletedService(overrides: ServiceOverrides = {}): Service {
  return createService({
    visState: 1, // 1 = deleted
    ...overrides,
  });
}
