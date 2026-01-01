# User API Reference

User tools provide information about the authenticated user and their business memberships.

## user_me

Get current authenticated user information.

### Description

Retrieve information about the currently authenticated user including name, email, and business memberships.

**When to use:**
- User wants to see their account information
- Need to get account IDs for business selection
- Verify current authentication status
- Get user ID for staff-related operations

### Input Schema

No input parameters required. Uses current authentication token.

### Input Example

```json
{}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| id | number | Unique user identifier |
| email | string | User email address |
| firstName | string | First name |
| lastName | string | Last name |
| businessMemberships | BusinessMembership[] | Businesses this user belongs to |
| phoneNumbers | Phone[] | User phone numbers |
| addresses | Address[] | User addresses |
| profession | string | User profession |
| links | object | Related resource links |

#### BusinessMembership Object

| Field | Type | Description |
|-------|------|-------------|
| id | number | Business ID |
| name | string | Business name |
| accountId | string | Account ID for this business |
| role | string | User role in business (owner, admin, employee) |

#### Phone Object

| Field | Type | Description |
|-------|------|-------------|
| title | string | Phone type (e.g., "Mobile", "Work") |
| number | string | Phone number |

#### Address Object

| Field | Type | Description |
|-------|------|-------------|
| street | string | Street address |
| city | string | City |
| province | string | Province/state |
| country | string | Country |
| postalCode | string | Postal/ZIP code |

### Output Example

```json
{
  "id": 12345,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "businessMemberships": [
    {
      "id": 1001,
      "name": "John Doe Consulting",
      "accountId": "ABC123",
      "role": "owner"
    },
    {
      "id": 1002,
      "name": "Acme Corporation",
      "accountId": "XYZ789",
      "role": "employee"
    }
  ],
  "phoneNumbers": [
    {
      "title": "Mobile",
      "number": "+1-555-0100"
    }
  ],
  "addresses": [
    {
      "street": "123 Main St",
      "city": "New York",
      "province": "NY",
      "country": "USA",
      "postalCode": "10001"
    }
  ],
  "profession": "Consultant",
  "links": {
    "me": "/auth/api/v1/users/12345"
  }
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |
| -32002 | Token expired | Yes | Token auto-refreshes, retry request |

### Related Tools

- [auth_status](./authentication.md#auth_status) - Check authentication status
- [expense_create](./expenses.md#expense_create) - Use user ID as staffId

---

## Notes

### Business Memberships

Users can belong to multiple businesses in FreshBooks. Each membership includes:
- Business/account ID needed for API calls
- Role indicating permissions (owner, admin, employee)
- Business name for display

### Account Selection

When a user belongs to multiple businesses, they need to select which account to use for operations. Use the `accountId` from business memberships for all API calls.

### User ID vs Staff ID

- **User ID** - Unique identifier for FreshBooks user account
- **Staff ID** - May differ and is used for time entries and expenses

The user ID from `user_me` can typically be used as the staff ID for creating expenses and time entries.

### Authentication

This tool requires valid authentication. Call after successful OAuth2 flow to verify authentication and get user details.

### Privacy

This endpoint only returns information about the authenticated user. Users cannot query other users' information.

### Role-Based Access

User role in a business determines what operations they can perform:
- **Owner** - Full access to all data and settings
- **Admin** - Manage most business operations
- **Employee** - Limited access based on permissions

Certain operations may fail if the user doesn't have sufficient permissions in the business.
