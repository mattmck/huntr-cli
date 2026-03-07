# Entity Types Reference

This document shows the complete structure of each entity type returned by huntr-cli.

## Quick Reference

### Board Entity

```typescript
{
  id: "<boardId>",
  _id: "<boardId>",
  name: "Job Search 2025",
  isArchived: false,
  createdAt: "2025-09-09T03:25:39.770Z",
  updatedAt: "2026-01-22T18:23:46.492Z",
  _lists: [
    "<listId1>",
    "<listId2>"
  ]  // bare list IDs — use GET /board/:boardId/lists to resolve names
}
```

### Job Entity

```typescript
{
  _id: "<jobId>",
  id: "<jobId>",
  title: "Software Architect",
  url: "https://...",
  rootDomain: "icims.com",
  htmlDescription: "<p>...</p>",
  _company: "<companyId>",
  _list: "<listId>",
  _board: "<boardId>",
  _activities: ["<activityId>"],
  _interviewActivities: [],
  _contacts: [],
  _todos: [],
  _notes: [],
  salary: "$161,000.00 - $255,000.00",  // raw string, not a structured object
  location: {
    address: "Germantown, MD, USA",
    name: "Germantown",
    placeId: "ChIJ...",
    url: "https://maps.google.com/?cid=...",
    lat: "39.1731621",
    lng: "-77.2716502"
  },
  createdAt: "2026-01-04T18:49:28.657Z",
  updatedAt: "2026-01-08T21:38:00.838Z",
  lastMovedAt: "2026-01-04T18:49:34.000Z"
}
```

### Activity (Action) Entity

```typescript
{
  _id: "507f1f77bcf86cd799439011",
  id: "action_001",
  actionType: "JOB_MOVED",
  date: "2024-02-20T15:00:00Z",
  createdAt: "2024-02-20T15:00:00Z",
  updatedAt: "2024-02-20T15:05:00Z",
  data: {
    _job: "job_001",
    _company: "company_1",
    _board: "board_1",
    _fromList: "list_1",
    _toList: "list_2",
    job: {
      _id: "507f...",
      id: "job_001",
      title: "Senior Engineer at TechCorp"
    },
    company: {
      _id: "507f...",
      id: "company_1",
      name: "TechCorp",
      color: "#FF0000"
    },
    fromList: {
      _id: "507f...",
      id: "list_1",
      name: "Active Leads"
    },
    toList: {
      _id: "507f...",
      id: "list_2",
      name: "Interviewing"
    },
    note: null,
    activity: null,
    activityCategory: null,
    contact: null
  }
}
```

### User Profile Entity

```typescript
{
  id: "user_profile_id_1",
  _id: "user_profile_id_1",
  email: "user@example.com",
  givenName: "Example",
  familyName: "User",
  fullName: "Example User",
  auth0IdForMixpanel: "auth0|example-user-id"
}
```

---

## Detailed Field Descriptions

### Board

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique board identifier (MongoDB ObjectId as string) |
| `_id` | string | Same as `id` |
| `name` | string | Board name (e.g., "Job Search 2025") |
| `createdAt` | ISO 8601 | Creation timestamp |
| `updatedAt` | ISO 8601 | Last update timestamp |
| `_lists` | string[] | Array of bare list IDs — resolve via `GET /board/:id/lists` |
| `isArchived` | boolean | Whether board is archived |

> Note: The current TypeScript definitions in `src/types/personal.ts` still model the legacy
> `lists: BoardList[]` / `order` shape and have not yet been updated to this `_lists`-based
> API. See the `Board.lists` and `BoardList.order` definitions in `src/types/personal.ts` and
> the associated tracking issue for progress on aligning the generated types with this documented response.

### BoardList

Returned by `GET /board/:id/lists` as an object map keyed by list ID.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique list identifier |
| `_id` | string | Same as `id` |
| `name` | string | List name (e.g., `wishlist`, `applied`, `interview`, `offer`, `rejected`) |
| `_board` | string | Parent board ID |
| `_jobs` | string[] | Array of job IDs in this list |
| `stageType` | string\|null | Pipeline stage (`WISHLIST`, `APPLY`, `ON_SITE_INTERVIEW`, `OFFER_RECEIVED`, `REJECTED`); `null` for custom lists |
| `suggestedActivityCategoryNames` | string[] | Suggested follow-up activity types |
| `createdAt` | ISO 8601 | Creation timestamp |
| `updatedAt` | ISO 8601 | Last update timestamp |

