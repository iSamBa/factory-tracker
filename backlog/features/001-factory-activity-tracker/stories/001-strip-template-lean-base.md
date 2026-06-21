---
id: 001
feature_id: 001
title: Strip template to lean tracker base
status: completed
created: 2026-06-14
updated: 2026-06-14
size: medium
---

# Story 001: Strip template to lean tracker base

## User Story
As a **developer**, I want to **remove every demo dashboard and unused asset from the template**, so that **the repo is lean and contains only Factory Activity Tracker code**.

## Context
The repo is the `shadcn-ui-kit-dashboard` template (Next.js app-router, no backend). It ships 19
demo dashboards under `app/dashboard/(auth)/` and a `(guest)` group with login/register/error
pages. We keep only the `crm/` route (reworked into the tracker in later stories) plus shared
infrastructure (`components/ui`, `components/layout`, `lib`). No authentication is needed (v1),
so the `(guest)` group is deleted entirely.

## Current State Analysis
- `app/dashboard/(auth)/` contains 19 route dirs; only `crm/` is kept.
- `app/dashboard/(guest)/` contains login v1/v2, register v1/v2, forgot-password, and 404/500
  error demo pages — all removable (no auth; `app/not-found.tsx` already exists at root).
- `components/layout/sidebar/nav-main.tsx` (~475 lines) hardcodes the full demo navigation tree
  and must be rewritten to the tracker's nav.
- `components/layout/sidebar/app-sidebar.tsx` shows the "Shadcn UI Kit" brand label.
- The root of the app redirects into one of the demo dashboards (likely `default`); this redirect
  must repoint to the tracker route.
- `fallow` is installed and configured (`fallow audit ...`) — use it to find orphaned components,
  hooks, and dependencies after the bulk deletion.

### Existing Files Involved
| File Path | Relevance |
|-----------|-----------|
| `app/dashboard/(auth)/` | 18 demo dirs to delete; keep `crm/`, `layout.tsx`, `error.tsx` |
| `app/dashboard/(guest)/` | Delete entire group (no auth) |
| `components/layout/sidebar/nav-main.tsx` | Rewrite nav to tracker-only entries |
| `components/layout/sidebar/app-sidebar.tsx` | Update brand label |
| `app/not-found.tsx`, `app/layout.tsx` | Keep |
| `components/ui/*`, `lib/*` | Keep (fallow will prune unused) |

### Dependencies
- External: `fallow` CLI (already installed)
- Internal modules: sidebar/layout components, root redirect
- Stories this depends on: none (first story)

## Requirements

### Functional Requirements
- Only `crm/` remains under `app/dashboard/(auth)/`; all other demo dashboards are gone.
- The `(guest)` group is removed; no login/register routes remain.
- Navigating to the app root lands on the tracker (no broken redirect).
- The sidebar shows only tracker navigation (placeholder entries are fine until later stories add
  the real routes: Overview, Activities, Blockers, Reporting).

### Technical Requirements
- After deletions, `pnpm build` and `pnpm lint` pass with no missing-module/broken-import errors.
- `fallow audit` reports no unused files/exports/deps that belong to deleted demos (auto-fix where safe).
- No dangling imports referencing deleted routes/components.

## Implementation Guide

### Files to Create
| File Path | Purpose |
|-----------|---------|
| (none required) | Cleanup story; route/page scaffolding comes in later stories |

### Files to Modify
| File Path | Changes |
|-----------|---------|
| `components/layout/sidebar/nav-main.tsx` | Replace demo nav tree with tracker nav (placeholder links ok) |
| `components/layout/sidebar/app-sidebar.tsx` | Update brand label to "Factory Activity Tracker" |
| root redirect (locate: `next.config`, `app/page.tsx`, or middleware) | Point to the tracker route |
| `package.json` | Remove deps that fallow flags as unused after deletions |

### Code References
- Sidebar nav data structure lives in `nav-main.tsx`; mirror its existing item shape.
- Brand label is in `app-sidebar.tsx` SidebarHeader (`<span>Shadcn UI Kit</span>`).

