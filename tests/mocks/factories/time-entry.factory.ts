import { faker } from "@faker-js/faker";
import type { TimeEntry, Timer } from "../../../src/types/freshbooks";

export interface TimeEntryOverrides {
  id?: number;
  identityId?: number;
  isLogged?: boolean;
  startedAt?: string;
  createdAt?: string;
  clientId?: number | null;
  projectId?: number | null;
  pendingClient?: string | null;
  pendingProject?: string | null;
  pendingTask?: string | null;
  taskId?: number | null;
  serviceId?: number | null;
  note?: string | null;
  active?: boolean;
  billable?: boolean;
  billed?: boolean;
  internal?: boolean;
  retainerId?: number | null;
  duration?: number;
  timer?: Timer | null;
}

/**
 * Create a mock Timer object
 */
export function createTimer(isRunning: boolean = true): Timer {
  return {
    id: faker.number.int({ min: 1, max: 999999 }),
    isRunning,
  };
}

/**
 * Create a mock TimeEntry with realistic data
 */
export function createTimeEntry(overrides: TimeEntryOverrides = {}): TimeEntry {
  const isActive = overrides.active ?? false;
  const isLogged = overrides.isLogged ?? !isActive;

  return {
    id: overrides.id ?? faker.number.int({ min: 1, max: 999999 }),
    identityId: overrides.identityId ?? faker.number.int({ min: 1, max: 1000 }),
    isLogged,
    startedAt: overrides.startedAt ?? faker.date.recent({ days: 7 }).toISOString(),
    createdAt: overrides.createdAt ?? faker.date.past({ years: 1 }).toISOString(),
    clientId: overrides.clientId !== undefined ? overrides.clientId : faker.number.int({ min: 1, max: 1000 }),
    projectId: overrides.projectId !== undefined ? overrides.projectId : faker.number.int({ min: 1, max: 1000 }),
    pendingClient: overrides.pendingClient ?? null,
    pendingProject: overrides.pendingProject ?? null,
    pendingTask: overrides.pendingTask ?? null,
    taskId: overrides.taskId !== undefined ? overrides.taskId : faker.number.int({ min: 1, max: 500 }),
    serviceId: overrides.serviceId !== undefined ? overrides.serviceId : faker.number.int({ min: 1, max: 100 }),
    note: overrides.note !== undefined ? overrides.note : faker.lorem.sentence(),
    active: isActive,
    billable: overrides.billable ?? true,
    billed: overrides.billed ?? false,
    internal: overrides.internal ?? false,
    retainerId: overrides.retainerId ?? null,
    duration: overrides.duration ?? (isActive ? 0 : faker.number.int({ min: 60, max: 28800 })), // 1 min to 8 hours
    timer: overrides.timer !== undefined ? overrides.timer : (isActive ? createTimer(true) : null),
  };
}

/**
 * Create a list of mock TimeEntries
 */
export function createTimeEntryList(
  count: number = 10,
  overrides: TimeEntryOverrides = {}
): TimeEntry[] {
  return Array.from({ length: count }, (_, i) =>
    createTimeEntry({ ...overrides, id: (overrides.id ?? 1) + i })
  );
}

/**
 * Create an active timer (TimeEntry with active=true)
 */
export function createActiveTimer(overrides: TimeEntryOverrides = {}): TimeEntry {
  return createTimeEntry({
    active: true,
    isLogged: false,
    duration: 0,
    startedAt: new Date().toISOString(),
    timer: createTimer(true),
    ...overrides,
  });
}

/**
 * Create a logged time entry (completed, no timer)
 */
export function createLoggedTimeEntry(overrides: TimeEntryOverrides = {}): TimeEntry {
  return createTimeEntry({
    active: false,
    isLogged: true,
    duration: faker.number.int({ min: 1800, max: 28800 }), // 30 min to 8 hours
    timer: null,
    ...overrides,
  });
}

/**
 * Create a billable time entry
 */
export function createBillableTimeEntry(overrides: TimeEntryOverrides = {}): TimeEntry {
  return createTimeEntry({
    billable: true,
    billed: false,
    isLogged: true,
    active: false,
    ...overrides,
  });
}

/**
 * Create a billed time entry
 */
export function createBilledTimeEntry(overrides: TimeEntryOverrides = {}): TimeEntry {
  return createTimeEntry({
    billable: true,
    billed: true,
    isLogged: true,
    active: false,
    ...overrides,
  });
}

/**
 * Create an internal (non-billable) time entry
 */
export function createInternalTimeEntry(overrides: TimeEntryOverrides = {}): TimeEntry {
  return createTimeEntry({
    billable: false,
    internal: true,
    isLogged: true,
    active: false,
    ...overrides,
  });
}
