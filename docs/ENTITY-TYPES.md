# Entity Types Reference

This document shows the complete structure of each entity type returned by huntr-cli.

## Quick Reference

### Board Entity

```typescript
{
  id: "68bf9e33f871e5004a5eb58e",
  _id: "507f1f77bcf86cd799439011",
  name: "My Job Search",
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-02-20T15:45:00Z",
  lists: [
    { id: "list_1", _id: "...", name: "Active Leads", order: 1 },
    { id: "list_2", _id: "...", name: "Interviewing", order: 2 }
  ]
}
```

### Job Entity

```typescript
{
  _id: "507f1f77bcf86cd799439011",
  id: "job_001",
  title: "Senior Engineer at TechCorp",
  url: "https://techs.jobs/engineer",
  rootDomain: "techs.jobs",
  htmlDescription: "HTML job description...",
  _company: "company_id_ref",
  _list: "list_id_ref",
  _board: "board_id_ref",
  _activities: ["action_1", "action_2"],
  _notes: ["note_1"],
  salary: {
    min: 120000,
    max: 150000,
    currency: "USD"
  },
  location: {
    address: "San Francisco, CA",
    name: "San Francisco",
    lat: "37.7749",
    lng: "-122.4194"
  },
  createdAt: "2024-01-20T14:15:00Z",
  updatedAt: "2024-02-15T10:00:00Z",
  lastMovedAt: "2024-02-18T09:30:00Z"
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
  id: "user_123",
  _id: "507f1f77bcf86cd799439011",
  email: "john@example.com",
  givenName: "John",
  familyName: "Doe",
  firstName: "John",
  lastName: "Doe",
  createdAt: "2024-01-15T10:30:00Z"
}
```

---

## Detailed Field Descriptions

### Board

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique board identifier (MongoDB ObjectId as string) |
| `_id` | string | Alternative ID format |
| `name` | string | Board name (e.g., "My Job Search") |
| `createdAt` | ISO 8601 | Creation timestamp |
| `updatedAt` | ISO 8601 | Last update timestamp |
| `lists` | Array<BoardList> | Lists (columns) on the board |

### BoardList

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique list identifier |
| `_id` | string | Alternative ID format |
| `name` | string | List name (e.g., "Active Leads", "Interviewing") |
| `order` | number? | Position order on board |

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
| `_notes` | string[] | Note IDs (references) |
| `salary` | Salary? | Salary information |
| `location` | Location? | Job location |
| `createdAt` | ISO 8601 | When job was added |
| `updatedAt` | ISO 8601 | Last update |
| `lastMovedAt` | ISO 8601? | When job was last moved between lists |

### Salary

| Field | Type | Description |
|-------|------|-------------|
| `min` | number? | Minimum salary |
| `max` | number? | Maximum salary |
| `currency` | string? | Currency (e.g., "USD", "EUR") |

### Location

| Field | Type | Description |
|-------|------|-------------|
| `address` | string? | Full address |
| `name` | string? | Location name (e.g., "San Francisco") |
| `lat` | string? | Latitude as string |
| `lng` | string? | Longitude as string |
| `url` | string? | Location info URL |

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
| `_id` | string? | Alternative ID format |
| `email` | string | User email address |
| `givenName` | string? | First name (from profile) |
| `familyName` | string? | Last name (from profile) |
| `firstName` | string? | First name (legacy field) |
| `lastName` | string? | Last name (legacy field) |
| `createdAt` | ISO 8601 | Account creation date |

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

---

## JSON Schema Examples

### Complete Board with Jobs

```json
{
  "id": "68bf9e33f871e5004a5eb58e",
  "_id": "507f1f77bcf86cd799439011",
  "name": "My Job Search",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-02-20T15:45:00Z",
  "lists": [
    {
      "id": "list_1",
      "_id": "507f1f77bcf86cd799439012",
      "name": "Active Leads",
      "order": 1
    },
    {
      "id": "list_2",
      "_id": "507f1f77bcf86cd799439013",
      "name": "Interviewing",
      "order": 2
    },
    {
      "id": "list_3",
      "_id": "507f1f77bcf86cd799439014",
      "name": "Offers",
      "order": 3
    }
  ]
}
```

### Complete Job Entry

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "id": "job_001",
  "title": "Senior Software Engineer",
  "url": "https://example.com/jobs/engineer",
  "rootDomain": "example.com",
  "htmlDescription": "<p>We're looking for...</p>",
  "_company": "company_1",
  "_list": "list_2",
  "_board": "68bf9e33f871e5004a5eb58e",
  "_activities": ["action_1", "action_2", "action_3"],
  "_notes": ["note_1"],
  "salary": {
    "min": 120000,
    "max": 150000,
    "currency": "USD"
  },
  "location": {
    "address": "San Francisco, CA",
    "name": "San Francisco",
    "lat": "37.7749",
    "lng": "-122.4194"
  },
  "createdAt": "2024-01-20T14:15:00Z",
  "updatedAt": "2024-02-15T10:00:00Z",
  "lastMovedAt": "2024-02-18T09:30:00Z"
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
    "_board": "68bf9e33f871e5004a5eb58e",
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

- [Output Formats](./OUTPUT-FORMATS.md) — How fields are displayed in different formats
- [Output Examples](./OUTPUT-EXAMPLES.md) — Practical usage examples