### Job

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique job identifier |
| `_id` | string | Alternative ID format |
| `title` | string | Job title |
| `url` | string? | Job posting URL |
| `rootDomain` | string? | Domain of job posting (e.g., "linkedin.com") |
| `htmlDescription` | string? | Full HTML job description |
| `_company` | string | Company ID (reference) |
| `_list` | string? | Current list ID (reference) |
| `_board` | string | Board ID (reference) |
| `_activities` | string[] | Activity IDs (references) |
| `_interviewActivities` | string[] | Interview activity IDs (references) |
| `_contacts` | string[] | Contact IDs (references) |
| `_todos` | string[] | Todo IDs (references) |
| `_notes` | string[] | Note IDs (references) |
| `salary` | string? | Salary as raw string (e.g. `"$120,000 - $150,000"`); **not** a structured object |
| `location` | Location? | Job location |
| `createdAt` | ISO 8601 | When job was added |
| `updatedAt` | ISO 8601 | Last update |
| `lastMovedAt` | ISO 8601? | When job was last moved between lists |

### Salary

> **Note:** `salary` is returned as a raw string by the API (e.g. `"$161,000.00 - $255,000.00"`). The TypeScript type `PersonalJob.salary` currently models it as a structured object — this is inaccurate and tracked in [issue #20](https://github.com/mattmck/huntr-cli/issues/20).
>
> **Warning:** The CLI currently dereferences `job.salary.min`, `job.salary.max`, and `job.salary.currency` in [`src/cli.ts`](../src/cli.ts) as if `salary` were a structured object. Because the API actually returns `salary` as a raw string, these nested property lookups evaluate to `undefined`, which can cause the salary to be displayed incorrectly (for example, as `N/A`) rather than reflecting the raw value. Mitigate by changing `PersonalJob.salary` to `string` (or `string | undefined`) and updating the CLI to parse and render the string value explicitly, or by aligning the API and type model so that `salary` is genuinely structured.

### Location

| Field | Type | Description |
|-------|------|-------------|
| `address` | string? | Full address |
| `name` | string? | Location name (e.g., "Germantown") |
| `placeId` | string? | Google Maps place ID (e.g., `"ChIJ..."`) |
| `url` | string? | Google Maps URL (e.g., `"https://maps.google.com/?cid=..."`) |
| `lat` | string? | Latitude as string |
| `lng` | string? | Longitude as string |

### Activity (Action)

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique activity identifier |
| `_id` | string | Alternative ID format |
| `actionType` | string | Type of action (see Action Types below) |
| `date` | ISO 8601 | When activity occurred |
| `createdAt` | ISO 8601 | Creation timestamp |
| `updatedAt` | ISO 8601? | Last update timestamp |
| `data` | ActionData | Activity-specific data |

### ActionData

| Field | Type | Description |
|-------|------|-------------|
| `_job` | string? | Job ID (reference) |
| `_company` | string? | Company ID (reference) |
| `_board` | string? | Board ID (reference) |
| `_fromList` | string? | Source list ID |
| `_toList` | string? | Destination list ID |
| `job` | JobRef? | Denormalized job info |
| `company` | CompanyRef? | Denormalized company info |
| `fromList` | ListRef? | Denormalized source list info |
| `toList` | ListRef? | Denormalized destination list info |
| `note` | Note? | Associated note |
| `activity` | any? | Nested activity |
| `activityCategory` | any? | Activity category |
| `contact` | any? | Contact info |

### User Profile

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique user identifier |
| `_id` | string | Same as `id` |
| `email` | string | User email address |
| `givenName` | string? | First name |
| `familyName` | string? | Last name |
| `fullName` | string? | Full name |
| `auth0IdForMixpanel` | string? | Internal analytics ID |

> Note: The `UserProfile` TypeScript interface in `src/types/personal.ts` is currently out of date with this schema. It still uses legacy `firstName`/`lastName` fields and a required `createdAt`, and does **not** yet include `fullName` or `auth0IdForMixpanel`. Update the interface before relying on these fields in typed code.
---

## Action Types

Common activity action types:

| Action Type | Description | Has Data |
|-------------|-------------|----------|
| `JOB_MOVED` | Job moved between lists | `fromList`, `toList`, `job`, `company` |
| `NOTE_CREATED` | Note added to job | `note`, `job` |
| `JOB_APPLICATION` | Application submitted | `job`, `company` |
| `INTERVIEW_SCHEDULED` | Interview scheduled | `job`, `activity` |
| `INTERVIEW_COMPLETED` | Interview completed | `job`, `activity` |
| `OFFER_RECEIVED` | Job offer received | `job`, `company` |
| `JOB_REJECTED` | Rejected or declined | `job`, `company` |
| `CONTACT_MADE` | Contact added/updated | `contact`, `company` |

---

## Get Entity Types Command

View the types for each entity:

```bash
# View Board type
huntr boards get <board-id> --json | jq 'keys'
# Output: ["id", "_id", "name", "createdAt", "updatedAt", "lists"]

# View Job type
huntr jobs get <board-id> <job-id> --json | jq 'keys'
# Output: ["_id", "id", "title", "url", "rootDomain", "htmlDescription", ...]

# View Activity type
huntr activities list <board-id> --format json | jq '.[0] | keys'
# Output: ["Date", "Type", "Company", "Job", "Status"]

# View User type
huntr me --json | jq 'keys'
# Output: ["id", "_id", "email", "givenName", "familyName", ...]
```

> **Note on `huntr boards get`:** This command is currently broken in the direct-fetch path and should be considered **non-functional** for JSON output. The CLI command `huntr boards get` calls [`PersonalBoardsApi.get`](../src/api/personal/boards.ts), which requests `/boards/:id`; per [API-ENDPOINTS.md](./API-ENDPOINTS.md), that route returns HTML while the canonical JSON board endpoint is `GET /user/boards`.
>
> There is currently no compatibility layer in the codebase that converts that HTML response into JSON. Until this is fixed, do **not** use `huntr boards get ... --json` for programmatic consumption. This applies to **any** `huntr boards get` usages you might see in this document (for example, in schema/`jq` examples) or in older external snippets — treat those as legacy and replace them with the pattern shown below.
>
> For real, working usage when you need board JSON (including when inspecting schemas with `jq`), prefer a command such as:
>
> ```bash
> huntr boards list --json | jq '.[0] | keys'
> ```
>
> **TODO:** Update `PersonalBoardsApi.get` so `huntr boards get` resolves boards via `GET /user/boards` (or another confirmed JSON endpoint) and behaves consistently with `API-ENDPOINTS.md`. Once that is implemented, this note and any remaining workarounds can be revised to show `huntr boards get` examples again, and the schema/querying examples in this document can be updated back to `huntr boards get`.

---

## JSON Schema Examples

### Board (from `GET /user/boards`)

> Note: The `huntr boards get` CLI command currently hits a legacy, non-JSON route whose output still uses a `lists` field instead of `_lists`. The structure below reflects the canonical API shape returned by `GET /user/boards`; the CLI command will be updated to match this schema.

```json
{
  "id": "<boardId>",
  "_id": "<boardId>",
  "name": "Job Search 2025",
  "isArchived": false,
  "createdAt": "2025-09-09T03:25:39.770Z",
  "updatedAt": "2026-01-22T18:23:46.492Z",
  "_lists": [
    "<listId1>",
    "<listId2>"
  ]
}
```

### BoardList (from `GET /board/:id/lists`)

```json
{
  "_id": "<listId>",
  "id": "<listId>",
  "name": "applied",
  "_board": "<boardId>",
  "_jobs": ["<jobId>"],
  "stageType": "APPLY",
  "suggestedActivityCategoryNames": ["Follow Up", "Reach Out"],
  "createdAt": "2025-09-09T03:25:39.779Z",
  "updatedAt": "2026-03-06T22:36:02.131Z",
  "__v": 0
}
```

### Complete Job Entry

```json
{
  "_id": "<jobId>",
  "id": "<jobId>",
  "title": "Software Architect",
  "url": "https://...",
  "rootDomain": "icims.com",
  "htmlDescription": "<p>...</p>",
  "_company": "<companyId>",
  "_list": "<listId>",
  "_board": "<boardId>",
  "_activities": ["<activityId>"],
  "_interviewActivities": [],
  "_contacts": [],
  "_todos": [],
  "_notes": [],
  "salary": "$161,000.00 - $255,000.00",
  "location": {
    "address": "Germantown, MD, USA",
    "name": "Germantown",
    "placeId": "ChIJ...",
    "url": "https://maps.google.com/?cid=...",
    "lat": "39.1731621",
    "lng": "-77.2716502"
  },
  "createdAt": "2026-01-04T18:49:28.657Z",
  "updatedAt": "2026-01-08T21:38:00.838Z",
  "lastMovedAt": "2026-01-04T18:49:34.240Z",
  "__v": 0
}
```

### Complete Activity Entry

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "id": "action_001",
  "actionType": "JOB_MOVED",
  "date": "2024-02-20T15:00:00Z",
  "createdAt": "2024-02-20T15:00:00Z",
  "updatedAt": "2024-02-20T15:05:00Z",
  "data": {
    "_job": "job_001",
    "_company": "company_1",
    "_board": "<boardId>",
    "_fromList": "list_1",
    "_toList": "list_2",
    "job": {
      "_id": "507f1f77bcf86cd799439011",
      "id": "job_001",
      "title": "Senior Engineer at TechCorp"
    },
    "company": {
      "_id": "507f1f77bcf86cd799439012",
      "id": "company_1",
      "name": "TechCorp",
      "color": "#FF0000"
    },
    "fromList": {
      "_id": "507f1f77bcf86cd799439013",
      "id": "list_1",
      "name": "Active Leads"
    },
    "toList": {
      "_id": "507f1f77bcf86cd799439014",
      "id": "list_2",
      "name": "Interviewing"
    },
    "note": null,
    "activity": null,
    "activityCategory": null,
    "contact": null
  }
}
```

---

## Usage Examples

### Get All Field Names for Board

```bash
huntr boards get <board-id> --json | jq 'to_entries | map(.key) | sort'
```

### Get Specific Fields

```bash
# Get just ID and name
huntr boards list --json | jq '.[] | {id, name}'

