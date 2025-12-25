/**
 * Zod schemas for User entity
 *
 * User account schemas for FreshBooks API
 */

import { z } from 'zod';

/**
 * Business membership schema
 */
export const BusinessMembershipSchema = z.object({
  id: z.number().describe('Business ID'),
  name: z.string().describe('Business name'),
  accountId: z.string().describe('Account ID for this business'),
  role: z.string().describe('User role in this business (e.g., owner, admin, employee)'),
});

/**
 * Full User schema with all properties
 */
export const UserSchema = z.object({
  id: z.number().describe('Unique user identifier'),
  email: z.string().email().describe('User email address'),
  firstName: z.string().describe('First name'),
  lastName: z.string().describe('Last name'),
  businessMemberships: z.array(BusinessMembershipSchema).describe('Businesses this user belongs to'),
  phoneNumbers: z.array(z.object({
    title: z.string().optional(),
    number: z.string(),
  })).optional().describe('User phone numbers'),
  addresses: z.array(z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
  })).optional().describe('User addresses'),
  profession: z.string().optional().describe('User profession'),
  links: z.object({
    me: z.string().describe('Link to user profile'),
  }).optional().describe('Related resource links'),
});

/**
 * Input schema for getting current user info (no parameters needed)
 */
export const UserMeInputSchema = z.object({
  // No parameters needed - gets current authenticated user
});

/**
 * Output schema for user_me operation
 */
export const UserMeOutputSchema = UserSchema;
