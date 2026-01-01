import { faker } from "@faker-js/faker";
import type { Task, Money, VisState } from "../../../src/types/freshbooks";

export interface TaskOverrides {
  id?: number;
  taskid?: number;
  name?: string | null;
  tname?: string | null;
  description?: string | null;
  tdesc?: string | null;
  billable?: boolean;
  rate?: Money;
  visState?: VisState;
  updated?: string;
}

/**
 * Create a mock Money object
 */
export function createMoney(amount?: string, code: string = 'USD'): Money {
  return {
    amount: amount ?? faker.finance.amount({ min: 0, max: 500, dec: 2 }),
    code,
  };
}

/**
 * Create a mock Task with realistic data
 */
export function createTask(overrides: TaskOverrides = {}): Task {
  const taskNames = [
    'Development',
    'Testing',
    'Code Review',
    'Documentation',
    'Bug Fixing',
    'Deployment',
    'Meeting',
    'Planning',
    'Research',
    'Maintenance',
  ];

  const taskName = overrides.name ?? overrides.tname ?? faker.helpers.arrayElement(taskNames);

  return {
    id: overrides.id ?? faker.number.int({ min: 1, max: 999999 }),
    taskid: overrides.taskid ?? faker.number.int({ min: 1, max: 999999 }),
    name: overrides.name !== undefined ? overrides.name : taskName,
    tname: overrides.tname !== undefined ? overrides.tname : taskName,
    description: overrides.description !== undefined ? overrides.description : faker.lorem.sentence(),
    tdesc: overrides.tdesc !== undefined ? overrides.tdesc : faker.lorem.sentence(),
    billable: overrides.billable ?? true,
    rate: overrides.rate ?? createMoney(),
    visState: overrides.visState ?? 0, // 0 = active
    updated: overrides.updated ?? faker.date.recent({ days: 30 }).toISOString(),
  };
}

/**
 * Create a list of mock Tasks
 */
export function createTaskList(
  count: number = 10,
  overrides: TaskOverrides = {}
): Task[] {
  return Array.from({ length: count }, (_, i) =>
    createTask({ ...overrides, id: (overrides.id ?? 1) + i })
  );
}

/**
 * Create a billable task
 */
export function createBillableTask(overrides: TaskOverrides = {}): Task {
  return createTask({
    billable: true,
    rate: createMoney(faker.finance.amount({ min: 50, max: 300, dec: 2 })),
    ...overrides,
  });
}

/**
 * Create a non-billable task
 */
export function createNonBillableTask(overrides: TaskOverrides = {}): Task {
  return createTask({
    billable: false,
    rate: createMoney('0.00'),
    ...overrides,
  });
}

/**
 * Create an archived task
 */
export function createArchivedTask(overrides: TaskOverrides = {}): Task {
  return createTask({
    visState: 2, // 2 = archived
    ...overrides,
  });
}

/**
 * Create a deleted task
 */
export function createDeletedTask(overrides: TaskOverrides = {}): Task {
  return createTask({
    visState: 1, // 1 = deleted
    ...overrides,
  });
}
