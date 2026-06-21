---
id: 001
name: Factory Activity Tracker
status: pending
created: 2026-06-14
updated: 2026-06-14
---

# Factory Activity Tracker

## Description
An activity-centric tracking application built on the (stripped-down) shadcn-ui-kit-dashboard
template. The **primary object is the Activity** (a technical rollout, migration, onboarding,
compliance task, service enablement, or operational campaign). A **Factory** is a tracking
point *inside* an activity, not the primary object. The central question the app answers is:
*"For this activity, where are we across all ~22 factories?"*

The key record is the **Activity-Factory-Status** line — one per (activity × in-scope factory) —
auto-generated when an activity is created with a scope of all / selected regions / selected
countries / selected factories. The same factory appears in many activities with independent
status, progress, owner, blocker, and due date.

Source: "Factory Activity Tracking Requirements v2" (activity-centric). Targets ~22 factories
and 20+ active activities.

## Goals
- Strip the template down to a lean codebase containing only tracker-related code (the CRM
  section is reworked into the tracker; all other demo dashboards and the guest/auth pages are removed).
- Persist data in a local **SQLite** database via Prisma (the template has no backend today).
- Provide the seven required screens (§7): Activity Overview, Activity Detail + Factory Rollout
  Matrix, Update Factory Status dialog, Blocker Overview, Reporting, Activity Creation.
- Implement the full status→progress model (§6) and overall-progress calculation that excludes
  Not Applicable lines.
- Provide full reporting (§11 / FR-13) and CSV/Excel export (FR-12).

## Acceptance Criteria
Mirrors the requirements' §12 acceptance criteria (AC-01…08):

- [ ] AC-01 — A user can create an activity and select factories in scope.
- [ ] AC-02 — The system creates one tracking line per selected factory.
- [ ] AC-03 — A user can open an activity and see the status of all selected factories in one table.
- [ ] AC-04 — A user can update status, progress, responsible, blocker, next action, due date, and comment for a factory line.
- [ ] AC-05 — The system calculates and displays overall activity progress (NA lines excluded).
- [ ] AC-06 — A user can filter one activity by region, country, status, blocker, and responsible person.
- [ ] AC-07 — A user can see all blockers across all activities in one overview.
- [ ] AC-08 — A user can export an activity tracking matrix to Excel or CSV.

## Open Questions
- **Real factory list:** The doc names ~22 factories but lists only a handful (Nuremberg, Lyon,
  Detroit, Suzhou). Decision (2026-06-14): seed ~22 realistic placeholders across EU/CN/US now;
  user will provide the authoritative list later (update the seed when received).

## Assumptions
- **No authentication / RBAC in v1** — confirmed against the doc; the only access-control mention
  (§13 "Role-based access control and permissions") is explicitly a later enhancement. Single
  shared app, no login. The template's `(guest)` login/register pages are removed.
- **One standard field set** — per-activity-type custom fields (VM count, assessed/migrated VMs,
  prerequisite status from the §9 use cases) are "custom templates" → deferred (§13).
- **Milestones included** — listed in §3; user decided (2026-06-14) to include a milestone entity
  per activity in v1 even though no acceptance criterion requires it.
- Deferred (§13): notifications, external integrations, automated progress from external sources,
  bulk Excel import, custom templates.
- Stack: Next.js (app router) + TypeScript + Tailwind + shadcn/ui + @tanstack/react-table +
  recharts; package manager pnpm; data via Prisma + SQLite + Next.js route handlers.

## Definition of Done

A story is done when all of the following hold:

1. All acceptance criteria are met
2. All quality gates declared in `.claude/feature-config.yml` pass
3. Unit tests written and passing for new code
4. Code review completed (no outstanding high-priority findings)
5. No regressions in existing functionality

See [quality-checklist.md](quality-checklist.md) for the project-agnostic skeleton. Project-specific rules live in `CLAUDE.md`.

## Progress Summary

| Status      | Count |
|-------------|-------|
| Pending     | 4 |
| In Progress | 0 |
| Completed   | 4 |

## User Stories

| ID  | Title                                          | Size   | Status  | Maps to |
|-----|------------------------------------------------|--------|---------|---------|
| 001 | Strip template to lean tracker base            | medium | completed | repo cleanup |
| 002 | SQLite + Prisma data layer & seed              | medium | completed | §3–§6 data model |
| 003 | Activity CRUD & scope-based line generation    | large  | completed | FR-01/02/03, AC-01/02 |
| 004 | Activity Overview Dashboard & counters         | medium | completed | §7, FR-13, AC-03(entry) |
| 005 | Activity Detail: rollout matrix & update flow  | large  | pending | FR-04/05/06/07/09/10/11, AC-03/04/05/06 |
| 006 | Blocker management & cross-activity overview    | medium | pending | FR-08, §8.3, AC-07 |
| 007 | Reporting views & CSV/Excel export             | medium | pending | §11, FR-12/13, AC-08 |
| 008 | Production Readiness Verification              | medium | pending | feature-wide |
