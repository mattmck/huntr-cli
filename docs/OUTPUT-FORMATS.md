# Output Formats and Field Reference

This document explains what fields are included in each output format (table, JSON, CSV, and planned PDF/Excel) for each huntr-cli command.

## Current Output Structure

### `me` — User Profile

**Available formats:** Table (text), JSON only

**Text output (default):**
```
Name: John Doe
Email: john@example.com
ID: user_123
```

**JSON output:**
```json
{
  "id": "user_123",
  "_id": "507f1f77bcf86cd799439011",
  "email": "john@example.com",
  "givenName": "John",
  "familyName": "Doe",
  "firstName": "John",
  "lastName": "Doe",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Note:** This command doesn't support `--format` flag (text output is default, use `--json` for JSON).

---

### `boards list` — All Boards

**Fields included:** ID, Name, Created

**Table output:**
```
ID                        Name               Created
68bf9e33f871e5004a5eb58e  My Job Search      1/15/2024
7c2d8e44g982f6115b6fc69f  Secondary Board    2/20/2024
```

**JSON output:**
```json
[
  {
    "ID": "68bf9e33f871e5004a5eb58e",
    "Name": "My Job Search",
    "Created": "1/15/2024"
  }
]
```

**CSV output:**
```
ID,Name,Created
68bf9e33f871e5004a5eb58e,My Job Search,1/15/2024
```

---

### `boards get <board-id>` — Single Board Details

**Available formats:** Table (text), JSON only

**Text output (default):**
```
Board: My Job Search
ID: 68bf9e33f871e5004a5eb58e
Created: 1/15/2024 10:30 AM

Lists:
  - Active Leads
  - Interviewing
  - Offers
```

**JSON output:**
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
    }
  ]
}
```

---

### `jobs list <board-id>` — All Jobs on a Board

**Fields included:** ID, Title, URL, Created

**Table output:**
```
ID                    Title                              URL                           Created
job_001               Senior Engineer at TechCorp        https://techs.jobs/engineer   1/20/2024
job_002               Product Manager at StartupXYZ      https://jobs.com/pm-role      1/18/2024
```

**JSON output:**
```json
[
  {
    "ID": "job_001",
    "Title": "Senior Engineer at TechCorp",
    "URL": "https://techs.jobs/engineer",
    "Created": "1/20/2024"
  }
]
```

**CSV output:**
```
ID,Title,URL,Created
job_001,Senior Engineer at TechCorp,https://techs.jobs/engineer,1/20/2024
```

---

### `jobs get <board-id> <job-id>` — Single Job Details

**Available formats:** Table (text), JSON only

**Text output (default):**
```
Job Details:
  Title:    Senior Engineer at TechCorp
  URL:      https://techs.jobs/engineer
  Location: San Francisco, CA
  Salary:   120000 - 150000 USD
  Created:  1/20/2024 2:15 PM
```

**JSON output:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "id": "job_001",
  "title": "Senior Engineer at TechCorp",
  "url": "https://techs.jobs/engineer",
  "rootDomain": "techs.jobs",
  "htmlDescription": "...",
  "_company": "company_1",
  "_list": "list_1",
  "_board": "board_1",
  "_activities": ["action_1", "action_2"],
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

---

### `activities list <board-id>` — Activity Log

**Fields included:** Date, Type, Company, Job, Status

**Supported options:**
- `--days <n>` — Filter to last N days
- `--types <types>` — Comma-separated action types (e.g., `JOB_MOVED,NOTE_CREATED`)

**Table output:**
```
Date              Type            Company        Job                                      Status
2024-02-20T15:00  JOB_MOVED       TechCorp       Senior Engineer at TechCorp              Interviewing
2024-02-18T10:30  NOTE_CREATED    StartupXYZ     Product Manager at StartupXYZ            Active Leads
2024-02-15T14:15  JOB_APPLICATION Google         Staff Engineer - Infrastructure          Applied
```

**JSON output:**
```json
[
  {
    "Date": "2024-02-20T15:00",
    "Type": "JOB_MOVED",
    "Company": "TechCorp",
    "Job": "Senior Engineer at TechCorp",
    "Status": "Interviewing"
  }
]
```

**CSV output:**
```
Date,Type,Company,Job,Status
2024-02-20T15:00,JOB_MOVED,TechCorp,Senior Engineer at TechCorp,Interviewing
```

---

### `activities week-csv <board-id>` — Last 7 Days as CSV

**Fields included:** Date, Action, Company, Job Title, Status, Job URL

**Output (CSV only):**
```
Date,Action,Company,Job Title,Status,Job URL
2024-02-20,JOB_MOVED,TechCorp,Senior Engineer at TechCorp,Interviewing,https://techs.jobs/engineer
```

---

## Planned Enhancements

### `--fields` Parameter

All list commands (`boards list`, `jobs list`, `activities list`) will support a `--fields` parameter to select specific columns:

```bash
# Default: all fields
huntr boards list

# Specific fields
huntr boards list --fields ID,Name
huntr jobs list <board-id> --fields Title,URL
huntr activities list <board-id> --fields Date,Type,Company
```

**Behavior:**
- If `--fields` is not provided, all default fields are included
- Fields are case-sensitive and match the column headers exactly
- Invalid field names will raise an error with available options

### PDF Output Format

New `--format pdf` option for list commands:

```bash
huntr activities list <board-id> --days 7 --format pdf > activities.pdf
```

**Details:**
- Includes all selected fields (or default fields if `--fields` not specified)
- Column headers always included
- Professional formatting with borders
- Metadata: command, date, board ID

### Excel Output Format

New `--format excel` option for list commands:

```bash
huntr jobs list <board-id> --format excel > jobs.xlsx
```

**Details:**
- Column headers always included
- Auto-adjusted column widths
- Professional cell formatting
- One sheet per entity type

---

## Summary: Which Formats Include Headers

| Format | Headers | Notes |
|--------|---------|-------|
| **Table** | ✅ Yes | Always shown as first row with divider |
| **JSON** | N/A | JSON object keys are self-documenting |
| **CSV** | ✅ Yes | RFC 4180 compliant with proper escaping |
| **PDF** | ✅ Yes | Professional header row |
| **Excel** | ✅ Yes | Excel header row with formatting |

---

## Implementation Notes

- **Field Selection:** The `--fields` parameter works with all output formats
- **Validation:** Invalid field names are caught early with helpful error messages
- **Default Fields:** Each command has sensible defaults (e.g., activities default to Date, Type, Company, Job, Status)
- **CSV Escaping:** Already implemented using RFC 4180 standards
- **Date Formatting:** Dates are formatted consistently across all formats
