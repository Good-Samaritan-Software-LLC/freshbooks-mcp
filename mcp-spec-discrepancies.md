# FreshBooks MCP ⇄ OpenAPI SSOT — Discrepancy Report

**Spec under comparison:** `openapi.yaml` (OpenAPI 3.1, built SDK-first from `@freshbooks/api` v4.1.0, with `FreshBooks-API.yml` filling paths/verbs/status and the estimates/taxes resources).
**MCP under audit:** `src/tools/**` (78 tools, 22 entities) + `src/client/freshbooks-client.ts`.
**Authority:** SDK wins field-by-field; the partial YAML fills only structural gaps; the MCP is **not** authoritative. **Filter/sort key names** (which the SDK builders leave generic) were subsequently verified against the **official FreshBooks API reference** (`https://www.freshbooks.com/api/parameters`, `/api/invoices`, `/api/expenses`, `/api/payments`, `/api/bills`) — see §2 "Sorting, pagination & filtering" (F1, F3–F8).

Lint result (step 3):

```
$ npx @redocly/cli@latest lint openapi.yaml
openapi.yaml: validated in ~110ms
Woohoo! Your API description is valid. 🎉
You have 82 warnings.
```

0 errors. The 82 warnings are all non-structural style preferences from Redocly's `recommended` config: 81 × `operation-4xx-response` (operations lacking an explicit 4xx — the FreshBooks error envelope is documented via reusable `responses` and `ErrorResponse`, applied on the high-traffic operations) and 1 × `info-license-strict` (license has no URL). None affect validity.

---

## 1. Coverage matrix (resource × operation)

Legend: ✓ present · — absent · *(raw)* MCP uses raw HTTP (no SDK) · *(yaml)* in spec only because the partial YAML covers it (SDK has no model).

| Resource | list | single | create | update | delete | special | in SDK? | in YAML? | in MCP? |
|---|---|---|---|---|---|---|---|---|---|
| invoices | ✓/✓/✓ | ✓/✓/✓ | ✓/✓/✓ | ✓/✓/✓ | ✓(PUT)/—/✓ | share_link (✓/—/✓) | ✓ | ✓ | ✓ |
| clients | ✓/✓/✓ | ✓/✓/✓ | ✓/✓/✓ | ✓/✓/✓ | ✓(PUT)/—/✓ | — | ✓ | ✓ | ✓ |
| expenses | ✓/✓/✓ | ✓/✓/✓ | ✓/✓/✓ | ✓/✓/✓ | ✓(PUT)/—/✓ | — | ✓ | ✓ | ✓ |
| expense_categories | ✓/✓/✓ | ✓/✓/✓ | — | — | — | read-only | ✓ | ✓ | ✓ |
| payments | ✓/✓/✓ | ✓/✓/✓ | ✓/✓/✓ | ✓/✓/✓ | ✓(PUT)/—/✓ | — | ✓ | ✓ | ✓ |
| items | ✓/✓/✓ | ✓/✓/✓ | ✓/✓/✓ | ✓/✓/✓ | —/—/— (no delete) | — | ✓ | — | ✓ |
| credit_notes | ✓/—/✓ | ✓/—/✓ | ✓/—/✓ | ✓/—/✓ | ✓(PUT)/—/✓ | — | ✓ | — | ✓ |
| other_income | ✓/—/✓ | ✓/—/✓ | ✓/—/✓ | ✓/—/✓ | ✓(DELETE)/—/✓ | — | ✓ | — | ✓ |
| journal_entries | —/—/— | —/—/— | ✓/—/✓ | — | — | create-only | ✓ | — | ✓ |
| journal_entry_accounts | ✓/—/✓ | — | — | — | — | read-only | ✓ | — | ✓ |
| journal_entry_details | ✓/—/— | — | — | — | — | list-only | ✓ | — | **—** |
| bills | ✓/—/✓ | ✓/—/✓ | ✓/—/✓ | ✓(PUT)/—/— | ✓(PUT)/—/✓ | archive (✓/—/✓) | ✓ | — | ✓ |
| bill_payments | ✓/—/✓ | ✓/—/✓ | ✓/—/✓ | ✓/—/✓ | ✓(PUT)/—/✓ | — | ✓ | — | ✓ |
| bill_vendors | ✓/—/✓ | ✓/—/✓ | ✓/—/✓ | ✓/—/✓ | ✓(PUT)/—/✓ | — | ✓ | — | ✓ |
| tasks | ✓/—/✓ | ✓/—/✓ | ✓/—/✓ | ✓/—/✓ | ✓(PUT)/—/✓ | — | ✓ | — | ✓ |
| reports | n/a | n/a | n/a | n/a | n/a | payments_collected, profitloss, taxsummary (✓/—/✓) | ✓ | — | ✓ |
| projects | ✓/—/✓ | ✓/—/✓ | ✓/—/✓ | ✓/—/✓ | ✓(DELETE)/—/✓ | — | ✓ | ✓(create only) | ✓ |
| services | ✓/—/✓ | ✓/—/✓ | ✓/—/✓ | — | — | rate get/set (✓/—/✓) | ✓ | — | ✓ |
| time_entries | ✓/✓/✓ | ✓/—/✓ | ✓/✓/✓ | ✓/✓/✓ | ✓(DELETE)/✓/✓ | — | ✓ | ✓ | ✓ |
| timers | *(raw)* | *(raw)* | — | *(raw stop)* | *(raw discard)* | start/stop/current/discard | **—** | **—** | ✓ |
| callbacks | ✓/—/✓ | ✓/—/✓ | ✓/—/✓ | ✓/—/✓ | ✓(DELETE)/—/✓ | verify, resend (✓/—/✓) | ✓ | — | ✓ |
| payment_options | — | ✓/—/✓ | ✓/—/✓ | — | — | default-GET (✓/—/✓) | ✓ | — | ✓ |
| user (identity) | — | ✓/—/✓ | — | — | — | me | ✓ | — | ✓ |
| **estimates** | ✓/✓/— | ✓/✓/— | —/—/— | ✓/✓/— | — | *(yaml)* | — | ✓ | **—** |
| **taxes** | ✓/✓/— | ✓/✓/— | ✓/✓/— | ✓/✓/— | ✓/✓/— | *(yaml)* | — | ✓ | **—** |

