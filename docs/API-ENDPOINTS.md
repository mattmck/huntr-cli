# API Endpoints Reference

This document captures the actual raw API endpoints used by huntr-cli, their response shapes, and known limitations. All endpoints are relative to `https://api.huntr.co/api` and require a Bearer token.

## Authentication

All requests use an `Authorization: Bearer <token>` header. Tokens are short-lived JWTs obtained via Clerk session refresh. See `src/config/clerk-session-manager.ts`.

---

## Endpoints

### `GET /user/me`

Returns the authenticated user's profile.

**Response:**
```json
{
  "_id": "<userId>",
  "email": "user@example.com",
  "givenName": "<givenName>",
  "familyName": "<familyName>",
  "fullName": "<fullName>",
  "auth0IdForMixpanel": "<userId>",
  "id": "<userId>"
}
```

---

### `GET /user/boards`

Returns all boards for the authenticated user as an **object map** keyed by board ID.

**Response:**
```json
{
  "<boardId>": {
    "isArchived": false,
    "_members": [],
    "_invitations": [],
    "_lists": [
      "<listId1>",
      "<listId2>"
    ],
    "_id": "<boardId>",
    "_user": {
      "_id": "<userId>",
      "email": "user@example.com",
      "givenName": "<givenName>",
      "familyName": "<familyName>",
      "fullName": "<fullName>",
      "id": "<userId>"
    },
    "name": "Job Search 2025",
    "createdAt": "2025-09-09T03:25:39.770Z",
    "updatedAt": "2026-01-22T18:23:46.492Z",
    "__v": 8,
    "organization": null,
    "id": "<boardId>"
  }
}
```

> **Note:** `_lists` contains only list IDs, not list objects. To get list names, use `GET /board/:id/lists`.

---

### `GET /board/:boardId/lists`

Returns all lists for a board as an **object map** keyed by list ID. This is the only way to get list names — there is no endpoint to fetch a single list by ID.

**Response:**
```json
{
  "<listId>": {
    "_id": "<listId>",
    "name": "applied",
    "_board": "<boardId>",
    "_jobs": ["<jobId>", "..."],
    "stageType": "APPLY",
    "suggestedActivityCategoryNames": ["Follow Up", "Reach Out"],
    "createdAt": "2025-09-09T03:25:39.779Z",
    "updatedAt": "2026-03-06T22:36:02.131Z",
    "__v": 0,
    "id": "<listId>"
  }
}
```

**Default Huntr list names and `stageType` values:**

| `name`     | `stageType`          |
|------------|----------------------|
| `wishlist` | `WISHLIST`           |
| `applied`  | `APPLY`              |
| `interview`| `ON_SITE_INTERVIEW`  |
| `offer`    | `OFFER_RECEIVED`     |
| `rejected` | `REJECTED`           |

Custom user-created lists have `stageType: null`.

> **No single-list endpoint exists.** `GET /list/:id`, `GET /lists/:id`, and `GET /board/:id/lists/:listId` all return HTML (not API routes).

---

### `GET /board/:boardId/jobs`

Returns all jobs for a board as an **object map** keyed by job ID.

**Response:**
```json
{
  "jobs": {
    "<jobId>": {
      "_id": "<jobId>",
      "id": "<jobId>",
      "title": "Software Architect",
      "url": "https://...",
      "rootDomain": "icims.com",
      "htmlDescription": "<p>...</p>",
      "titleBaseKeyword": "Software Architect",
      "_company": "<companyId>",
      "_list": "<listId>",
      "_board": "<boardId>",
      "_creatorUser": "<userId>",
      "_ownerUser": "<userId>",
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
  }
}
```

**Known shape quirks:**
- `salary` comes back as a **raw string** (e.g. `"$161,000.00 - $255,000.00"`), not a structured `{ min, max, currency }` object. The TypeScript type `PersonalJob.salary` currently models it as a structured object, which is inaccurate.
- `_list` is a bare ID — list name must be resolved via `GET /board/:id/lists`.

---

### `GET /board/:boardId/jobs/:jobId`

Returns a single job object (same shape as above, unwrapped from the `jobs` map).

---

### `GET /board/:boardId/actions`

Returns activity log for a board as an **object map** keyed by action ID, plus a `nextPage` cursor for pagination.

**Response:**
```json
{
  "actions": {
    "<actionId>": {
      "_id": "...",
      "id": "...",
      "actionType": "JOB_MOVED",
      "date": "2026-01-04T18:49:34.240Z",
      "createdAt": "2026-01-04T18:49:34.240Z",
      "data": {
        "_job": "<jobId>",
        "_company": "<companyId>",
        "_board": "<boardId>",
        "_fromList": "<listId>",
        "_toList": "<listId>",
        "job": { "_id": "...", "id": "...", "title": "Software Architect" },
        "company": { "_id": "...", "id": "...", "name": "Viasat", "color": null },
        "fromList": { "_id": "...", "id": "...", "name": "wishlist" },
        "toList": { "_id": "...", "id": "...", "name": "applied" }
      }
    }
  },
  "nextPage": null
}
```

---

## Endpoints That Do Not Work

The following paths return an HTML page (the Huntr SPA) rather than JSON. They are not valid API routes:

| Path | Notes |
|------|-------|
| `GET /boards` | Returns HTML |
| `GET /boards/:id` | Returns HTML — used incorrectly in `PersonalBoardsApi.get()` |
| `GET /board/:id` | Returns HTML |
| `GET /list/:id` | Returns HTML |
| `GET /lists/:id` | Returns HTML |
| `GET /board/:id/list/:listId` | Returns HTML |
| `GET /board/:id/lists/:listId` | Returns HTML |
