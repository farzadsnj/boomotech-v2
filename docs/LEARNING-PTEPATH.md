# BoomoTech Learning and PTEpath

Last reviewed: 8 November 2026

This document supersedes the earlier marketing-template, browser-local and fixed 20-day PTE implementation direction. The current implementation integrates the original PTEpath visual template at `/learning/pte-academic`, reuses the existing BoomoTech identity, and stores durable learning records in PostgreSQL.

## Routes and shell

- `/learning` is the BoomoTech Learning discovery hub.
- `/learning/pte-academic` is the PTEpath dashboard and honest guest preview.
- `/learning/pte-academic/practice`, `/mistakes`, `/grammar`, `/progress`, `/plan` and `/settings` are deep-linkable PTEpath views.
- `/api/learning/pte/*` is the private, namespaced data boundary.

The `(site)` route group owns the marketing header, footer, chatbot and site styles. The `(pte)` route group owns the white-sidebar/pale-blue PTEpath shell and isolated CSS. Route groups do not change URLs. The PTE route does not use an iframe, external redirect, second `html`/`body` or a client-side pathname trick.

## Shared account and safe return flow

Guests may inspect the PTEpath shell. Saving a plan or starting personal practice uses existing `/login` and `/register` pages with a validated PTE return intent. `src/lib/auth/return-path.ts` allows only `/learning/pte-academic` and its nested views; external origins, protocol-relative paths, encoded paths, fragments, backslashes and authentication loops are rejected. The destination is revalidated in registration, login, verification/resend and recovery paths. Default non-PTE customer login and administrator routing remain unchanged.

Verified sessions provide immutable `user.id`, name and email. The application never authorises from a URL user ID, email match, display name, legacy `pte_learner` cookie or browser-stored token. Administrators retain existing role/MFA behaviour. Account edits link back to the existing customer settings area.

## Learning schema and migration

Generated migration `drizzle/0009_wandering_vapor.sql` adds:

- `pte_learning_profile` for onboarding and current plan revision;
- `pte_plan_day` for revisioned daily work;
- `pte_attempt` for immutable, idempotent submissions;
- `pte_draft` for versioned writing drafts and timer state;
- `pte_mistake` for retained review history;
- `pte_manual_score` for learner-labelled official/mock results.

All tables reference Better Auth `user.id` with cascade deletion and ownership indexes. Attempt uniqueness is `(user_id, idempotency_key)`; drafts are unique per `(user_id, exercise_id)` and require an expected version. API mutations use the existing approved-origin check, bounded JSON reader and database rate-limit table. Private API responses use `private, no-store` and `X-Robots-Tag: noindex`.

The migration is additive but still acquires normal PostgreSQL DDL locks while creating tables, foreign keys and indexes. It must be reviewed, backed up and applied in an owner-approved maintenance window. This task does not execute it against production. Rollback is data-destructive because dropping these tables removes learning history; prefer forward correction unless the owner explicitly approves deletion.

## Onboarding and plan behaviour

Onboarding records start date, optional estimated exam date, preparation study days, daily minutes, available weekdays, preferred local time/timezone, optional target and prior Reading/Writing scores, current level and Persian-help preference. It supports 1–730 study days rather than a hardcoded 20-day programme. Saving an incomplete onboarding draft does not create a plan; completion creates a new revision. Future replanning retains attempts, drafts, mistakes and older plan revisions.

Plans use only IDs from the current exercise bank. They include baseline, guided, timed, spaced-review and final-revision phases, repeat available exercises deliberately, and weight future ordering toward weaker task types when real attempts exist. Dates are represented as local calendar dates to avoid UTC day shifts. A short timeframe is described as tight guidance, not a result guarantee or booked exam.

## Content inventory and official sources

Current original content:

- 10 Fill in the Blanks (Drag and Drop) exercises;
- 10 Fill in the Blanks (Dropdown) exercises, retaining the familiar Reading and Writing alias for navigation;
- 10 Reorder Paragraph exercises;
- 10 Multiple Choice, Single Answer exercises;
- 10 Multiple Choice, Multiple Answers exercises;
- 10 Summarise Written Text exercises with complete model responses;
- 10 Write Essay prompts with 200–300-word model essays;
- 24 grammar/cohesion/strategy lessons;
- 150 contextual academic collocations with Persian meanings.

Official rules were reviewed on 8 November 2026 from:

- https://www.pearsonpte.com/pte-academic/test-format/reading/
- https://www.pearsonpte.com/pte-academic/test-format/speaking-writing/
- https://www.pearsonpte.com/content/dam/ELL/pte/pearsonpte/resources/PTE-Academic-Test-Taker-Score-Guide.pdf

Pearson's Reading overview says one fill-in task is integrated, while the detailed Dropdown section and current Score Guide list Reading only. PTEpath records that wording conflict and does not infer a Writing contribution. Format and score-guide wording must be reviewed periodically.

## Scoring and timer boundaries

PTEpath reports app-calculated Reading correctness only. Reorder Paragraph uses transparent correct adjacent pairs. Multiple Choice, Multiple Answers applies correct selections minus incorrect selections with a minimum of zero. Writing displays word/sentence form checks and learner self-review separately. Manually entered results retain their learner-supplied source. No practice percentage becomes a PTE score, prediction or 10–90 band.

Writing timers use deadline plus elapsed state so backgrounding and reload do not silently restart time. Pausing is an app practice feature. Reading practice times are app defaults because Pearson uses the Reading section clock rather than separate item limits. Drafts remain available if time expires.

## Export, reset and privacy

Study settings can download a versioned JSON export for the authenticated account and can reset only that account's PTEpath domain after explicit confirmation. The export contains private learning data and must be handled accordingly. No silent legacy-cookie import or email/display-name merge exists. Essays and answers are excluded from public search, service-chat context, analytics, logs and URLs.

An owner-approved retention/deletion policy is still required. Database backups may retain deleted records until their normal protected rotation expires. Speaking/Listening, automated AI grading, Pearson endorsement and complete four-skill preparation are outside this milestone.

## Local verification

Generate types and run the focused checks with:

```bash
pnpm typecheck
pnpm test -- src/features/pte src/lib/auth/return-path.test.ts
```

The full repository gate remains `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:security`, `pnpm build`, `pnpm security:client-bundle` and `pnpm test:e2e`. Use only an isolated test database and captured test email. Do not apply migration `0009` to production without a reviewed release window.