Each cell reads **SDK / YAML / MCP**.

**MCP-only (no SDK model):** `timer_start`, `timer_stop`, `timer_current`, `timer_discard` (raw HTTP). Modelled in the spec under `x-unverified: true`.
**YAML-only / SDK-silent, not surfaced by MCP:** `estimates` (list/get/update), `taxes` (full CRUD). Modelled in the spec, flagged `x-source: partial-yaml`.
**SDK-only, not surfaced by MCP:** `journal_entry_details` list.

---

## 2. Discrepancies (one row per issue, sorted by severity)

Severity key — **breaking**: the MCP sends/declares something the FreshBooks API will reject or silently drop, causing wrong or failed results; **behavioral**: works at runtime but diverges from the contract (wrong types, missing values, misleading semantics); **cosmetic**: schema/UX hygiene with no wire impact.

### Breaking

> **B0 is the headline finding — it was invisible to the static audit and only surfaced under live execution.** Every SDK-based tool (i.e. all tools except the raw-HTTP timer ones) failed live authentication; the mocked unit suite (1580 tests) could not catch it because it stubs the SDK `Client` entirely. Fixed on `fix/mcp-spec-alignment` and verified live.

| # | Sev | MCP location (file:symbol) | Spec location (path + pointer) | SDK reference | What the MCP assumes | What's correct | Suggested fix |
|---|-----|---------------------------|-------------------------------|---------------|----------------------|----------------|---------------|
| B0 | breaking | `src/client/freshbooks-client.ts:63` → `getClient()` `new Client(accessToken, { apiUrl })` | n/a (auth/transport) | SDK `APIClient` ctor `(clientId, { accessToken, ... })` (`APIClient.d.ts`) | The bearer token is the SDK's first positional argument. | The first arg is **clientId**; the token must be `options.accessToken`. As written, the token is sent as `clientId` and **no bearer token is set**, so every SDK-based tool gets **401** live (raw-HTTP timer tools were unaffected). LIVE-VERIFIED both ways. | `new Client(oauth.getClientId(), { accessToken, apiUrl })`. **FIXED on this branch.** |
| B1 | breaking | `src/tools/invoice/schemas.ts:73` → `InvoiceStatusEnum` (`'auto_paid'`) | `#/components/schemas/InvoiceStatus` | `models/Invoices.d.ts` `InvoiceStatus.autoPaid = "auto-paid"` | Invoice status value is `auto_paid` (underscore). | The wire/enum value is `auto-paid` (hyphen). | Rename the enum member value to `auto-paid`. |
| B2 | breaking | `src/tools/invoice/schemas.ts:76` → `InvoiceStatusEnum` (`'overdue'`) | `#/components/schemas/InvoiceStatus` | `models/Invoices.d.ts` `InvoiceStatus` (no `overdue`) | `overdue` is a valid invoice `status`. | `overdue` is not a member of `InvoiceStatus` (it exists only in `InvoiceV3Status`). Filtering by `status=overdue` matches nothing. | Remove `overdue` from the status enum; if "overdue" filtering is needed, target `v3_status`. |
| B3 | breaking | `src/tools/invoice/schemas.ts:87` → `PaymentStatusEnum` (`'auto_paid'`) | `#/components/schemas/PaymentStatus` | `models/Invoices.d.ts` `PaymentStatus.autoPaid = "auto-paid"` | Payment status value is `auto_paid` (underscore). | The value is `auto-paid` (hyphen). | Rename to `auto-paid`. |
| B4 | breaking | `src/tools/payment/schemas.ts:23` → `PaymentTypeEnum` (`'Stripe'`) | `#/components/schemas/PaymentType` | `models/Payment.d.ts` `PaymentType` | `Stripe` is an accepted payment type. | `Stripe` is not a member of `PaymentType`; the API rejects it. | Remove `Stripe`. |
| B5 | breaking | `src/tools/payment/schemas.ts:25` → `PaymentTypeEnum` (`'Wire Transfer'`) | `#/components/schemas/PaymentType` | `models/Payment.d.ts` `PaymentType` | `Wire Transfer` is an accepted payment type. | `Wire Transfer` is not a member of `PaymentType`. | Remove `Wire Transfer` (use `Bank Transfer`). |
| B6 | breaking | `src/tools/payment-options/schemas.ts:26,49,73` → `hasAch` | `#/components/schemas/PaymentOptions/properties/has_ach_transfer` | `models/PaymentOptions.js` `transformPaymentOptionsRequest` → `has_ach_transfer: options.hasAchTransfer` | The ACH toggle field is `hasAch`. | The SDK field is `hasAchTransfer` (wire `has_ach_transfer`). `hasAch` is dropped by the transform, so enabling ACH never takes effect. | Rename `hasAch` → `hasAchTransfer` everywhere in payment-options schemas/handlers. |
| B7 | breaking | `src/tools/item/schemas.ts:23,44-47` → `rate` (Money) | `#/components/schemas/ItemWrite/properties/unit_cost` | `models/Item.js` `transformItemRequest` → `unit_cost: item.unitCost`; **`/api/items` confirms field is `unit_cost`** | The unit price field is `rate`. | The SDK transform reads `unitCost` (wire `unit_cost`, doc-confirmed); a field named `rate` is silently dropped, so `item_create`/`item_update` never set a price. | Rename the item price field `rate` → `unitCost`. |
| B8 | breaking | `src/tools/item/schemas.ts:24,48` → `quantity` (number) | `#/components/schemas/ItemWrite/properties/qty` | `models/Item.js` `qty: item.qty`; `Item.d.ts` `qty: string`; **`/api/items` confirms `qty` (decimal-string)** | Quantity field is `quantity` as a number. | The SDK/API field is `qty`, a **string**; `quantity` is dropped. | Rename `quantity` → `qty` and type it as a string. |
| B9 | breaking | `src/tools/item/schemas.ts:26-27,50-51` → `tax1`/`tax2` (string names) | `#/components/schemas/ItemWrite/properties/tax1`,`tax2` | `Item.d.ts` `tax1: number; tax2: number`; **`/api/items` confirms `tax1`/`tax2` are integer tax IDs** | `tax1`/`tax2` are string tax **names**. | They are **integer tax IDs** in the SDK/API. Passing name strings sends the wrong type. | Type `tax1`/`tax2` as numbers (numeric tax ids). |
| B10 | breaking | `src/tools/project/schemas.ts:65-70` → `BillingMethodEnum` (`'flat_rate'`) | `#/components/schemas/BillingMethod` | `models/Project.d.ts` `BillingMethod` | `flat_rate` is a valid billing method (and `business_rate` is absent). | Valid members are `business_rate, project_rate, service_rate, team_member_rate`. `flat_rate` is invalid; `business_rate` is missing. | Replace `flat_rate` with `business_rate`. |
| B11 | breaking | `src/tools/bill-payment/schemas.ts:13` → `PaymentTypeEnum` (`'check'`,`'bank_transfer'`,…) | `#/components/schemas/PaymentType` (referenced by `BillPaymentWrite/payment_type`) | `models/BillPayments.d.ts` `PaymentType` (values `"Check"`,`"Bank Transfer"`,…) | Bill-payment `paymentType` values are lowercase/snake (`check`, `bank_transfer`). | The wire values are capitalized exactly like `Payment.PaymentType` (`Check`, `Bank Transfer`, …). Lowercase values are rejected. | Use the capitalized `PaymentType` values for bill-payment too. |

