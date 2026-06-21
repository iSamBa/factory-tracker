---
id: 007
feature_id: 001
title: Reporting views & CSV/Excel export
status: pending
created: 2026-06-14
updated: 2026-06-14
size: medium
---

# Story 007: Reporting views & CSV/Excel export

## User Story
As a **manager**, I want **reporting charts and export of activity/filtered data**, so that **I can report rollout progress and blockers to stakeholders**.

## Context
Implements the full Reporting View (§11) and export (FR-12), plus reuse of the FR-13 counters.
Full reporting was explicitly requested. Two export scopes: a single activity matrix (FR-12 /
AC-08) and filtered management-report results (§11).

## Current State Analysis
- `recharts` is available (template dependency) for charts.
- Story 004 provides `lib/metrics.ts`; Story 002 provides the status model.

### Existing Files Involved
| File Path | Relevance |
|-----------|-----------|
| `lib/metrics.ts` | aggregation helpers (extend for region/country breakdowns) |
| `recharts` (deps) | charts |
| `@tanstack/react-table` | filtered tables to export |

### Dependencies
- External: a CSV/XLSX writer (e.g. `papaparse` for CSV and/or `xlsx`/SheetJS for Excel) — add if absent
- Internal modules: `@/lib/metrics`, `@/lib/activities`
- Stories this depends on: 002, 003, 004, 005, 006

## Requirements

### Functional Requirements (§11)
- Show all active activities with overall status and progress.
- Show progress per selected activity by region and country.
- Show number of factories per status for a selected activity.
- Show blocked factories and overdue factory lines.
- Allow exporting filtered results for management reporting.
- FR-12: export an activity matrix to Excel or CSV.

### Technical Requirements
- Charts: progress-by-activity, factories-per-status (per activity), blockers-by-region,
  overdue counts.
- Export builds a file client- or server-side from the currently filtered dataset; columns match
  the rollout matrix; supports CSV and Excel.

## Implementation Guide

### Files to Create
| File Path | Purpose |
|-----------|---------|
| `app/.../<tracker>/reporting/page.tsx` | Reporting view |
| `app/.../<tracker>/reporting/charts/*.tsx` | recharts components |
| `lib/export.ts` | CSV/XLSX builders for matrix + filtered results |

### Files to Modify
| File Path | Changes |
|-----------|---------|
| `lib/metrics.ts` | region/country breakdowns, factories-per-status, blockers-by-region |
| `app/.../activities/[id]/rollout-matrix.tsx` | "Export" button (current filtered view) |
| sidebar nav | add Reporting entry |

### Code References
- Reuse counter components from Story 004; mirror chart usage patterns from former demo dashboards
  before they were deleted (recharts API).

### Implementation Steps
1. Extend `lib/metrics.ts` with breakdown aggregations.
2. Build reporting page: counters + charts (by activity / region / country / status / overdue).
3. `lib/export.ts`: `toCsv(rows)` and `toXlsx(rows)`; wire export buttons on the matrix and the
   reporting filtered table.

## Acceptance Criteria
- [ ] §11 — Reporting shows active activities, progress by region/country, factories-per-status,
      blocked + overdue.
- [ ] FR-12 / AC-08 — Export an activity matrix to CSV and Excel.
- [ ] §11 — Export filtered management results.
- [ ] FR-13 counters present on the reporting view.

## Testing Requirements

### Unit Tests
| Test File | What to Test |
|-----------|--------------|
| `lib/metrics.test.ts` (extend) | region/country + per-status breakdowns |
| `lib/export.test.ts` | CSV/XLSX row mapping correctness |

Scenarios:
- Success: breakdown sums match totals; export includes all filtered rows
- Error:   empty dataset export produces header-only file
- Edge:    NA lines excluded from progress breakdowns

### E2E Tests
- Reporting page renders charts; export downloads a file (smoke).

## Out of Scope
- Scheduled/automated reports (deferred).
- External BI integration (deferred §13).

## Quality Validation
- [ ] All gates in `quality_gates` pass
- [ ] Unit tests written
- [ ] Code review agent run on changed files
- [ ] No new findings from `fallow`

## Open Questions
- Excel library choice (SheetJS vs exceljs) — pick the lightest that supports needed formatting.

## Assumptions
- "Active" matches the Story 004 definition (not Completed/archived).

## Work Log
