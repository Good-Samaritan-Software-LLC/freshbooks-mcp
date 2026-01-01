/**
 * FreshBooks entity type definitions
 * These match the structure returned by @freshbooks/api SDK
 */

/**
 * Money type - decimal amount with currency code
 */
export interface Money {
  amount: string;
  code: string;
}

/**
 * Visibility state enum
 * 0 = active, 1 = deleted, 2 = archived
 */
export type VisState = 0 | 1 | 2;

/**
 * Timer embedded in TimeEntry
 */
export interface Timer {
  id: number;
  isRunning: boolean | null;
}

/**
 * Time Entry entity
 */
export interface TimeEntry {
  id: number;
  identityId?: number;
  isLogged: boolean;
  startedAt: string;
  createdAt: string;
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
  duration: number;
  timer?: Timer | null;
}

/**
 * Project billing method enum
 */
export type BillingMethod = 'project_rate' | 'service_rate' | 'flat_rate' | 'team_member_rate';

/**
 * Project type enum
 */
export type ProjectType = 'fixed_price' | 'hourly_rate';

/**
 * Project billed status enum
 */
export type BilledStatus = 'unbilled' | 'partial' | 'billed';

/**
 * Project entity
 */
export interface Project {
  id: number;
  title: string;
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
  createdAt: string;
  updatedAt: string;
  loggedDuration?: number | null;
  billedAmount?: number;
  billedStatus?: BilledStatus;
  retainerId?: string | null;
  expenseMarkup?: number;
  groupId?: string | null;
}

/**
 * Service entity
 */
export interface Service {
  id: number;
  businessId: number;
  name: string;
  billable?: boolean;
  visState?: VisState;
}

/**
 * Service rate configuration
 */
export interface ServiceRate {
  rate: string;
  code: string;
}

/**
 * Task entity
 */
export interface Task {
  id: number;
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
 * Client entity
 */
export interface Client {
  id: number;
  fName?: string | null;
  lName?: string | null;
  organization?: string | null;
  email?: string | null;
  busPhone?: string;
  homePhone?: string | null;
  mobPhone?: string;
  fax?: string;
  note?: string | null;
  pStreet?: string;
  pStreet2?: string;
  pCity?: string;
  pProvince?: string;
  pCode?: string;
  pCountry?: string;
  sStreet?: string;
  sStreet2?: string;
  sCity?: string;
  sProvince?: string;
  sCode?: string;
  sCountry?: string;
  currencyCode?: string;
  language?: string | null;
  vatNumber?: string | null;
  vatName?: string | null;
  visState?: VisState;
  signupDate?: string | null;
  updated?: string | null;
  allowLateFees?: boolean;
  allowLateNotifications?: boolean;
  hasRetainer?: boolean | null;
  retainerId?: string | null;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  pages: number;
  total: number;
  perPage: number;
}

/**
 * Standard FreshBooks API response wrapper
 */
export interface FreshBooksResponse<T> {
  ok: boolean;
  data?: T;
  error?: FreshBooksAPIError;
}

/**
 * FreshBooks API error structure
 */
export interface FreshBooksAPIError {
  code: string;
  message: string;
  field?: string;
  errno?: number;
}

/**
 * Time Entry list response
 */
export interface TimeEntryListData {
  timeEntries: TimeEntry[];
  pages: PaginationMeta;
}

/**
 * Time Entry single response
 */
export interface TimeEntrySingleData {
  timeEntry: TimeEntry;
}

/**
 * Project list response
 */
export interface ProjectListData {
  projects: Project[];
  pages: PaginationMeta;
}

/**
 * Project single response
 */
export interface ProjectSingleData {
  project: Project;
}

/**
 * Service list response
 */
export interface ServiceListData {
  services: Service[];
  pages: PaginationMeta;
}

/**
 * Service single response
 */
export interface ServiceSingleData {
  service: Service;
}

/**
 * Task list response
 */
export interface TaskListData {
  tasks: Task[];
  pages: PaginationMeta;
}

/**
 * Task single response
 */
export interface TaskSingleData {
  task: Task;
}

/**
 * OAuth token response
 */
export interface OAuthTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  created_at: number;
}

/**
 * OAuth error response
 */
export interface OAuthErrorResponse {
  error: string;
  error_description: string;
}

/**
 * Business membership for account selection
 */
export interface BusinessMembership {
  id: number;
  role: string;
  business: {
    id: number;
    name: string;
    account_id: string;
  };
}

/**
 * Account list response
 */
export interface AccountListResponse {
  response: {
    result: {
      business_memberships: BusinessMembership[];
    };
  };
}
