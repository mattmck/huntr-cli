# Output Format Examples and Usage Guide

This document provides practical examples for using huntr-cli's output formatting capabilities, including the new `--fields` parameter and PDF/Excel export formats.

## Field Selection with `--fields`

All list commands support the `--fields` parameter to select specific columns:

### Example: Boards with Custom Fields

```bash
# Default: all fields (ID, Name, Created)
huntr boards list

# Only ID and Name
huntr boards list --fields ID,Name

# Only Name
huntr boards list --fields Name
```

**Output with `--fields ID,Name`:**
```
ID                        Name
68bf9e33f871e5004a5eb58e  My Job Search
7c2d8e44g982f6115b6fc69f  Secondary Board
```

### Example: Jobs with Field Selection

```bash
# Default: ID, Title, URL, Created
huntr jobs list <board-id>

# Only Title and URL
huntr jobs list <board-id> --fields Title,URL

# Only Title
huntr jobs list <board-id> --fields Title
```

**Output with `--fields Title,URL`:**
```
Title                              URL
Senior Engineer at TechCorp        https://techs.jobs/engineer
Product Manager at StartupXYZ      https://jobs.com/pm-role
```

### Example: Activities with Field Selection

```bash
# Default: Date, Type, Company, Job, Status
huntr activities list <board-id>

# Only Type, Company, and Status
huntr activities list <board-id> --fields Type,Company,Status

# Date and Company for quick reference
huntr activities list <board-id> --fields Date,Company
```

**Available fields for activities:**
- `Date` — When the activity occurred
- `Type` — Action type (e.g., JOB_MOVED, NOTE_CREATED)
- `Company` — Company name
- `Job` — Job title (truncated to 40 chars)
- `Status` — List the job was moved to

---

## Output Formats

### Table Format (Default)

```bash
huntr jobs list <board-id>
```

**Output:**
```
ID        Title                              URL                           Created
job_001   Senior Engineer at TechCorp        https://techs.jobs/engineer   1/20/2024
job_002   Product Manager at StartupXYZ      https://jobs.com/pm-role      1/18/2024
```

**With field selection:**
```bash
huntr jobs list <board-id> --fields Title,URL
```

**Output:**
```
Title                              URL
Senior Engineer at TechCorp        https://techs.jobs/engineer
Product Manager at StartupXYZ      https://jobs.com/pm-role
```

### JSON Format

```bash
huntr jobs list <board-id> --format json
```

**Output:**
```json
[
  {
    "ID": "job_001",
    "Title": "Senior Engineer at TechCorp",
    "URL": "https://techs.jobs/engineer",
    "Created": "1/20/2024"
  },
  {
    "ID": "job_002",
    "Title": "Product Manager at StartupXYZ",
    "URL": "https://jobs.com/pm-role",
    "Created": "1/18/2024"
  }
]
```

**With field selection:**
```bash
huntr jobs list <board-id> --format json --fields Title,URL
```

**Output:**
```json
[
  {
    "Title": "Senior Engineer at TechCorp",
    "URL": "https://techs.jobs/engineer"
  },
  {
    "Title": "Product Manager at StartupXYZ",
    "URL": "https://jobs.com/pm-role"
  }
]
```

### CSV Format

```bash
huntr jobs list <board-id> --format csv
```

**Output:**
```
ID,Title,URL,Created
job_001,Senior Engineer at TechCorp,https://techs.jobs/engineer,1/20/2024
job_002,Product Manager at StartupXYZ,https://jobs.com/pm-role,1/18/2024
```

**With field selection:**
```bash
huntr jobs list <board-id> --format csv --fields Title,URL
```

**Output:**
```
Title,URL
Senior Engineer at TechCorp,https://techs.jobs/engineer
Product Manager at StartupXYZ,https://jobs.com/pm-role
```

**Save to file:**
```bash
huntr jobs list <board-id> --format csv > jobs.csv
huntr activities list <board-id> --days 7 --format csv > week-activities.csv
```

### PDF Format

```bash
huntr jobs list <board-id> --format pdf > jobs.pdf
```

Creates a professional PDF with:
- Column headers (bold white text on blue background)
- Alternate row shading for readability
- Auto-sized columns
- Metadata (generation date)
- Footer with "huntr-cli" branding

**With field selection:**
```bash
huntr activities list <board-id> --days 7 --format pdf --fields Date,Type,Company > week-activities.pdf
```

**Open PDF:**
```bash
# macOS
huntr jobs list <board-id> --format pdf | open -f -a Preview

# Linux
huntr jobs list <board-id> --format pdf > jobs.pdf && xdg-open jobs.pdf

# Windows
huntr jobs list <board-id> --format pdf > jobs.pdf && start jobs.pdf
```

### Excel Format

```bash
huntr jobs list <board-id> --format excel > jobs.xlsx
```

Creates an Excel workbook with:
- Bold blue header row
- Auto-adjusted column widths (max 50 chars)
- Professional formatting
- Landscape orientation
- Sheet name based on entity type

**With field selection:**
```bash
huntr activities list <board-id> --days 7 --format excel --fields Date,Type,Company,Status > week-activities.xlsx
```

