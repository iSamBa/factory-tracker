---
id: 003
feature_id: 001
title: Activity CRUD & scope-based line generation
status: completed
created: 2026-06-14
updated: 2026-06-14
size: large
---

# Story 003: Activity CRUD & scope-based line generation

## User Story
As a **coordinator**, I want to **create, edit, archive, and view activities and have factory tracking lines auto-generated from the chosen scope**, so that **every in-scope factory is tracked from day one**.

## Context
Implements the create/track core (§8.1) and FR-01/02/03 + AC-01/02. When an activity is created
with a scope rule (all factories / selected regions / selected countries / selected factories),
the system creates one ActivityFactoryStatus line per in-scope factory, each starting at
**Not Started / 0%** (unless explicitly marked Not Applicable).

## Current State Analysis
- Data layer (Story 002) provides Prisma models + status helpers.
- No API routes exist yet (template had none). Use Next.js route handlers under `app/api/`.
- Validation should be server-side (no auth, but still validate inputs).

### Existing Files Involved
| File Path | Relevance |
|-----------|-----------|
| `lib/db.ts` | Prisma client |
| `lib/activity-status.ts` | status enum/defaults |
| `prisma/schema.prisma` | models |

### Dependencies
- External: zod (validation) — confirm if already present, else add
- Internal modules: `@/lib/db`, `@/lib/activity-status`
- Stories this depends on: 001, 002

## Requirements

### Functional Requirements
- Create activity with: name, description, type, global owner, start date, target end date, scope rule.
- Scope selection: all factories / by region(s) / by country(ies) / specific factories.
- On create, generate one tracking line per in-scope factory (status NotStarted, progress 0).
- Edit activity metadata; archive activity; mark activity Completed (§8.4) once all in-scope
  lines are Finished or NotApplicable; completed/archived activities remain queryable.
- List + fetch single activity (with its lines) for downstream screens.

### Technical Requirements
- Route handlers: `GET/POST /api/activities`, `GET/PATCH /api/activities/[id]`,
  archive/complete actions; `GET /api/factories` for scope selection.
- Scope→line generation runs in a transaction.
- Zod schemas validate request bodies.

## Implementation Guide

### Files to Create
| File Path | Purpose |
|-----------|---------|
| `app/api/activities/route.ts` | list + create (with line generation) |
| `app/api/activities/[id]/route.ts` | get + patch + archive/complete |
| `app/api/factories/route.ts` | list factories for scope picker |
| `lib/activities.ts` | data-access + `generateLinesForScope(activity, scope)` |
| `lib/validation/activity.ts` | zod schemas |
| `app/dashboard/(auth)/<tracker>/activities/new/page.tsx` | Activity Creation form |
| `app/dashboard/(auth)/<tracker>/activities/new/activity-form.tsx` | form component |

### Files to Modify
| File Path | Changes |
|-----------|---------|
| sidebar nav (`nav-main.tsx`) | wire the "New activity" / Activities entries |

### Code References
- Reuse shadcn `form`, `input`, `select`, `textarea`, `date` components already in `components/ui`.
- Reuse `react-hook-form` + `@hookform/resolvers` (already in deps).

### Implementation Steps
1. `lib/activities.ts`: `createActivity`, `updateActivity`, `archiveActivity`,
   `completeActivity`, `getActivity`, `listActivities`, and `generateLinesForScope`.
2. Implement scope resolution: all → every factory; region/country → filtered; factories → explicit ids.
3. Route handlers with zod validation; line generation in a Prisma transaction.
4. Build the Activity Creation form (scope rule toggles which selector shows).
5. Wire success → redirect to the new activity's detail page (Story 005).

## Acceptance Criteria
- [x] AC-01 — User can create an activity and select factories in scope (all/region/country/specific).
- [x] AC-02 — System creates exactly one tracking line per in-scope factory at NotStarted/0%.
- [x] FR-01 — Activities can be created, edited, archived, viewed.
- [x] Completing an activity is allowed only when all in-scope lines are Finished/NotApplicable.
- [x] Server-side validation rejects invalid payloads.

## Testing Requirements

### Unit Tests
| Test File | What to Test |
|-----------|--------------|
| `lib/activities.test.ts` | `generateLinesForScope` for each scope rule; completion guard |

Scenarios:
- Success: scope=region EU → lines only for EU factories
- Error:   invalid type/scope payload rejected
- Edge:    scope matching 0 factories; duplicate factory ids ignored; all-NA completion

### E2E Tests
- Create activity flow → lands on detail page with generated lines (smoke).

## Out of Scope
- The matrix UI / per-line updates (Story 005).
- Blocker entry (Story 006).

## Quality Validation
- [x] All gates in `quality_gates` pass
- [x] Unit tests written (colocated per config)
- [x] Code review agent run on changed files
- [x] No new findings from `fallow`

## Open Questions
- Exact route base for the tracker section (resolve after Story 001 nav rework). Use a stable
  segment, e.g. `crm/` kept and renamed, or a new `activities/` segment.

## Assumptions
- Activity ID can be auto-generated (e.g. ACT-YYYY-NNN) or user-supplied; default auto.

## Work Log
- 2026-06-14 14:24 - Started implementation (story 003): Activity CRUD API + scope-based line generation + creation form
- 2026-06-14 14:35 - Built activity CRUD: lib/activities.ts + pure lib/activity-scope.ts (resolver+completion guard, 11 unit tests), zod validation, route handlers (/api/activities, [id], /api/factories), creation form. Added serverExternalPackages for better-sqlite3; schema archivedAt/completedAt
- 2026-06-14 14:35 - Runtime-verified via pnpm dev + curl: create scope=EU→201 (9 NotStarted lines), GET ok, invalid→400, completion guard→409, archive→200. All gates green (build/lint/tsc/test 25/fallow)
- 2026-06-14 14:41 - Code review fixes: accept empty-string dates (was blocking create), reject empty-scope with 422 (no zero-line activities), nextActivityCode count moved inside transaction. Runtime re-verified. All gates green. Completed