# Get job titles
huntr jobs list <board-id> --json | jq '.[].title'

# Get all company names from activities
huntr activities list <board-id> --json | jq '.[] | select(.company != null) | .company' | sort | uniq
```

### Type Checking in Code

```typescript
import { Board, PersonalJob, PersonalAction, UserProfile } from './types/personal';

const board: Board = {
  id: '...',
  _id: '...',
  name: 'My Job Search',
  createdAt: new Date().toISOString(),
  lists: []
};
```

---

## Type Documentation

Full TypeScript interface definitions are in:
- `src/types/personal.ts` — Personal API types
- `src/lib/list-options.ts` — Output format types
- `src/config/token-manager.ts` — Auth types

To view in code:

```bash
cat src/types/personal.ts
```

---

## Notes

- **`_id` vs `id`:** Both are provided for compatibility; use `id` in most cases
- **Null fields:** Marked with `?` (optional); may not exist on all entities
- **References:** Fields starting with `_` are IDs that reference other entities
- **Dates:** All ISO 8601 format (UTC timezone)
- **Denormalization:** `data` field in activities includes full nested objects for convenience

---

## Querying with jq

Common jq queries for entity types:

```bash
# Get all field names
huntr boards get <id> --json | jq 'keys'

# Get nested object fields
huntr jobs get <board-id> <job-id> --json | jq '.location | keys'

# Filter by field
huntr activities list <board-id> --json | jq '.[] | select(.type == "JOB_MOVED")'

# Extract nested data
huntr activities list <board-id> --json | jq '.[] | {date: .date, company: .company, job: .job}'
```

---

## See Also

- [API Endpoints](./API-ENDPOINTS.md) — Raw endpoint shapes, response structures, and non-working routes
- [Output Formats](./OUTPUT-FORMATS.md) — How fields are displayed in different formats
- [Output Examples](./OUTPUT-EXAMPLES.md) — Practical usage examples