**Open Excel:**
```bash
# macOS
huntr jobs list <board-id> --format excel | open -f -a "Microsoft Excel"

# Windows
huntr jobs list <board-id> --format excel > jobs.xlsx && start jobs.xlsx

# Linux (LibreOffice)
huntr jobs list <board-id> --format excel > jobs.xlsx && libreoffice jobs.xlsx
```

---

## Practical Examples

### Example 1: Export Activities for Reporting

Export the past week of activities as Excel for a manager report:

```bash
huntr activities list <board-id> --days 7 --format excel --fields Date,Type,Company,Job,Status > report.xlsx
```

### Example 2: Quick CSV for Spreadsheet Import

Get a CSV of all jobs for import into Google Sheets:

```bash
huntr jobs list <board-id> --format csv --fields Title,URL,Created > import.csv
```

Then in Google Sheets: File → Import → Upload → import.csv

### Example 3: List Jobs Without URLs

If you just want to see job titles and creation dates:

```bash
huntr jobs list <board-id> --format table --fields Title,Created
```

### Example 4: Parse Activities with jq

Combine JSON output with jq for programmatic access:

```bash
# Get all companies from activities
huntr activities list <board-id> --days 30 --format json | jq '.[].Company'

# Get activities for a specific company
huntr activities list <board-id> --days 30 --format json | jq 'map(select(.Company == "TechCorp"))'

# Count activities by type
huntr activities list <board-id> --days 30 --format json | jq 'group_by(.Type) | map({type: .[0].Type, count: length})'
```

### Example 5: Pipe to Mail

Email a PDF report of this week's activities:

```bash
huntr activities list <board-id> --days 7 --format pdf \
  | mail -s "Weekly Job Search Report" your-email@example.com -a "Content-Type: application/pdf"
```

### Example 6: Automated Backup

Create a daily backup of all activities as CSV:

```bash
#!/bin/bash
BOARD_ID="68bf9e33f871e5004a5eb58e"
DATE=$(date +%Y-%m-%d)
huntr activities list $BOARD_ID --format csv > "backup-activities-${DATE}.csv"
```

Add to crontab to run daily:

```bash
0 2 * * * /path/to/backup-activities.sh
```

---

## Field Reference

### Boards List
- `ID` — Unique board identifier
- `Name` — Board name (or "N/A")
- `Created` — Creation date (MM/DD/YYYY)

### Jobs List
- `ID` — Unique job identifier
- `Title` — Job title
- `URL` — Job posting URL (or "N/A")
- `Created` — Creation date (MM/DD/YYYY)

### Activities List
- `Date` — Activity timestamp (YYYY-MM-DDTHH:MM format)
- `Type` — Action type (e.g., JOB_MOVED, NOTE_CREATED, JOB_APPLICATION)
- `Company` — Company name (empty string if not available)
- `Job` — Job title, truncated to 40 characters
- `Status` — Board list name the job was moved to (empty if not applicable)

---

## Error Handling

### Invalid Field Name

```bash
$ huntr jobs list <board-id> --fields Title,InvalidField
Error: Unknown field(s): InvalidField
Available fields: ID, Title, URL, Created
```

### Invalid Format

```bash
$ huntr jobs list <board-id> --format doc
Error: Invalid format: doc. Must be table, json, csv, pdf, or excel.
```

### Missing Dependencies

If PDF or Excel format is used without dependencies installed:

```bash
$ huntr jobs list <board-id> --format pdf
Error: PDF format requires the pdfkit package. Install with: npm install pdfkit
```

*This shouldn't happen if installed via npm, but mentioned for reference.*

---

## Tips and Best Practices

1. **Default behavior unchanged** — Running a command without `--format` or `--fields` works exactly as before
2. **Field order matters** — Fields are output in the order specified: `--fields Company,Job,Date`
3. **Case-sensitive** — Field names must match exactly: `Company`, not `company`
4. **All formats have headers** — Table, CSV, PDF, and Excel all include column headers
5. **CSV is RFC 4180** — Proper escaping for quotes and commas
6. **PDF is single-page** — May wrap text if many columns; use `--fields` to reduce
7. **Excel auto-fits columns** — Column widths auto-adjust up to 50 characters
8. **Piping works** — Use `> filename` to save output to file

---

## Combining with Other Tools

### Bash

```bash
# Count rows
huntr jobs list <board-id> --format csv | wc -l

# Filter by URL
huntr jobs list <board-id> --format csv | grep "github.com"

# Sort by creation date
huntr activities list <board-id> --format csv | sort -t',' -k1
```

### Shell Scripts

```bash
#!/bin/bash
BOARD="${1:-default-board-id}"
DAYS="${2:-7}"

echo "=== Weekly Summary ==="
huntr activities list "$BOARD" --days "$DAYS" --format json | jq length
echo "activities found"

echo "=== Top Companies ==="
huntr activities list "$BOARD" --days "$DAYS" --format json \
  | jq -r '.[].Company' | sort | uniq -c | sort -rn
```

### Make

```Makefile
export-jobs:
	huntr jobs list <board-id> --format excel --fields Title,URL > jobs.xlsx

report-week:
	huntr activities list <board-id> --days 7 --format pdf > report.pdf

backup:
	huntr boards list --format csv > backup-boards.csv
	huntr jobs list <board-id> --format csv > backup-jobs.csv
	huntr activities list <board-id> --format csv > backup-activities.csv
```
