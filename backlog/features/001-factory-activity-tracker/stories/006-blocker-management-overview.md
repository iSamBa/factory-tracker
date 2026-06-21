---
id: 006
feature_id: 001
title: Blocker management & cross-activity overview
status: pending
created: 2026-06-14
updated: 2026-06-14
size: medium
---

# Story 006: Blocker management & cross-activity overview

## User Story
As a **manager**, I want **to record blockers on factory lines and see every open blocker across all activities in one place**, so that **I can drive resolution where work is stuck**.

## Context
Implements the blocker workflow (§8.3), the Blocker Overview screen (§7), FR-08, and AC-07. A
blocker carries fields beyond the §5 line fields: **owner of blocker** and **expected resolution
date** (plus description and next action). Blockers appear in the overview until resolved.

## Current State Analysis
- Story 002 defines the `Blocker` model (description, ownerOfBlocker, expectedResolutionDate,
  nextAction, resolved) linked to a tracking line.
- Story 005 provides the line update dialog where the blocker flag is toggled.

### Existing Files Involved
| File Path | Relevance |
|-----------|-----------|
| `prisma/schema.prisma` | Blocker model |
| `lib/activities.ts` | line update (blocker flag) |
| `app/.../activities/[id]/update-line-dialog.tsx` | add blocker fields when flag = Yes |

### Dependencies
- External: none new
- Internal modules: `@/lib/db`, `@/lib/activities`
- Stories this depends on: 001, 002, 005

## Requirements

### Functional Requirements
- When a line's blocker flag is set to Yes (or status Blocked), capture: blocker description,
  owner of blocker, expected resolution date, next action.
- Resolving a blocker clears the flag and prompts setting the correct work status (§8.3).
- Blocker Overview (§7): list all open blockers across all activities, grouped/filterable by
  activity, region, country, and factory.
- A resolved blocker leaves the overview but remains in history.

### Technical Requirements
- `GET /api/blockers?status=open` cross-activity query with grouping fields.
- `POST/PATCH` blocker create/resolve tied to the line update transaction.

## Implementation Guide

### Files to Create
| File Path | Purpose |
|-----------|---------|
| `app/.../<tracker>/blockers/page.tsx` | Blocker Overview screen |
| `app/.../<tracker>/blockers/blockers-table.tsx` | grouped/filterable table |
| `app/api/blockers/route.ts` | list open blockers (cross-activity) |
| `lib/blockers.ts` | data access: list/create/resolve |

### Files to Modify
| File Path | Changes |
|-----------|---------|
| `app/.../activities/[id]/update-line-dialog.tsx` | show blocker fields when flagged |
| sidebar nav | add Blockers entry |

### Code References
- Reuse tanstack-table grouping/filtering as in the rollout matrix (Story 005).

### Implementation Steps
1. `lib/blockers.ts`: `listOpenBlockers` (join activity+factory+region/country), `createBlocker`,
   `resolveBlocker`.
2. Extend the update-line dialog: when blocker flag = Yes, require description/owner/expected
   resolution/next action; on resolve, clear and prompt new status.
3. Build the Blocker Overview page with grouping by activity/region/country/factory + filters.

## Acceptance Criteria
- [ ] §8.3 — Setting a blocker captures description, owner, expected resolution date, next action.
- [ ] FR-08 / AC-07 — Blocker Overview lists all open blockers across all activities.
- [ ] Overview supports grouping/filtering by activity, region, country, factory.
- [ ] Resolving a blocker removes it from the overview and prompts a new work status.

## Testing Requirements

### Unit Tests
| Test File | What to Test |
|-----------|--------------|
| `lib/blockers.test.ts` | list filters to open only; resolve clears flag |

Scenarios:
- Success: two activities with blockers → both appear, grouped
- Error:   blocker without required fields rejected
- Edge:    resolving last open blocker → empty overview state

### E2E Tests
- Flag a line as blocked → it appears in Blocker Overview; resolve → it disappears (smoke).

## Out of Scope
- Notifications (deferred §13).
- Reporting on blockers by region chart (Story 007 covers the chart).

## Quality Validation
- [ ] All gates in `quality_gates` pass
- [ ] Unit tests written
- [ ] Code review agent run on changed files
- [ ] No new findings from `fallow`

## Open Questions
- Whether one line can have multiple concurrent blockers or just one. Default: one active blocker
  per line (model allows history of past blockers).

## Assumptions
- Setting status=Blocked implies blocker flag=Yes and vice-versa (kept consistent).

## Work Log
