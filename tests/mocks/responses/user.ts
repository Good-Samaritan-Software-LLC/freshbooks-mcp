/**
 * Mock responses for User entity
 */

/**
 * Create a mock business membership object
 */
export function createMockBusinessMembership(overrides: Record<string, unknown> = {}) {
  const id = (overrides.id as number) || 123456;
  return {
    id,
    name: overrides.name || 'Test Business Inc.',
    accountId: overrides.accountId || `ABC${id}`,
    role: overrides.role || 'owner',
  };
}

/**
 * Create a mock user object
 */
export function createMockUser(overrides: Record<string, unknown> = {}) {
  const id = (overrides.id as number) || 1;
  return {
    id,
    email: overrides.email || 'user@example.com',
    firstName: overrides.firstName || 'John',
    lastName: overrides.lastName || 'Doe',
    businessMemberships: overrides.businessMemberships || [
      createMockBusinessMembership(),
    ],
    phoneNumbers: overrides.phoneNumbers || [
      {
        title: 'Mobile',
        number: '+1-555-123-4567',
      },
    ],
    addresses: overrides.addresses || [
      {
        street: '123 Main Street',
        city: 'Toronto',
        province: 'ON',
        country: 'Canada',
        postalCode: 'M5V 2H1',
      },
    ],
    profession: overrides.profession || 'Software Developer',
    links: overrides.links || {
      me: '/service/auth/api/v1/users/1',
    },
    ...overrides,
  };
}

/**
 * Mock response for user me (get current user)
 */
export function mockUserMeResponse(overrides: Record<string, unknown> = {}) {
  return {
    ok: true,
    data: createMockUser(overrides),
  };
}

/**
 * Mock response for user with multiple business memberships
 */
export function mockUserMultipleBusinessesResponse() {
  return {
    ok: true,
    data: createMockUser({
      businessMemberships: [
        createMockBusinessMembership({ id: 111111, name: 'Business One', role: 'owner' }),
        createMockBusinessMembership({ id: 222222, name: 'Business Two', role: 'admin' }),
        createMockBusinessMembership({ id: 333333, name: 'Business Three', role: 'employee' }),
      ],
    }),
  };
}

/**
 * Mock response for user with minimal data
 */
export function mockUserMinimalResponse() {
  return {
    ok: true,
    data: {
      id: 1,
      email: 'minimal@example.com',
      firstName: 'Min',
      lastName: 'User',
      businessMemberships: [
        createMockBusinessMembership(),
      ],
      phoneNumbers: [],
      addresses: [],
    },
  };
}

/**
 * Mock response for user with no optional fields
 */
export function mockUserNoOptionalFieldsResponse() {
  return {
    ok: true,
    data: {
      id: 1,
      email: 'basic@example.com',
      firstName: 'Basic',
      lastName: 'User',
      businessMemberships: [
        createMockBusinessMembership(),
      ],
    },
  };
}

/**
 * Mock response for user with unicode characters
 */
export function mockUserUnicodeResponse() {
  return {
    ok: true,
    data: createMockUser({
      firstName: '山田',
      lastName: '太郎',
      email: 'yamada@example.jp',
      profession: 'デザイナー 🎨',
      businessMemberships: [
        createMockBusinessMembership({ name: '株式会社テスト' }),
      ],
    }),
  };
}
