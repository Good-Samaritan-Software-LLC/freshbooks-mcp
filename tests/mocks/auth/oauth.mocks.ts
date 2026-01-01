import { faker } from "@faker-js/faker";
import type {
  OAuthTokenResponse,
  OAuthErrorResponse,
  AccountListResponse,
  BusinessMembership,
} from "../../../src/types/freshbooks";

/**
 * Create a mock OAuth token response
 */
export function mockTokenResponse(overrides: Partial<OAuthTokenResponse> = {}): OAuthTokenResponse {
  const now = Math.floor(Date.now() / 1000);
  return {
    access_token: overrides.access_token ?? "mock_access_token_" + faker.string.alphanumeric(32),
    refresh_token: overrides.refresh_token ?? "mock_refresh_token_" + faker.string.alphanumeric(32),
    token_type: overrides.token_type ?? "Bearer",
    expires_in: overrides.expires_in ?? 43200, // 12 hours
    created_at: overrides.created_at ?? now,
  };
}

/**
 * Create a mock expired token response
 */
export function mockExpiredTokenResponse(): OAuthTokenResponse {
  const createdAt = Math.floor(Date.now() / 1000) - 50000; // Created ~14 hours ago
  return mockTokenResponse({
    created_at: createdAt,
    expires_in: 43200, // 12 hours - so it's expired
  });
}

/**
 * Create a mock token refresh response (new tokens)
 */
export function mockTokenRefreshResponse(): OAuthTokenResponse {
  return mockTokenResponse({
    // Fresh tokens with current timestamp
  });
}

/**
 * Create a mock invalid grant error (invalid auth code or refresh token)
 */
export function mockInvalidGrantError(): OAuthErrorResponse {
  return {
    error: "invalid_grant",
    error_description: "The authorization code has expired or is invalid",
  };
}

/**
 * Create a mock invalid client error
 */
export function mockInvalidClientError(): OAuthErrorResponse {
  return {
    error: "invalid_client",
    error_description: "Client authentication failed",
  };
}

/**
 * Create a mock invalid request error
 */
export function mockInvalidRequestError(description: string = "Invalid request parameters"): OAuthErrorResponse {
  return {
    error: "invalid_request",
    error_description: description,
  };
}

/**
 * Create a mock unauthorized client error
 */
export function mockUnauthorizedClientError(): OAuthErrorResponse {
  return {
    error: "unauthorized_client",
    error_description: "The client is not authorized to request a token using this method",
  };
}

/**
 * Create a mock unsupported grant type error
 */
export function mockUnsupportedGrantTypeError(): OAuthErrorResponse {
  return {
    error: "unsupported_grant_type",
    error_description: "The authorization grant type is not supported",
  };
}

/**
 * Create a mock business membership
 */
export function createBusinessMembership(overrides: Partial<BusinessMembership> = {}): BusinessMembership {
  return {
    id: overrides.id ?? faker.number.int({ min: 1, max: 9999 }),
    role: overrides.role ?? "owner",
    business: overrides.business ?? {
      id: faker.number.int({ min: 1, max: 9999 }),
      name: faker.company.name(),
      account_id: faker.string.alphanumeric(6).toUpperCase(),
    },
  };
}

/**
 * Create a mock account list response
 */
export function mockAccountListResponse(
  businessCount: number = 1
): AccountListResponse {
  const memberships: BusinessMembership[] = Array.from(
    { length: businessCount },
    () => createBusinessMembership()
  );

  return {
    response: {
      result: {
        business_memberships: memberships,
      },
    },
  };
}

/**
 * Create a mock account list response with specific account
 */
export function mockAccountListResponseWithAccount(
  accountId: string,
  businessName?: string
): AccountListResponse {
  return {
    response: {
      result: {
        business_memberships: [
          {
            id: faker.number.int({ min: 1, max: 9999 }),
            role: "owner",
            business: {
              id: faker.number.int({ min: 1, max: 9999 }),
              name: businessName ?? faker.company.name(),
              account_id: accountId,
            },
          },
        ],
      },
    },
  };
}

/**
 * Create a mock empty account list (no businesses)
 */
export function mockEmptyAccountListResponse(): AccountListResponse {
  return {
    response: {
      result: {
        business_memberships: [],
      },
    },
  };
}

/**
 * Create a mock account list with multiple businesses
 */
export function mockMultipleAccountsResponse(): AccountListResponse {
  return mockAccountListResponse(3);
}
