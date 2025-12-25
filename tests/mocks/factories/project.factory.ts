import { faker } from "@faker-js/faker";
import type { Project, BillingMethod, ProjectType, BilledStatus } from "../../../src/types/freshbooks";

export interface ProjectOverrides {
  id?: number;
  title?: string;
  description?: string | null;
  dueDate?: string | null;
  clientId?: string | null;
  internal?: boolean;
  budget?: string | null;
  fixedPrice?: string | null;
  rate?: string | null;
  billingMethod?: BillingMethod | null;
  projectType?: ProjectType;
  projectManagerId?: string | null;
  active?: boolean;
  complete?: boolean;
  sample?: boolean;
  createdAt?: string;
  updatedAt?: string;
  loggedDuration?: number | null;
  billedAmount?: number;
  billedStatus?: BilledStatus;
  retainerId?: string | null;
  expenseMarkup?: number;
  groupId?: string | null;
}

/**
 * Create a mock Project with realistic data
 */
export function createProject(overrides: ProjectOverrides = {}): Project {
  const billingMethods: BillingMethod[] = ['project_rate', 'service_rate', 'flat_rate', 'team_member_rate'];
  const projectTypes: ProjectType[] = ['fixed_price', 'hourly_rate'];
  const billedStatuses: BilledStatus[] = ['unbilled', 'partial', 'billed'];

  const projectType = overrides.projectType ?? faker.helpers.arrayElement(projectTypes);
  const isFixedPrice = projectType === 'fixed_price';

  return {
    id: overrides.id ?? faker.number.int({ min: 1, max: 999999 }),
    title: overrides.title ?? faker.company.catchPhrase(),
    description: overrides.description !== undefined ? overrides.description : faker.lorem.paragraph(),
    dueDate: overrides.dueDate !== undefined ? overrides.dueDate : faker.date.future().toISOString(),
    clientId: overrides.clientId !== undefined ? overrides.clientId : faker.number.int({ min: 1, max: 1000 }).toString(),
    internal: overrides.internal ?? false,
    budget: overrides.budget !== undefined ? overrides.budget : faker.finance.amount({ min: 1000, max: 100000, dec: 2 }),
    fixedPrice: overrides.fixedPrice !== undefined
      ? overrides.fixedPrice
      : (isFixedPrice ? faker.finance.amount({ min: 5000, max: 50000, dec: 2 }) : null),
    rate: overrides.rate !== undefined
      ? overrides.rate
      : (!isFixedPrice ? faker.finance.amount({ min: 50, max: 300, dec: 2 }) : null),
    billingMethod: overrides.billingMethod !== undefined ? overrides.billingMethod : faker.helpers.arrayElement(billingMethods),
    projectType,
    projectManagerId: overrides.projectManagerId !== undefined ? overrides.projectManagerId : faker.number.int({ min: 1, max: 100 }).toString(),
    active: overrides.active ?? true,
    complete: overrides.complete ?? false,
    sample: overrides.sample ?? false,
    createdAt: overrides.createdAt ?? faker.date.past({ years: 2 }).toISOString(),
    updatedAt: overrides.updatedAt ?? faker.date.recent({ days: 30 }).toISOString(),
    loggedDuration: overrides.loggedDuration !== undefined
      ? overrides.loggedDuration
      : faker.number.int({ min: 0, max: 500000 }),
    billedAmount: overrides.billedAmount ?? faker.number.int({ min: 0, max: 50000 }),
    billedStatus: overrides.billedStatus ?? faker.helpers.arrayElement(billedStatuses),
    retainerId: overrides.retainerId ?? null,
    expenseMarkup: overrides.expenseMarkup ?? faker.number.int({ min: 0, max: 50 }),
    groupId: overrides.groupId ?? null,
  };
}

/**
 * Create a list of mock Projects
 */
export function createProjectList(
  count: number = 10,
  overrides: ProjectOverrides = {}
): Project[] {
  return Array.from({ length: count }, (_, i) =>
    createProject({ ...overrides, id: (overrides.id ?? 1) + i })
  );
}

/**
 * Create an active project
 */
export function createActiveProject(overrides: ProjectOverrides = {}): Project {
  return createProject({
    active: true,
    complete: false,
    ...overrides,
  });
}

/**
 * Create a completed project
 */
export function createCompletedProject(overrides: ProjectOverrides = {}): Project {
  return createProject({
    active: false,
    complete: true,
    billedStatus: 'billed',
    ...overrides,
  });
}

/**
 * Create an internal project
 */
export function createInternalProject(overrides: ProjectOverrides = {}): Project {
  return createProject({
    internal: true,
    clientId: null,
    ...overrides,
  });
}

/**
 * Create a fixed-price project
 */
export function createFixedPriceProject(overrides: ProjectOverrides = {}): Project {
  return createProject({
    projectType: 'fixed_price',
    fixedPrice: faker.finance.amount({ min: 5000, max: 50000, dec: 2 }),
    rate: null,
    ...overrides,
  });
}

/**
 * Create an hourly-rate project
 */
export function createHourlyRateProject(overrides: ProjectOverrides = {}): Project {
  return createProject({
    projectType: 'hourly_rate',
    rate: faker.finance.amount({ min: 50, max: 300, dec: 2 }),
    fixedPrice: null,
    ...overrides,
  });
}
