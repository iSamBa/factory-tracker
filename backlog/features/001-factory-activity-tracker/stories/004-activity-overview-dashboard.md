---
id: 004
feature_id: 001
title: Activity Overview Dashboard & counters
status: completed
created: 2026-06-14
updated: 2026-06-14
size: medium
---

# Story 004: Activity Overview Dashboard & counters

## User Story
As a **manager**, I want **a dashboard listing all activities with their key metrics and overall counters**, so that **I can see the state of all rollouts at a glance and drill into one**.

## Context
Implements the Activity Overview Dashboard (§7) and the dashboard counters (FR-13). This is the
landing page of the tracker (replaces the old CRM dashboard page). It lists activities and shows
top-level counters; each row links to the Activity Detail page (Story 005).

## Current State Analysis
- The kept CRM route (`page.tsx`) currently renders demo cards (TargetCard, TotalCustomers, etc.).
  These are replaced by tracker counters + an activities list.
- Story 002 provides `computeOverallProgress`; Story 003 provides `listActivities`.

### Existing Files Involved
| File Path | Relevance |
|-----------|-----------|
| kept tracker `page.tsx` (was `crm/page.tsx`) | Replace content with overview |
| `app/.../crm/components/*` | Demo cards — remove/replace |
| `components/ui/card`, `table`, `badge`, `progress` | Reuse for counters/list |
| `@tanstack/react-table` (deps) | Activities list table |

### Dependencies
- External: none new
- Internal modules: `@/lib/activities`, `@/lib/activity-status`
- Stories this depends on: 001, 002, 003

## Requirements

### Functional Requirements
- List all activities with: overall status, overall progress, # factories in scope, # blocked
  factories, due date (target end), last update.
- Dashboard counters (FR-13): total activities, active activities, completed activities,
  blocked factory lines, overdue items.
- Each row links to the Activity Detail page.
- Filter/sort the activity list (by status, type, owner, due date).

### Technical Requirements
- Counters computed server-side or via a single fetch; avoid N+1 by aggregating in `lib/activities`.
- Overdue = a tracking line past its due date and not Finished/NotApplicable.

## Implementation Guide

### Files to Create
| File Path | Purpose |
|-----------|---------|
| `app/.../<tracker>/components/overview-counters.tsx` | FR-13 counter cards |
| `app/.../<tracker>/components/activities-table.tsx` | activities list (tanstack table) |
| `lib/metrics.ts` | counter/overdue aggregation helpers |

### Files to Modify
| File Path | Changes |
|-----------|---------|
| tracker `page.tsx` | Render counters + activities table instead of demo cards |
| `app/.../crm/components/*` | Delete demo card components |

### Code References
- Mirror the existing CRM table pattern (`leads.tsx` uses `@tanstack/react-table`) for the
  activities table, but with tracker columns.

### Implementation Steps
1. `lib/metrics.ts`: aggregate totals, active/completed counts, blocked lines, overdue lines.
2. Build counter cards + activities table components.
3. Replace tracker `page.tsx` content; remove demo CRM card components.
4. Row click → navigate to `/.../activities/[id]`.

## Acceptance Criteria
- [x] §7 — Overview lists activities with status, progress, #in-scope, #blocked, due date, last update.
- [x] FR-13 — Counters show total/active/completed activities, blocked lines, overdue items.
- [x] Rows navigate to the Activity Detail page.
- [x] List can be sorted/filtered.

## Testing Requirements

### Unit Tests
| Test File | What to Test |
|-----------|--------------|
| `lib/metrics.test.ts` | counters + overdue detection |

Scenarios:
- Success: mixed activities → correct counters
- Error:   none (read path)
- Edge:    no activities (empty state); activity with all-NA lines; due-date today vs past

### E2E Tests
- Load overview → counters render, click row → detail page (smoke).

## Out of Scope
- The matrix and per-line editing (Story 005).
- Charts/reporting (Story 007).

## Quality Validation
- [x] All gates in `quality_gates` pass
- [x] Unit tests written
- [x] Code review agent run on changed files
- [x] No new findings from `fallow`

## Open Questions
- "Active" definition: status In Progress, or anything not Completed/archived? Default: not
  Completed and not archived.

## Assumptions
- Empty state shown when there are no activities yet.

## Work Log
- 2026-06-14 14:42 - Started implementation (story 004): overview dashboard counters + activities table, lib/metrics.ts
- 2026-06-14 14:47 - Built overview: lib/metrics.ts (counters/overdue, 10 unit tests), counter cards, sortable/filterable activities table (tanstack); replaced demo crm/page + deleted 8 demo components; added STATUS_BADGE_VARIANT/STATUS_LABEL
- 2026-06-14 14:47 - Runtime-verified overview renders (counters, rows, detail links). All gates green (build/lint/tsc/test 35/fallow)
- 2026-06-14 14:54 - Code review fixes: UTC day-granularity overdue (today not overdue), date-only display without TZ shift, keyboard-accessible rows (role/tabindex/onKeyDown). All gates green (37 tests). Completed
