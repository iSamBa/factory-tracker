---
id: 005
feature_id: 001
title: "Activity Detail: rollout matrix & update flow"
status: in_progress
created: 2026-06-14
updated: 2026-06-14
size: large
---

# Story 005: Activity Detail — factory rollout matrix & update flow

## User Story
As a **coordinator**, I want **an activity detail page with a filterable factory rollout matrix and an inline update dialog**, so that **I can see and update every factory's status for one activity in one place**.

## Context
The main working page (§7). Implements the Factory Rollout Matrix, the Update Factory Status
dialog, overall-progress display, overdue highlighting, update history, and milestone display.
Covers FR-04/05/06/07/09/10/11 and AC-03/04/05/06.

## Current State Analysis
- Story 003 exposes `GET /api/activities/[id]` (activity + lines) and the data-access layer.
- Story 002 provides `computeOverallProgress` and the status model.
- `@tanstack/react-table` is available for the matrix; shadcn `dialog`, `select`, `slider`/`input`,
  `textarea`, `badge`, `progress` are available.

### Existing Files Involved
| File Path | Relevance |
|-----------|-----------|
| `lib/activities.ts` | fetch activity + lines, update line |
| `lib/activity-status.ts` | status enum, progress calc |
| `components/ui/{dialog,table,select,badge,progress,slider,textarea}` | reuse |

### Dependencies
- External: none new
- Internal modules: `@/lib/activities`, `@/lib/activity-status`
- Stories this depends on: 001, 002, 003

## Requirements

### Functional Requirements
- Detail page header: activity metadata + overall status + overall progress (calc, NA excluded).
- Factory Rollout Matrix: one row per factory with columns — region, country, in-scope, status,
  progress %, local responsible, blocker, due date, next action, comment, last update.
- Filter/sort (FR-07): region, country, factory, status, progress range, blocker, responsible, due date.
- Update Factory Status dialog (FR-05): edit status, progress %, responsible, blocker flag,
  due date, next action, comment for one line; writing a change records an UpdateHistory entry (FR-10).
- Overdue lines highlighted (FR-09).
- Comments/status notes per line (FR-11).
- Milestones for the activity displayed (and editable — included per v1 decision).

### Technical Requirements
- `PATCH /api/activities/[id]/lines/[lineId]` updates a line + writes history in a transaction.
- `lastUpdate` set automatically on any change.
- Status change may auto-suggest a progress value within the band (§6) but allow override
  (Blocked allows any value).
- Overall progress recomputed and shown after each update.

## Implementation Guide

### Files to Create
| File Path | Purpose |
|-----------|---------|
| `app/.../<tracker>/activities/[id]/page.tsx` | Activity detail page (server fetch) |
| `app/.../<tracker>/activities/[id]/rollout-matrix.tsx` | matrix table + filters |
| `app/.../<tracker>/activities/[id]/update-line-dialog.tsx` | update dialog form |
| `app/.../<tracker>/activities/[id]/milestones-panel.tsx` | milestones list/edit |
| `app/api/activities/[id]/lines/[lineId]/route.ts` | PATCH a line (+history) |
| `app/api/activities/[id]/milestones/route.ts` | milestone CRUD |

### Files to Modify
| File Path | Changes |
|-----------|---------|
| `lib/activities.ts` | `updateLine` (with history), milestone helpers |

### Code References
- Follow the existing tanstack-table setup in the old `crm/components/leads.tsx` for column defs,
  sorting, filtering, and visibility.

### Implementation Steps
1. Detail page server component: fetch activity + lines + milestones; compute overall progress.
2. Rollout matrix with column filters + global filters (region/country/status/blocker/responsible/
   progress range/due date).
3. Update-line dialog (react-hook-form); on submit → PATCH → revalidate.
4. `updateLine` writes changed fields + an UpdateHistory row in a transaction; sets `lastUpdate`.
5. Overdue highlighting; milestones panel with add/edit.

## Acceptance Criteria
- [ ] AC-03 — Opening an activity shows all selected factories in one table.
- [ ] AC-04 — User can update status, progress, responsible, blocker, next action, due date, comment.
- [ ] AC-05 — Overall activity progress is calculated and displayed (NA excluded).
- [ ] AC-06 — Filter by region, country, status, blocker, responsible (plus progress range, due date).
- [ ] FR-09 — Overdue lines visually highlighted.
- [ ] FR-10 — Each line update creates a history entry; history is viewable.
- [ ] Milestones for the activity are shown and editable.

## Testing Requirements

### Unit Tests
| Test File | What to Test |
|-----------|--------------|
| `lib/activities.test.ts` (extend) | `updateLine` writes history + lastUpdate; overall recompute |

Scenarios:
- Success: update status InProgress + progress 60 → history row, overall recalculated
- Error:   invalid progress / unknown lineId rejected
- Edge:    set NotApplicable → excluded from overall; Blocked with arbitrary progress allowed

### E2E Tests
- Open detail → filter → update a line → overall progress changes (smoke).

## Out of Scope
- Cross-activity blocker overview (Story 006).
- Reporting charts/export (Story 007).

## Quality Validation
- [ ] All gates in `quality_gates` pass
- [ ] Unit tests written
- [ ] Code review agent run on changed files
- [ ] No new findings from `fallow`

## Open Questions
- Whether status change should hard-snap progress into its band or only suggest. Default: suggest,
  allow override; enforce Finished=100 and NotStarted=0.

## Assumptions
- History granularity is per-line per-save (not per-field-keystroke).

## Work Log
- 2026-06-14 14:55 - Started implementation (story 005): detail page, rollout matrix, update-line dialog+API (with history), milestones
- 2026-06-14 15:08 - Built detail page: rollout matrix (filters region/country/status/blocker/responsible/progress/overdue), update-line dialog (status→progress suggest, history view), milestones panel, lifecycle actions. PATCH line API writes per-field history + recomputes overall in tx. lib/line-history.ts pure helpers (12 tests)
- 2026-06-14 15:08 - Runtime-verified: line update→200 + 4 history entries + overall 46→45, invalid→400, unknown→404, milestone create→201, detail renders. Refactored matrix to cut cognitive complexity; extracted shared formatDate/StatusBadge. Gates: build/lint/tsc/test 46/fallow(warn:boilerplate dupes, non-blocking, 0 errors/complexity)
- 2026-06-21 - Multiple responsibles per line: replaced single free-text `localResponsible` with `responsibles` (JSON-array column on ActivityFactoryStatus; no Person table). New lib/responsibles.ts (parse/serialize/normalize: trim, drop-empty, case-insensitive dedupe). line-history diff treats the list as an unordered set (reorder ≠ change). Update dialog uses a chip input (Enter/comma to add, ×/Backspace to remove); matrix renders/filters across names. Verified end-to-end via real-Prisma round trip: no-op/reordered save writes 0 history rows, real add writes 1. db push --accept-data-loss + reseed (existing localResponsible values reset). Gates: tsc/lint clean, test 55.
