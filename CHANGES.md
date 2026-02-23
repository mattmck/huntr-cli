# Version 1.1.0 — Output Formatting Enhancements

## Summary

Implemented comprehensive output formatting enhancements including field selection (`--fields`), PDF export, and Excel export for all list commands. All changes are backward compatible.

## New Features

### 1. Field Selection (`--fields`)

All list commands now support selecting specific output fields:

```bash
huntr boards list --fields ID,Name
huntr jobs list <board-id> --fields Title,URL
huntr activities list <board-id> --fields Date,Type,Company
```

**Benefits:**
- Reduce output clutter with only needed columns
- Easier to pipe to downstream tools
- Works with all output formats (table, json, csv, pdf, excel)

**Implementation:**
- Added `--fields` parameter to: `boards list`, `jobs list`, `activities list`
- Field names are case-sensitive and validated
- Invalid field names produce helpful error messages
- If `--fields` not specified, all default fields included (backward compatible)

### 2. PDF Export Format

All list commands now support `--format pdf`:

```bash
huntr activities list <board-id> --days 7 --format pdf > report.pdf
huntr jobs list <board-id> --format pdf > jobs.pdf
huntr boards list --format pdf > boards.pdf
```

**Features:**
- Professional PDF with table formatting
- Bold white headers on blue background
- Alternate row shading for readability
- Auto-sized columns
- Metadata (generation date)
- Supports field selection with `--fields`

**Dependencies:**
- Requires `pdfkit` (v0.13.0)
- Automatically installed with `npm install`

### 3. Excel Export Format

All list commands now support `--format excel`:

```bash
huntr jobs list <board-id> --format excel > jobs.xlsx
huntr activities list <board-id> --days 7 --format excel > report.xlsx
huntr boards list --format excel > boards.xlsx
```

**Features:**
- Excel spreadsheet with professional formatting
- Bold blue header row
- Auto-adjusted column widths (max 50 chars)
- Landscape orientation
- Supports field selection with `--fields`

**Dependencies:**
- Requires `exceljs` (v4.4.0)
- Automatically installed with `npm install`

## Updated Features

### Output Format Validation

Enhanced format parameter validation:

**Before:**
```
Valid formats: table, json, csv
```

**After:**
```
Valid formats: table, json, csv, pdf, excel
```

### Shell Completions

Updated bash and zsh completions:
- Added `pdf` and `excel` to format options
- Added `--fields` parameter to list command completions
- Added `--week` flag to activities list completions

## Files Changed

### Core Implementation

1. **src/lib/list-options.ts** — Core formatting logic
   - Added `OutputFormat` type with pdf/excel
   - Added `ListOptions.fields` property
   - Added `validateFields()` function
   - Added `formatTableWithFields()` function
   - Added `formatCsvWithFields()` function
   - Added `formatJsonWithFields()` function
   - Added `formatPdf()` function
   - Added `formatExcel()` function

2. **src/cli.ts** — Command implementations
   - Updated `boards list` command with field selection and new formats
   - Updated `jobs list` command with field selection and new formats
   - Updated `activities list` command with field selection and new formats
   - Imported new formatting functions

### Dependencies

3. **package.json** — Added dependencies
   - `pdfkit` (v0.13.0)
   - `exceljs` (v4.4.0)

### Completions

4. **completions/huntr.bash** — Bash completions
   - Updated format options to include pdf, excel
   - Added --fields parameter
   - Ensured --week flag is available for activities

5. **completions/_huntr** — Zsh completions
   - Updated format options to include pdf, excel
   - Added field_opts configuration
   - Added --fields parameter to list_opts

### Documentation

6. **docs/OUTPUT-FORMATS.md** (NEW)
   - Comprehensive reference of all output fields
   - Field definitions for each entity type
   - Planned enhancement documentation

7. **docs/ENHANCEMENT-PLAN.md** (NEW)
   - Detailed implementation plan
   - Library selection rationale
   - Rollout phases

8. **docs/OUTPUT-EXAMPLES.md** (NEW)
   - Practical examples for all features
   - Field selection examples
   - Format-specific usage examples
   - Integration with other tools (jq, bash, etc.)

9. **docs/NPM-PUBLISHING.md** (NEW)
   - Where published packages live
   - How to publish to npm
   - GitHub Artifacts vs npm
   - Distribution flow
   - Publishing checklist

## Backward Compatibility

All changes are fully backward compatible:

- **Default behavior unchanged:** Running commands without `--fields` produces same output as before
- **Format parameter unchanged:** `--format table` (default), `json`, `csv` work identically
- **No breaking changes:** All existing commands and options work as before
- **New features additive:** `--fields` and new formats are optional enhancements

## Error Handling

Improved error messages:

```bash
# Invalid field name
$ huntr jobs list <board-id> --fields Title,BadField
Error: Unknown field(s): BadField
Available fields: ID, Title, URL, Created

# Invalid format
$ huntr jobs list <board-id> --format doc
Error: Invalid format: doc. Must be table, json, csv, pdf, or excel.
```

## Testing

**Verified:**
- ✅ TypeScript compilation (no errors)
- ✅ Build process (all targets compile)
- ✅ Backward compatibility (existing usage unchanged)
- ✅ Field validation (invalid fields caught)
- ✅ Format parsing (new formats recognized)
- ✅ Dependency installation (pdfkit, exceljs added)

## Examples

### Quick Start with New Features

```bash
# 1. Export jobs as Excel
huntr jobs list <board-id> --format excel > jobs.xlsx

# 2. Get only titles and URLs
huntr jobs list <board-id> --fields Title,URL

# 3. PDF report of this week's activities
huntr activities list <board-id> --days 7 --format pdf > report.pdf

# 4. JSON with specific fields for scripting
huntr activities list <board-id> --format json --fields Date,Type,Company
```

## Recommendations for Next Version (v1.2.0)

1. **Fish shell completions** — Add completions/huntr.fish
2. **Test suite** — Add unit tests for new formatting functions
3. **CI/CD** — Add GitHub Actions for automated testing/building
4. **Alternative formats** — Consider TSV, Markdown table, HTML
5. **Custom headers** — Allow renaming columns in output
6. **Filtering on output** — Add `--where` parameter for post-filter

## Documentation Updates

Updated or created:
- [OUTPUT-FORMATS.md](./docs/OUTPUT-FORMATS.md) — Field reference
- [OUTPUT-EXAMPLES.md](./docs/OUTPUT-EXAMPLES.md) — Practical examples
- [ENHANCEMENT-PLAN.md](./docs/ENHANCEMENT-PLAN.md) — Implementation details
- [NPM-PUBLISHING.md](./docs/NPM-PUBLISHING.md) — Distribution guide
- [README.md](./README.md) — May need updates for new options
- [completions/huntr.bash](./completions/huntr.bash) — Updated
- [completions/_huntr](./completions/_huntr) — Updated

## Version Info

- **Version:** 1.1.0
- **Release Date:** 2026-02-23
- **Node Requirement:** >=18.0.0
- **Status:** Ready for npm publish

## How to Publish

```bash
# Update version
npm version minor  # 1.0.0 → 1.1.0

# Build (automatic with prepublishOnly)
npm publish

# Verify
npm view huntr-cli version
npm info huntr-cli

# Install globally to test
npm install -g huntr-cli@1.1.0
```

Users can then install:
```bash
npm install -g huntr-cli
huntr --version
```