### Implementation Steps
1. Delete the 18 demo dirs under `app/dashboard/(auth)/`: academy, apps, crypto, default,
   ecommerce, file-manager, finance, hospital-management, hotel, logistics, pages, payment,
   project-list, project-management, real-estate, sales, website-analytics, widgets. Keep `crm/`.
2. Delete `app/dashboard/(guest)/` entirely.
3. Locate and fix the app's entry redirect so the root resolves to the tracker (kept `crm/` route).
4. Rewrite `nav-main.tsx` to a minimal tracker nav (Overview, Activities, Blockers, Reporting —
   placeholders pointing at the kept route until later stories wire real pages).
5. Update the brand label in `app-sidebar.tsx`.
6. Run `fallow audit` (auto-fix safe items); remove orphaned components/hooks and unused deps it
   reports that originated from the deleted demos. Be conservative with shared `components/ui`.
7. Run `pnpm build` and `pnpm lint`; fix any broken imports.

## Acceptance Criteria
- [x] Only `crm/` remains under `app/dashboard/(auth)/`; `(guest)` group removed.
- [x] App root loads the tracker with no broken redirect.
- [x] Sidebar shows tracker-only navigation and updated brand.
- [x] `pnpm build` and `pnpm lint` pass.
- [x] `fallow audit` shows no orphans attributable to deleted demos.

## Testing Requirements

### Unit Tests
| Test File | What to Test |
|-----------|--------------|
| (n/a) | Cleanup story — verification is build/lint/fallow, not unit tests |

Scenarios:
- Success: build + lint + fallow clean after deletions
- Error:   no broken imports / missing modules
- Edge:    shared `components/ui` primitives still used by `crm/` are not deleted

### E2E Tests
None (covered by manual smoke run + build).

## Out of Scope
- Building the tracker screens (later stories).
- Adding the database (Story 002).

## Quality Validation
- [x] All gates in `quality_gates` pass (build, lint, typecheck, fallow)
- [x] Unit tests written (n/a for this story)
- [x] Code review agent run on changed files
- [x] No new findings from `fallow`

## Open Questions
- Confirm the exact root-redirect mechanism (locate during implementation: `app/page.tsx` vs
  middleware vs `next.config`).

## Assumptions
- Deleting `(guest)` is safe because v1 has no authentication.
- `components/ui/*` primitives are largely shared and should be kept unless fallow proves unused.

## Work Log
<!-- Append entries as: `- YYYY-MM-DD HH:MM - <one-line summary>` -->
- 2026-06-14 13:40 - Started implementation; branched feature/001-factory-activity-tracker from main, carried existing template-strip work over, removed stray npm package-lock.json
- 2026-06-14 13:41 - Quality gates passed: pnpm build, pnpm lint, tsc --noEmit (test/e2e not configured)
- 2026-06-14 13:45 - Removed 7 demo-attributable deps (radix-popover, react-use-controllable-state, usehooks, marked, react-markdown, remark-gfm, shiki) + orphaned lib/compose-refs.ts; pnpm install pruned 114 pkgs; build/lint/fallow re-pass
- 2026-06-14 13:45 - fallow verdict: pass (0 errors). Residual 3 are introduced:false/pre-existing: eslint-config-next (false positive via FlatCompat), eslint-plugin-better-tailwindcss, dotenv (needed by Story 002) — out of this story's scope
- 2026-06-14 13:51 - Code review (feature-dev:code-reviewer): removed dead barrel app/dashboard/(auth)/crm/components/index.ts (unused, contradicts no-barrel convention). isMobile/isTablet confirmed used; nav placeholder hrefs are by-design per story
- 2026-06-14 13:52 - Implementation completed; all 5 acceptance criteria met, all gates green (build/lint/tsc/fallow), code review addressed
- 2026-06-14 13:55 - Removed 12 orphaned public/images/avatars/*.png (kept code uses pravatar.cc URLs per ceb26cc; unreferenced) and amended commit
