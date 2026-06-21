# Quality Checklist

Project-agnostic skeleton. Stack-specific rules belong in `CLAUDE.md`.

## Pre-Implementation
- [ ] Existing patterns read and understood (existing CRM/table components, shadcn/ui primitives)
- [ ] Reusable utilities/components identified before writing new ones
- [ ] No duplicate functionality elsewhere in the codebase

## Code Quality
- [ ] Single responsibility per function/component
- [ ] No dead code, no commented-out code, no unused imports
- [ ] Descriptive names; no magic numbers/strings
- [ ] Comments explain "why", not "what"
- [ ] No TODO comments left behind

## Type Safety / Static Analysis
- [ ] Type errors resolved (`pnpm exec tsc --noEmit`); no escape hatches without justification
- [ ] Linter passes (`pnpm lint`)
- [ ] Public APIs have explicit type annotations

## Error Handling
- [ ] Errors handled at the appropriate boundary
- [ ] User-facing messages are friendly (no stack traces)
- [ ] Edge cases considered (empty scope, all-NA activity, 0 factories in scope)

## Security
- [ ] No secrets in code or logs
- [ ] Input validated server-side in route handlers (don't trust the client)
- [ ] Progress %, status enum, and scope inputs validated before persistence

## Testing
- [ ] Unit tests for all new public functions/components (progress calc, scope→line generation)
- [ ] Tests follow the project's colocation rule (see `feature-config.yml`)
- [ ] Success, error, and edge cases covered
- [ ] All tests pass

## Quality Gates
Run every command in `quality_gates` from `.claude/feature-config.yml` (build, lint, typecheck, fallow). All must pass.

## Code Review
- [ ] Code-reviewer agent run on changed files
- [ ] All high-priority findings addressed
