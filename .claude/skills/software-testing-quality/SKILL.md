---
name: software-testing-quality
description: Use when the user asks to test software, prevent bugs, fix bugs safely, add regression tests, improve quality gates, design test strategy, verify a code change, increase coverage, or make a feature more reliable across unit, integration, end-to-end, CI, and manual QA checks.
---

# Software Testing Quality

Use this skill to turn coding work into a tested, evidence-backed change. It cannot guarantee zero bugs; it reduces risk by forcing reproduction, focused test design, regression checks, and honest reporting.

## Core Workflow

1. Identify the behavior under test from the user's request, issue, failing output, or surrounding code.
2. For bugs, reproduce the failure before changing code whenever feasible. Capture the exact command, input, route, fixture, or UI path.
3. Choose the smallest useful test layer:
   - Unit tests for pure functions, validators, parsing, formatting, reducers, utilities, and deterministic business rules.
   - Integration tests for database access, API handlers, service wiring, dependency injection, file I/O, queues, auth boundaries, and framework behavior.
   - End-to-end or browser tests for user-visible workflows, navigation, forms, visual state, uploads, downloads, and cross-page behavior.
   - Contract tests for public APIs, schemas, webhooks, generated clients, and provider integrations.
   - Snapshot or golden tests only when the output is stable and reviewable.
4. Add or update a regression test that fails on the original bug and passes after the fix. If a failing-before-passing proof is not practical, explain why.
5. Make the smallest code change that satisfies the test and preserves existing behavior.
6. Run targeted checks first, then broaden validation based on blast radius:
   - Direct test file or test name.
   - Related package/module test suite.
   - Lint, typecheck, build, or format checks when the repo has them.
   - Existing full test suite when the change touches shared behavior or core flows.
7. Investigate failures instead of hiding them. Do not delete, skip, loosen, or rewrite tests merely to make a run green unless the user explicitly asks and the reason is documented.
8. Report what was run, what passed, what failed, and what remains unverified.

## Test Design Rules

- Prefer behavior assertions over implementation details.
- Cover at least one success path and the most relevant failure or edge path when the code is risk-bearing.
- Include boundary values for ranges, empty inputs, null or missing fields, permissions, time zones, concurrency, retries, idempotency, and malformed external data when relevant.
- Keep tests deterministic: avoid real clocks, random values, network calls, and shared global state unless explicitly controlled.
- Name tests by expected behavior, not by internal method names only.
- Keep fixtures small and local to the test unless the repo already has a fixture convention.
- When a repo has established test helpers, factories, builders, or mock servers, reuse them instead of inventing new infrastructure.

## Frontend And UI Verification

- For browser-visible behavior, use the installed `playwright` or `playwright-interactive` skill when a real browser check is useful.
- Verify the actual user flow, not only component rendering.
- Check desktop and mobile viewports when layout, responsive behavior, overflow, or interaction density could be affected.
- For visual changes, capture screenshots or inspect the page in a browser when feasible, and mention any unverified visual risk.

## CI And Production Signals

- Use `gh-fix-ci` when the user explicitly asks to debug failing GitHub Actions checks.
- Use `sentry` when the user asks about production errors, recent crashes, or live issue evidence.
- Treat CI failures as first-class evidence. Read logs, identify the failing command and stack trace, then reproduce locally if feasible.

## Security And Reliability

- Use `security-best-practices` only when the user explicitly asks for security review or secure-by-default guidance.
- For reliability-sensitive changes, consider retries, timeout behavior, cancellation, duplicate submissions, partial failure, logging, and observability.
- Do not claim a change is bug-free. Say it is covered by the checks that were actually run.

## Final Response Contract

When this skill is used after implementation, include:

- The tests or checks run, with pass/fail status.
- The main behavior now covered.
- Any checks that could not be run and the remaining risk.
