---
id: 008
feature_id: 001
title: Production Readiness Verification
status: pending
created: 2026-06-14
updated: 2026-06-14
size: medium
---

# Story 008: Production Readiness Verification

## User Story
As a **developer**, I want to verify the entire feature is production-ready, so that we ship a polished, bug-free Factory Activity Tracker.

## Context
This is the final story for the feature. All implementation stories (001–007) must be completed
before this one begins. The implementing command runs every `quality_gates` entry from
`.claude/feature-config.yml` and a code review pass on all files changed in this feature's branch.

## Dependencies
All previous stories (001–007) must be `completed`.

## Phase 1 — Quality Gates (always)
Run every command in `quality_gates` (`pnpm build`, `pnpm lint`, `pnpm exec tsc --noEmit`, and
`fallow audit ...`). Each must pass. (No test/e2e commands are configured; run colocated unit
tests added in stories via the runner used by those tests.)

- [ ] All gates pass (build, lint, typecheck, fallow)
- [ ] Colocated unit tests pass
- [ ] Code-reviewer agent run on the diff vs `main`; high-priority findings addressed
- [ ] No new fallow findings
- [ ] Manual end-to-end run of the full flow: create activity → lines generated → update lines →
      blocker raised + appears in overview → reporting + export
- [ ] No console / runtime errors introduced

## Phase 2 — UI/UX Review

(Included because `final_story.ui_review: auto` and this feature touches UI files.)

- [ ] Visual consistency with the shadcn/ui design system (cards, tables, dialogs, badges)
- [ ] Responsive at the project's target breakpoints (sidebar collapse, matrix horizontal scroll)
- [ ] Loading, error, and empty states implemented (no activities, no blockers, empty scope)
- [ ] Accessibility: keyboard navigation, labels, focus states, contrast (dialogs + tables)
- [ ] Dark mode works (template ships a theme system)

## Feature-Level Acceptance (walk through `feature.md` AC-01…08)
- [ ] AC-01 create activity + select scope
- [ ] AC-02 one line per selected factory
- [ ] AC-03 activity table shows all selected factories
- [ ] AC-04 update status/progress/responsible/blocker/next action/due date/comment
- [ ] AC-05 overall progress calculated (NA excluded)
- [ ] AC-06 filter by region/country/status/blocker/responsible
- [ ] AC-07 all blockers in one cross-activity overview
- [ ] AC-08 export activity matrix to Excel/CSV

## Acceptance Criteria
- [ ] Phase 1 fully passes
- [ ] Phase 2 fully passes
- [ ] Feature-level acceptance criteria in `feature.md` are walked through and checked off

## Work Log
