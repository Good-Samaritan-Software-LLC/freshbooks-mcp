/**
 * Vitest Setup File
 *
 * Mocks external dependencies that aren't properly resolved in the test environment.
 */

import { vi } from 'vitest';

// Mock @freshbooks/api query builders
// These are classes exported from the SDK that need to be mocked for tests
vi.mock('@freshbooks/api', () => ({
  // PaginationQueryBuilder mock
  PaginationQueryBuilder: vi.fn().mockImplementation(() => ({
    page: vi.fn().mockReturnThis(),
    perPage: vi.fn().mockReturnThis(),
  })),

  // SearchQueryBuilder mock
  SearchQueryBuilder: vi.fn().mockImplementation(() => ({
    equals: vi.fn().mockReturnThis(),
    boolean: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    between: vi.fn().mockReturnThis(),
    datetime: vi.fn().mockReturnThis(),
  })),

  // IncludesQueryBuilder mock
  IncludesQueryBuilder: vi.fn().mockImplementation(() => ({
    includes: vi.fn().mockReturnThis(),
  })),

  // SortQueryBuilder mock (in case it's used)
  SortQueryBuilder: vi.fn().mockImplementation(() => ({
    ascending: vi.fn().mockReturnThis(),
    descending: vi.fn().mockReturnThis(),
  })),

  // Client mock (in case direct Client import is used)
  Client: vi.fn().mockImplementation(() => ({
    timeEntries: {},
    projects: {},
    services: {},
    tasks: {},
  })),
}));
