# Output Format Enhancements — Implementation Plan

## Overview

This document outlines the implementation plan for:
1. `--fields` parameter for field selection
2. PDF output format
3. Excel output format
4. Enhanced output validation

## Changes to list-options.ts

### Type Updates

```typescript
export interface ListOptions {
  format: OutputFormat;
  days?: number;
  types?: string[];
  fields?: string[];  // NEW: selected fields
}

export type OutputFormat = 'table' | 'json' | 'csv' | 'pdf' | 'excel';  // UPDATED
```

### New Functions

1. **`validateFields(availableFields: string[], requestedFields?: string[]): string[]`**
   - Validates that requested fields exist in available set
   - Returns requested fields if valid, or all available fields if none specified
   - Throws error with helpful message if invalid

2. **`formatPdf<T>(rows: T[], headers: string[], title?: string): Buffer`**
   - Generates PDF with professional formatting
   - Includes headers, borders, auto-sized columns
   - Uses `pdfkit` library

3. **`formatExcel<T>(rows: T[], headers: string[], title?: string): Buffer`**
   - Generates Excel workbook
   - Includes headers with formatting
   - Auto-adjusted column widths
   - Uses `exceljs` library

### Parser Update

Update `parseListOptions()` to:
- Accept and validate `fields` parameter
- Provide it in returned `ListOptions` object

---

## CLI Updates

### Package Dependencies

Add to `package.json`:
```json
{
  "pdfkit": "^0.13.0",
  "exceljs": "^4.4.0"
}
```

### Command Updates

Each list command (`boards list`, `jobs list`, `activities list`):

1. Add option:
   ```typescript
   .option('--fields <fields>', 'Comma-separated list of fields to include')
   ```

2. Define `AVAILABLE_FIELDS` for each entity:
   ```typescript
   const AVAILABLE_FIELDS = ['ID', 'Name', 'Created'];
   ```

3. Call helper to validate:
   ```typescript
   const validFields = validateFields(AVAILABLE_FIELDS, listOpts.fields);
   ```

4. Handle PDF/Excel formats:
   ```typescript
   if (listOpts.format === 'pdf') {
     const buffer = formatPdf(rows, validFields, 'Boards List');
     process.stdout.write(buffer);
   } else if (listOpts.format === 'excel') {
     const buffer = formatExcel(rows, validFields, 'Boards List');
     process.stdout.write(buffer);
   }
   ```

---

## Field Definitions by Command

### `boards list`
- Available: ID, Name, Created
- Default (no `--fields`): ID, Name, Created

### `jobs list`
- Available: ID, Title, URL, Created, Company (if available), Location (if available)
- Default: ID, Title, URL, Created

### `activities list`
- Available: Date, Type, Company, Job, Status, JobID, CompanyID (raw IDs)
- Default: Date, Type, Company, Job, Status

### `me`
- Not applicable (no format parameter)

### `boards get`, `jobs get`
- Not applicable (no format parameter, singular entity)

---

## Error Handling

Invalid field example:
```bash
$ huntr boards list --fields ID,InvalidField
Error: Unknown field 'InvalidField'
Available fields: ID, Name, Created
```

Invalid format example:
```bash
$ huntr boards list --format doc
Error: Invalid format: doc. Must be table, json, csv, pdf, or excel.
```

---

## Testing Strategy

1. **Field Validation**
   - Valid field selection
   - Invalid field selection (error)
   - No `--fields` parameter (all fields)

2. **Format Output**
   - PDF generation and binary integrity
   - Excel generation and spreadsheet validity
   - CSV escaping still works
   - Table formatting preserved

3. **Round-trip Testing**
   - CSV → Excel conversion
   - CSV → PDF conversion
   - Field selection works across all formats

---

## Rollout Plan

### Phase 1: Foundation
- [ ] Update `list-options.ts` with types and validation
- [ ] Add `validateFields()` utility
- [ ] Install dependencies: pdfkit, exceljs

### Phase 2: Field Selection
- [ ] Update all commands to support `--fields` parameter
- [ ] Test field validation across all commands

### Phase 3: PDF Format
- [ ] Implement `formatPdf()` in list-options.ts
- [ ] Test PDF output for each command
- [ ] Update completions for `--format pdf`

### Phase 4: Excel Format
- [ ] Implement `formatExcel()` in list-options.ts
- [ ] Test Excel output for each command
- [ ] Update completions for `--format excel`

### Phase 5: Documentation
- [ ] Update OUTPUT-FORMATS.md with examples
- [ ] Update README.md with new options
- [ ] Update bash/zsh completions
- [ ] Add examples to help text

---

## Library Selection Rationale

### pdfkit vs alternatives
- **pdfkit**: Pure Node.js, no native dependencies, good for CLI
- **puppeteer**: Overkill, requires headless browser
- **pdf-lib**: Good but pdfkit more feature-complete for tables

### exceljs vs alternatives
- **exceljs**: Pure JavaScript, supports streaming, professional features
- **xlsx**: Simpler but less control over formatting
- **node-xlsx**: Minimal, but exceljs more actively maintained

---

## Backward Compatibility

All changes are backward compatible:
- Existing commands work without `--fields` parameter
- Existing formats (table, json, csv) unchanged
- Default behavior unchanged
- No breaking changes to API