### Behavioral

| # | Sev | MCP location (file:symbol) | Spec location (path + pointer) | SDK reference | What the MCP assumes | What's correct | Suggested fix |
|---|-----|---------------------------|-------------------------------|---------------|----------------------|----------------|---------------|
| H1 | behavioral | `src/tools/payment/schemas.ts:32,33,39` → `id`/`invoiceId`/`clientId` `z.number()` | `#/components/schemas/Payment` (`id`,`invoiceid`,`clientid` are `string`) | `models/Payment.d.ts` `id?: string; invoiceId: string; clientId?: string` | Payment ids are numbers. | They are **strings** in the SDK/wire. Requests survive via `String(...)` coercion, but the output schema rejects string ids returned by the API. | Type `id`/`invoiceId`/`clientId` as `z.string()` in the Payment schema. |
| H2 | behavioral | `src/tools/payment/schemas.ts:13-26` → `PaymentTypeEnum` (missing card brands) | `#/components/schemas/PaymentType` | `models/Payment.d.ts` `PaymentType` | The 9 listed types are the full set. | `VISA, MASTERCARD, DISCOVER, AMEX, DINERS, JCB` are also valid and cannot be selected. | Add the six card-brand values to the enum. |
| H3 | behavioral | `src/tools/other-income/schemas.ts:62,84,110` → `categoryName: z.string()` | `#/components/schemas/OtherIncomeCategory` | `models/OtherIncome.d.ts` `CategoryName` enum | `categoryName` is a free string. | It is a fixed enum: `advertising, in_person_sales, online_sales, rentals, other`. Free text lets the API reject invalid values at runtime. | Constrain `categoryName` to the `CategoryName` enum. |
| H4 | behavioral | `src/tools/other-income/schemas.ts:36,79,121` → `incomeId: z.number()` | `#/components/schemas/OtherIncome/properties/incomeid` (`string`) | `models/OtherIncome.js` `incomeId: income.incomeid` (string) | `incomeId` is a number. | It is a **string**; the output schema rejects the string id the API returns. | Type `incomeId` as `z.string()`. |
| H5 | behavioral | `src/tools/credit-note/schemas.ts:79,151` → `clientId: z.number()` | `#/components/schemas/CreditNote/properties/clientid` (`string`) | `models/CreditNote.js` `clientId: creditNote.clientid` (string) | Credit-note `clientId` is a number. | It is a **string** in the SDK model. | Type `clientId` as `z.string()` (output schema already tolerates a union). |
| H6 | behavioral | `src/tools/bill/schemas.ts:46` + `bill-create.ts:73` → required `amount` passed through | `#/components/schemas/BillWrite` (no `amount`) | `models/Bills.js` `transformBillsRequest` (omits `amount`/`status`) | The bill request body includes `amount`. | The SDK does **not** send `amount` on bill create (it is computed from `lines`); the field is required by the MCP but ignored on the wire, so a stated bill amount is silently discarded. | Drop `amount` from the bill create input; derive totals from `lines`. |
| H7 | behavioral | `src/tools/service/service-create.ts:81-86` → sends `{ name, billable }` | `#/components/schemas/ServiceWrite` (only `name`) | `models/Service.js` `transformServiceRequest` → `{ service: { name } }` | `billable` can be set on service creation. | The SDK transmits **only** `name`; `billable` is dropped. The `default(true)` is misleading. | Remove `billable` from `service_create` input (or document it as not transmitted). |
| H8 | behavioral | `src/tools/service/service-rate-set.ts:16-21,91-95` → sends `{ rate, code }` | `#/components/schemas/ServiceRateWrite` (only `rate`) | `models/ServiceRate.js` `transformServiceRateRequest` → `{ service_rate: { rate } }` | A currency `code` (default `USD`) accompanies the rate. | The SDK sends **only** `rate`; `code` is dropped. | Remove the `code` field from `service_rate_set` input. |
| H9 | behavioral | `src/tools/item/schemas.ts` → `taxable`, `type` | `#/components/schemas/ItemWrite` (no such fields) | `Item.d.ts` / `Item.js` `transformItemRequest` | `taxable` and `type` are part of the item write contract. | Neither is read by the SDK transform (which sends `name, description, qty, sku, inventory, unit_cost, tax1, tax2, vis_state`); both are silently dropped. | Remove `taxable` and `type`, or document them as non-transmitted. |

### Cosmetic

| # | Sev | MCP location (file:symbol) | Spec location (path + pointer) | SDK reference | What the MCP assumes | What's correct | Suggested fix |
|---|-----|---------------------------|-------------------------------|---------------|----------------------|----------------|---------------|
| C1 | cosmetic | `src/tools/service/service-list.ts:15-25` → `page`/`perPage` | `GET /comments/business/{businessId}/services` (no pagination params) | `APIClient.js` `services.list(businessId)` (no query builders) | Services list is paginated by `page`/`perPage`. | `services.list` accepts no query builders; the params are silently ignored. | Remove `page`/`perPage` from `service_list` input. |
| C2 | cosmetic | `src/tools/project/project-single.ts:53` (+ schema `:181`) → `includes` | `GET /projects/business/{businessId}/project/{projectId}` (no include param) | `APIClient.js` `projects.single(businessId, projectId)` | `includes` is forwarded to the single-project fetch. | `execute` never destructures/forwards `includes`; it is a dead parameter. | Drop `includes` from `project_single`, or pass it through. |
| C3 | cosmetic | `*-delete.ts` / `timer-discard.ts` → `confirmed`, `confirmationId` | n/a (MCP UX fields, not wire) | n/a | A confirmation gate is enforced before destructive ops. | `confirmed`/`confirmationId` are declared in `timeentry_delete`, `project_delete`, `task_delete`, `timer_discard` (and peers) but never read in `execute` — no gating happens. | Either implement the confirmation gate or remove the unused fields. |
| C4 | cosmetic | `src/tools/invoice/invoice-create.ts:87` → `createDate` optional (defaulted to today) | `#/components/schemas/InvoiceWrite` (`create_date` required) | `models/Invoices.d.ts` `createDate: Date` (required) | `createDate` is optional on create. | The SDK marks `create_date` required; the MCP masks this by defaulting to today, which can silently set the wrong invoice date. | Make `createDate` required in `invoice_create` input. |
| C5 | cosmetic | `src/tools/time-entry/schemas.ts:102-120` → `isLogged`/`startedAt` not required | `#/components/schemas/TimeEntryWrite` (`is_logged`,`started_at` required) | `models/TimeEntry.d.ts` `isLogged: boolean; startedAt: Date` (required) | Only `duration` is strictly required on create. | `is_logged` and `started_at` are also required; the MCP relies on Zod defaults (`isLogged=true`, `startedAt=now`), which can record the wrong start time. | Mark `isLogged`/`startedAt` required (or keep defaults but document the risk). |
| C6 | cosmetic | `src/tools/timer/timer-start.ts:118` → `billable: billable ?? false` | n/a | n/a | Default `billable` is consistent. | The Zod schema defaults `billable=true` but the payload line falls back to `false` if the default is bypassed — contradictory defaults. | Align the fallback to `true` (or rely solely on the schema default). |
| C7 | cosmetic | declared-number-should-be-string ids: `callbackId`, `creditNoteId`, `itemId` (and similar) | respective `*/{id}` path params (typed `string` in spec) | SDK transforms emit string ids; handlers call `String(id)` | These path ids are numbers. | The API ids are strings; handlers already coerce via `String(...)`, so this is a type-declaration mismatch only (no wire impact for path ids). | Type these id inputs as `z.string()` for contract accuracy. |
| C8 | cosmetic | `src/tools/bill/bill-archive.ts:69-70` (+ comment) | `PUT /accounting/account/{accountId}/bills/bills/{billId}` (single path serves archive+delete) | `APIClient.js` `bills.archive` = PUT to bills path (differs from delete only by `vis_state`) | Archive is a distinct operation; the code comment claims a manual `vis_state` PUT. | `bills.archive` exists in the SDK and PUTs to the same path as delete — the call is correct, but the comment misdescribes the implementation, and archive is not a separate endpoint. | Fix the comment; no functional change needed. |

### Sorting, pagination & filtering

Pagination, sort, and filter conventions are encoded in the spec as reusable parameters
(`Page`, `PerPage`, `Include`, `AccountingSort`/`AccountingSearch`, `ProjectSort`/`ProjectSearch`).
**Authority caveat:** the SDK query builders (`SearchQueryBuilder`, `SortQueryBuilder`) accept
**arbitrary** keys, so filter/sort *key names* are **not** SDK-established. Only the time-entry
filter keys are corroborated by the partial YAML. Every other sort/filter key in the spec is
derived from the MCP handlers' actual `search.*` / `sort.*` calls and is marked `x-unverified`
in `openapi.yaml` — it documents what the MCP sends, not a verified contract.

| Concern | Status |
|---|---|
| **Pagination** | ✓ Correct everywhere. MCP `page`/`perPage` Zod inputs → `PaginationQueryBuilder` → wire `page`/`per_page` (verified `PaginationQueryBuilder.js`). Defaults `page=1`, `per_page=30`, max 100. No discrepancies. |
| **Sort format** | ✓ Correct. Accounting family emits `sort=<key>_asc`/`_desc`; ProjectResource family emits `sort=-<key>` (asc) / `sort=<key>` (desc) — both verified against `SortQueryBuilder.js`. The MCP routes each resource through the correct family. |
| **Sort keys** | Partly verified. Authoritative **client** sort keys confirmed via `/api/clients` (see coverage table). **invoice `create_date` is a likely delta — F13** (doc sort example is `invoice_date`). `items`/`bill_vendors`/`credit_notes`/`other_income`/`tasks`/`journal_entry_accounts` sort keys remain `x-unverified`. |
| **Filter encoding** | ✓ Correct. Accounting family wraps as `search[key]`, `search[key_min/_max]`, `search[key][]`; ProjectResource family emits bare `key=value` for equals/in. The MCP uses the right encoding per family. |
| **Filter keys** | Verified against the FreshBooks docs for 8 resources. **9 confirmed deltas — F1, F3–F8, F10, F11** (invoices, expenses, bills, other_income) plus **2 to verify — F9, F12** (clients, time_entries); all cause silent unfiltered results. Confirmed *correct*: expense/payment date+id keys, invoice `customerid`/`updated`, time-entry `client_id`/`billable`/`billed`/`started_from`/`started_to`, other-income `category_name`, client `email`/`vis_state`. Still `x-unverified` (doc 404/no params): `credit_notes`, `projects`, `bill_vendors`, `bill_payments`. See the F-rows and coverage table below. |
| **Include** | ✓ `include[]` repeated param. MCP passes e.g. invoices `lines,presentation`; time_entries `client,project,task,service`; projects `client,services,group`. NOTE: `project_single` accepts an `includes` arg but never forwards it (see C2). |

| # | Sev | MCP location (file:symbol) | Spec location (path + pointer) | SDK reference | What the MCP assumes | What's correct | Suggested fix |
|---|-----|---------------------------|-------------------------------|---------------|----------------------|----------------|---------------|
| F1 | behavioral | `src/tools/bill/bill-list.ts:95` → `search.equals("vendor_id", vendorId)` | `#/components/parameters/AccountingSearch` (bills filter keys) | **FreshBooks `/api/bills`**: vendor filter is `vendorid` (Equals) | The bill vendor filter key is `vendor_id` (underscore). | **CONFIRMED via docs:** the documented key is `vendorid` (no underscore). `vendor_id` is not a recognized bill filter, so vendor filtering silently returns **unfiltered** results. | Change to `search.equals('vendorid', vendorId)`. |
| F2 | cosmetic | `src/tools/time-entry/timeentry-list.ts` → `TimeEntryDateFilterBuilder` (top-level `started_from`/`started_to`) | `#/components/parameters/ProjectSearch` | partial YAML time-entry list params | Date filtering needs a custom builder emitting top-level query params. | This is **correct** — `started_from`/`started_to` are the documented time-entry params (the only filter keys corroborated by the partial YAML). Recorded for completeness; no fix needed beyond confirming the MCP input names `startedAfter`/`startedBefore` are intentional aliases. | None (verify alias naming only). |
| F3 | behavioral | `src/tools/invoice/invoice-list.ts:110` → `search.between('create_date', {min,max})` | `#/components/parameters/AccountingSearch` (invoices date filter) | **LIVE-VERIFIED**: `search[date_min]` → narrows to 0; `search[create_date_min]` → IGNORED (stayed at baseline) | The `dateMin`/`dateMax` inputs filter on `create_date` (→ `search[create_date_min/_max]`). | **CONFIRMED LIVE + docs:** the recognized invoice date-range key is `date`; `create_date_*` is silently ignored, so `dateMin`/`dateMax` return **unfiltered** results. (`expense-list`/`payment-list` correctly use `between('date', …)` — invoice is the lone outlier.) | Change to `search.between('date', { min, max })`. (The adjacent `between('updated', …)` on line 115 IS correct.) |
| F4 | behavioral | `src/tools/invoice/invoice-list.ts:102` → `search.equals('status', input.status)` | `#/components/parameters/AccountingSearch` (invoices status filter) | **LIVE-VERIFIED** (seed→filter→cleanup): `search[status]` → IGNORED; `search[v3_status]=<valid>` → narrows; `search[statusid]` → IGNORED | Invoices can be filtered by `search[status]` with a string status value. | **CONFIRMED LIVE:** `status` is a silent no-op. The working key is **`v3_status`** (string). `statusid` is **NOT** honored (contrary to the docs) — so the earlier "use statusid" suggestion is wrong. | Filter via `search.equals('v3_status', input.status)` and align the input enum to `InvoiceV3Status` values. |
| F5 | behavioral | `src/tools/invoice/invoice-list.ts:105` → `search.equals('payment_status', input.paymentStatus)` | `#/components/parameters/AccountingSearch` (invoices payment filter) | **LIVE-VERIFIED**: `search[payment_status]` → IGNORED. Docs: payment filtering uses booleans `paid`/`outstanding` | Invoices can be filtered by `search[payment_status]`. | **CONFIRMED LIVE + docs:** `payment_status` is a silent no-op; documented payment-state filters are the booleans `paid` and `outstanding`. | Replace with `search.boolean('paid', …)` / `search.boolean('outstanding', …)` (map the `paymentStatus` input), or drop the filter. |
| F6 | behavioral | `src/tools/expense/expense-list.ts:118` → `search.equals('status', input.status)` | `#/components/parameters/AccountingSearch` (expenses) | **FreshBooks `/api/expenses`**: no status search filter exists (expense status is not directly modifiable/searchable) | Expenses can be filtered by `search[status]`. | **CONFIRMED via docs:** the expenses endpoint has **no** status filter. The filter is silently ignored. (The other expense filters — `clientid`, `projectid`, `categoryid`, `between('date', …)` — all match the docs and are correct.) | Remove the `status` filter from `expense_list` (or filter client-side after fetch). |
| F7 | behavioral | `src/tools/bill/bill-list.ts:98` → `search.equals("status", filters.status)` | `#/components/parameters/AccountingSearch` (bills status) | **FreshBooks `/api/bills`**: status filter is `statuses` (In-list), not `status` (Equals) | Bills can be filtered by `search[status]` (single Equals). | **CONFIRMED via docs:** the documented key is `statuses` with In-list semantics (`search[statuses][]=…`). `search[status]` is not recognized → silently ignored. | Change to `search.in('statuses', [filters.status])`. |
| F8 | behavioral | `src/tools/bill/bill-list.ts:103` → `search.between("issue_date", {min,max})` | `#/components/parameters/AccountingSearch` (bills date) | **FreshBooks `/api/bills`**: no date-range search filter is documented | `bill_list` supports a `startDate`/`endDate` range via `issue_date`. | **CONFIRMED via docs:** the bills endpoint exposes **no** date-range filter (`issue_date` is a body field, not a search key). The `startDate`/`endDate` inputs are silently ignored. | Remove the date-range inputs from `bill_list` (or filter client-side); document that bills cannot be date-filtered server-side. |
| F9 | behavioral | `src/tools/client/client-list.ts:109,112,115` → `like('organization'/'fname'/'lname', …)` | `#/components/parameters/AccountingSearch` (clients) | **LIVE-VERIFIED**: `search[fname]`/`search[organization]` → IGNORED; `search[fname_like]`/`search[organization_like]` → narrow to 0 | MCP filters with base keys `organization`/`fname`/`lname` via the SDK's `%`-wildcard `like()` (→ `search[organization]=val%`). | **CONFIRMED LIVE:** the base keys are silent no-ops; only the `*_like` keys work. The SDK's `value%` form is **not** honored. (`equals('email')` → `email` ✓ is correct.) | Use the `*_like` keys (e.g. emit `search[organization_like]=<value>`); the SDK `like()` builder's base-key output does not filter. |
| F10 | behavioral | `src/tools/other-income/otherincome-list.ts` → `equals('source', …)` | `#/components/parameters/AccountingSearch` (other_income) | **FreshBooks `/api/other_income`**: documented filters are `incomeid`, `category_name`, `vis_state` only | `other_income` can be filtered by `search[source]`. | **CONFIRMED via docs:** `source` is not a documented filter → silently ignored. (`equals('category_name')` IS documented and correct.) | Remove the `source` filter (or filter client-side). |
| F11 | behavioral | `src/tools/other-income/otherincome-list.ts` → `between('date', …)` | `#/components/parameters/AccountingSearch` (other_income) | **FreshBooks `/api/other_income`**: no date-range filter documented | `dateFrom`/`dateTo` filter via `search[date_min]/[date_max]`. | **CONFIRMED via docs:** no date filter is documented for other_income → the date inputs are silently ignored. | Remove the date-range inputs (or filter client-side); verify. |
| F12 | behavioral | `src/tools/time-entry/timeentry-list.ts` → `equals('project_id'/'task_id'/'service_id')`, `boolean('active')` | `#/components/parameters/ProjectSearch` (time_entries) | **FreshBooks `/api/time_entries`** documented filters: `billable, billed, client_id, started_from, started_to, updated_since, identity_id, team, include_deleted, include_unlogged` | Time entries can be filtered by `project_id`, `task_id`, `service_id`, and `active`. | These four keys are NOT in the documented time-entry filter set → likely no-ops. The MCP's `client_id`, `billable`, `billed`, `started_from`, `started_to` ARE documented and correct. **MEDIUM confidence** (time-tracking filters may be under-documented). | Verify `project_id`/`task_id`/`service_id`/`active`; for in-progress entries the documented param is `include_unlogged`. |
| F13 | behavioral | `src/tools/invoice/invoice-list.ts` sort (`sortBy`: `create_date`,…) | `#/components/parameters/AccountingSort` (invoices) | **FreshBooks `/api/parameters`** sort example `sort=invoice_date_asc` | Invoices sort by `create_date`/`due_date`/`updated`/`amount`/`outstanding`. | The only documented invoice sort example uses `invoice_date`; the full set of valid sort keys is not enumerated in the docs, so `create_date` as a sort key may not be recognized (parallel to the F3 filter bug). **LOW–MEDIUM confidence.** | Verify invoice sort keys against the API; `invoice_date` may be required instead of `create_date`. |
| F15 | behavioral | `src/tools/credit-note/creditnote-list.ts:84` → `search.between('create_date', …)` (date filter) | `#/components/parameters/AccountingSearch` (credit_notes) | **LIVE-VERIFIED**: `search[date_min]` → narrows to 0; `search[create_date_min]` → IGNORED | `dateFrom`/`dateTo` filter credit notes on `create_date`. | **CONFIRMED LIVE:** identical to the invoice F3 bug — `create_date` is a silent no-op; the working key is `date`. (`equals('clientid', …)` IS correct — live-verified: `clientid` narrows, `client_id` is ignored.) | Change the credit-note date filter to `search.between('date', { min, max })`. |
| F16 | behavioral | `src/tools/bill-vendor/billvendor-list.ts:103` → `like('vendor_name', …)`, `equals('email', …)` | `#/components/parameters/AccountingSearch` (bill_vendors) | **LIVE-VERIFIED**: `search[vendor_name]`, `search[vendor_name_like]`, and `search[email]` all → IGNORED | Bill vendors can be filtered by name/email. | **CONFIRMED LIVE:** all three candidate keys are silent no-ops, matching the doc page that lists no filter params — `bill_vendor` server-side filtering does not work via these keys. (Tested 3 candidates; a different supported key cannot be ruled out, but none are documented.) | Remove the `vendorName`/`email` filters from `billvendor_list` (or filter client-side); document that vendors aren't server-filterable. |

**Doc-sweep coverage (which resources were checked against the FreshBooks API reference):**

| Resource | doc page | filter keys verified? | result |
|---|---|---|---|
| invoices | `/api/invoices`, `/api/parameters` | ✓ | F3, F4, F5 (date/status/payment_status wrong); `customerid`, `updated` correct |
| expenses | `/api/expenses` | ✓ | F6 (no status filter); `clientid`/`projectid`/`categoryid`/`date` correct |
| payments | `/api/payments` | ✓ | all correct (`invoiceid`/`clientid`/`date`) |
| bills | `/api/bills` | ✓ | F1, F7, F8 (vendor/status/date wrong) |
| clients | `/api/clients` | ✓ | F9 (`*_like` keys); `email`/`vis_state` correct; sort keys listed below |
| other_income | `/api/other_income` | ✓ | F10, F11 (`source`/date undocumented); `category_name` correct |
| time_entries | `/api/time_entries` | ✓ | F12 (`project_id`/`task_id`/`service_id`/`active` undocumented); `client_id`/`billable`/`billed`/`started_from`/`started_to` correct |
| items | `/api/items` | ✓ | confirms B7/B8/B9 field names (`unit_cost`/`qty`/`tax1`/`tax2`) |
| credit_notes | doc 404 → **live probe** | ✓ (live) | `clientid` correct; **`create_date` date filter is a no-op → F15** (use `date`) |
| projects | doc 404 → **live probe** | ✓ (live) | `client_id` bare param works — **MCP correct**, no bug |
| bill_vendors | doc none → **live probe** | ✓ (live) | `vendor_name`/`vendor_name_like`/`email` all no-op → **F16** |
| bill_payments | `/api/bill_payments` | ✗ | live seed blocked (bill needs a valid `categoryid`); `billid` (MCP) remains SDK-inferred, not live-verified |
| bills | `/api/bills` + live | doc ✓ / live ✗ | F1/F7/F8 doc-confirmed; live seed blocked by required `categoryid` on bill lines |

**Live verification** used `scripts/seed-probe-cleanup.mjs`: it creates labeled `PROBE_*` fixtures, queries each list with an impossible filter value (recognized key → total drops to 0; ignored key → total unchanged), then soft-deletes/deletes the fixtures. `scripts/mint-token.mjs` mints the OAuth token into the gitignored `tests/integration/.env.local`.

**Authoritative client sort keys** (`/api/clients`): `client_id, organization_name, email, bus_phone, updated, fullname, primarycontact, outstanding, overdue, credit`. The MCP's client `sortBy` values should be checked against this set.

> **Methodology note (the FreshBooks docs were the missing authority tier):** F1 and F3–F13 are filter/sort **key-name** defects, invisible to the original SDK→YAML→MCP audit because neither authoritative source establishes search keys (the SDK's `SearchQueryBuilder` accepts *any* key; the partial YAML documents only time-entry filters). Cross-checking the **official FreshBooks API reference** turned 12 quarantined keys into confirmed/high-probability bugs across 5 tools — only F3 had been hinted at (via the user). **Standing recommendation:** treat the FreshBooks API docs (or, better, an integration test that exercises each filter and asserts the result set actually narrows) as a permanent authority tier for every `search.*`/`sort.*` key. **Still `x-unverified`** (doc pages 404'd or omitted filter params): `credit_notes`, `projects`, `bill_vendors`, `bill_payments` filter keys, and most resources' sort keys.

### Coverage gaps (recorded both directions)

| # | Sev | Location | Detail |
|---|-----|----------|--------|
| G1 | gap | spec `paths` estimates (`/estimates/estimates...`) vs MCP | Spec exposes `estimates` list/get/update (from the partial YAML); the MCP surfaces **no** estimate tools. Add estimate tools if estimate workflows are needed. |
| G2 | gap | spec `paths` taxes (`/taxes/taxes...`) vs MCP | Spec exposes `taxes` CRUD (from the partial YAML); the MCP surfaces **no** tax tools. |
| G3 | gap | SDK `journalEntryDetails.list` vs MCP | The SDK and spec model `journal_entry_details` list; the MCP only exposes `journalentryaccount_list`. |
| G4 | gap | MCP `timer_*` vs SDK/YAML | The four timer tools have **no** SDK model or YAML coverage; modelled in the spec as `x-unverified` from the MCP's raw-HTTP calls. Verify the timer payloads against the live FreshBooks API and promote them out of `x-unverified`. |

---

## 3. Summary

**Counts by severity:** 12 breaking (incl. **B0**, the critical auth bug found via live execution) · 18 behavioral (filter/sort bugs F1, F3–F16) · 9 cosmetic (incl. F2) · 4 coverage gaps. Pagination and sort/filter *encodings* are verified correct. Filter/sort **key-name** defects were checked against the **FreshBooks API docs** and then **live-verified** against a real account (`scripts/seed-probe-cleanup.mjs`: seed labeled fixtures → query with an impossible filter value → recognized key narrows to 0 / ignored key stays at baseline → clean up).

**Live-verified silent-filter bugs** (the filter runs, the API ignores the key, results come back unfiltered):
- F3 invoice date `create_date` → must be `date`.
- F4 invoice `status` → must be `v3_status` (**`statusid` does NOT work either** — corrects the earlier doc-based guess).
- F5 invoice `payment_status` → must be booleans `paid`/`outstanding`.
- F9 client `fname`/`organization` (SDK `like()` base keys) → must be `fname_like`/`organization_like`.
- F15 credit-note date `create_date` → must be `date` (same shape as F3).
- F16 bill-vendor `vendor_name`/`email` filters are no-ops (no server-side vendor filtering).

**Doc-confirmed, live pending** (bill seeding blocked by a required `categoryid`): F1 bill `vendor_id`→`vendorid`, F6 expense `status` no-op, F7 bill `status`→`statuses`, F8 bill date filter absent.

**Live-verified CORRECT** (no change needed): invoice `customerid`, credit-note `clientid`, project `client_id`, client `email`, expense/payment `date`+id keys.

**F13 (invoice sort) — RESOLVED via live probe:** the only invoice sort key the API honors is **`invoice_date`** (`create_date`/`date`/`updated` are all ignored). Fixed by mapping the public `create_date` sort to `invoice_date`. **Still inferred / `x-unverified`:** `bill_payments` `billid` (seed blocked).

**Top 3 breaking discrepancies:**

1. **B0 — SDK client constructed without a bearer token** (`src/client/freshbooks-client.ts`). `new Client(accessToken, {apiUrl})` passes the token as `clientId` and never sets `options.accessToken`, so **every SDK-based tool fails live auth (401)**. The mocked unit suite couldn't catch it; the handler-level live test did. **Fixed + verified live.**
2. **B7/B8 — `item` write fields `rate`/`quantity` vs SDK `unit_cost`/`qty`** (`src/tools/item/schemas.ts`). `item_create`/`item_update` send price and quantity under names the SDK transform ignores, so items are created with **no price and no quantity** — silent data loss.
3. **B6 — `payment-options` `hasAch` vs SDK `hasAchTransfer`**. The ACH toggle is dropped by the SDK transform, so enabling ACH on an invoice silently never takes effect.
3. **B1/B3 — invoice `auto_paid` vs `auto-paid`** (`src/tools/invoice/schemas.ts`). The underscore spelling never matches the API's hyphenated `auto-paid`, breaking status/payment-status filtering and any validation against returned invoices.

**Notable non-findings (verified correct against the SDK, despite looking suspicious):** tasks are correctly `account_id`-scoped (not `business_id`); `otherIncomes.update(accountId, id, data)` matches the SDK signature (per-resource arg order legitimately varies in the SDK and the MCP matches each); `bills.archive` is a real SDK method; money is consistently modelled as `{amount, code}` objects across every entity (no money-as-number defects); expense create correctly requires numeric `categoryId` + `staffId`; `item` correctly has no delete; credit-note single correctly works around the SDK's plural-`credit_notes` unwrap bug; `payment_options` `default` is correctly treated as a read.
