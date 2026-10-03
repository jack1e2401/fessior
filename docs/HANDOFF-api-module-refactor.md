# Handoff: API Module Boundary Refactor

You are continuing work in `D:\.Learn\SWE\fessior`.

## Current state

- Current branch: `main`.
- Current HEAD: `1c50800 refactor: consolidate online judge workspaces`.
- That commit already changed the monorepo to `apps/api`, `apps/judge-worker`, `apps/web`, `packages/contracts`, `packages/executor`, and `infra`.
- Working tree contains one uncommitted planning directory: `docs/superpowers/`.
- Do not discard or overwrite existing uncommitted files.
- Do not commit unless the user explicitly asks after reviewing the completed refactor.

Read these files first:

1. `AGENTS.md`
2. `docs/superpowers/plans/2026-10-03-api-module-boundaries.md`
3. `C:\Users\ACER\.codex\attachments\501d5f12-a8ad-4f08-ba4b-5f106b58e20e\Pasted text.txt`

The plan has already been audited against the current implementation. Execute it natively, task by task, and keep its checkboxes current.

## Objective

Perform one structural refactor pass before implementing TestcaseSet or ZIP ingestion. Keep the API as a modular monolith with vertical feature modules:

```text
apps/api/src/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── problems/
│   ├── testcases/
│   ├── submissions/
│   └── matches/
├── realtime/
├── config/
├── middlewares/
├── errors/
├── app.ts
└── server.ts
```

Each module should remain flat unless a genuinely complex sub-feature later requires a directory. The intended dependency direction is:

```text
route/controller/socket/subscriber -> service -> repository -> Prisma
```

Transport code may parse input, authenticate, call a service, and serialize or emit output. It must not query Prisma or contain match business decisions. Services must not query Prisma directly. Repositories contain persistence operations without business policy.

## Required changes

1. Split the current `modules/auth` bucket into `auth` and `users`.
   - Keep authentication, sessions, JWT, password, and password-reset email under auth.
   - Move user route/controller/service/repository/schema and avatar integration under users.
   - Preserve behavior; feature cutting is outside this pass.

2. Rename Zod files from `*.validator.ts` to `*.schema.ts`.
   - Rename `jwt.util.ts` to `jwt.ts`, `password.util.ts` to `password.ts`, and `shared-validators.ts` to a clear auth-local name.
   - Keep exported symbol names stable unless a rename is necessary for consistency.

3. Make testcases own their HTTP routes.
   - Remove testcase route declarations and imports from `problem.route.ts`.
   - Add `testcase.route.ts` using `Router({ mergeParams: true })`.
   - Preserve the existing public URLs exactly:
     - `POST /api/v1/problems/:problemId/testcases`
     - `GET /api/v1/problems/:problemId/testcases`
     - `DELETE /api/v1/problems/testcases/:testcaseId`

4. Enforce repository boundaries.
   - `problem.service.ts` and `user.service.ts` currently query Prisma directly; move those operations into their repositories.
   - Create `submission.repository.ts` and move all persistent submission/problem/testcase queries out of `submission.service.ts`.
   - Keep business validation, authorization decisions, queue orchestration, pagination mapping, and DTO shaping in services.
   - Move temporary `runCode()` execution into `execution-preview.service.ts` and preserve the `/submissions/run` endpoint.

5. Refactor matches.
   - Rename `match_history.*` to `match.*`; history is only one match query.
   - Move in-memory queue and pairing logic from `src/realtime/matchmaking.ts` to `modules/matches/matchmaking.service.ts`.
   - Move match creation, verdict handling, finish/forfeit logic, and ELO orchestration into match services and repositories.
   - Add `modules/matches/match.socket.ts` as the thin Socket.io handler adapter.
   - Replace realtime files with only:
     - `realtime/socket.server.ts`
     - `realtime/submission-updates.subscriber.ts`
   - Preserve the current in-memory queue and transaction behavior. Redis matchmaking and atomic first-AC winner changes belong to later phases.

6. Update docs and all code references after moves.

## Explicitly out of scope

Do not implement any of these in this pass:

- TestcaseSet or schema migrations
- ZIP testcase ingestion
- Redis-backed matchmaking
- Atomic first-AC winner/ELO hardening
- Submission reconciliation or state-machine hardening
- Judge0/sandbox hardening
- New frameworks, dependency injection, ports/adapters, or Clean Architecture layers
- Feature removal beyond what is already present at HEAD

## Behavior invariants

- Preserve all HTTP paths and response shapes.
- Preserve Socket.io event names, room names, authentication flow, and payload shapes.
- Preserve BullMQ submission job behavior.
- Preserve ownership checks, pagination, filtering, ordering, and Prisma selections/includes.
- If match creation fails, both players must still be returned to the in-memory queue.
- Redis Pub/Sub remains best effort and continues forwarding submission updates to the same match room.
- Avoid schema/database changes in this structural pass.

## Known findings and environment limits

- `apps/api/src/realtime/socket.ts` currently queries Prisma when a player joins the queue.
- `apps/api/src/realtime/matchmaking.ts` currently contains queue selection, match creation, verdict handling, participant updates, match completion, ELO, and forfeit logic.
- `apps/api/src/modules/submissions/submission.service.ts` currently queries Prisma and directly calls the executor.
- `apps/api/src/modules/problems/problem.service.ts` and `apps/api/src/modules/auth/user.service.ts` also query Prisma directly.
- Existing API integration tests require MySQL on `localhost:3307`; previous runs failed because MySQL was unavailable.
- Docker daemon was unavailable during the previous session. `docker compose -f infra/docker-compose.yml config --quiet` did pass.
- Root workspace build passed for all five workspaces after commit `1c50800`.
- API lint currently fails before checking code because ESLint 10 does not load the legacy `.eslintrc`; do not expand this structural pass into an ESLint migration unless required by the user.

## Verification

At each task boundary, run the narrow API build/tests first. At the end run:

```powershell
node node_modules/turbo/bin/turbo run build
node node_modules/jest/bin/jest.js --config apps/api/jest.config.ts --runInBand
docker compose -f infra/docker-compose.yml config --quiet
rg -n "match_history|\.validator|jwt\.util|password\.util|realtime/matchmaking|realtime/socket" apps/api/src apps/api/swagger.ts docs
rg -n "prisma\.|from .*config/prisma" apps/api/src/modules apps/api/src/realtime
git diff --check
git status --short
```

Treat MySQL/Docker connectivity failures as environment limitations only after verifying the failure is connectivity-related. Report actual command output and do not claim tests passed when infrastructure was unavailable.

Before handing back to the user, report:

- files/modules changed;
- how each boundary now works;
- tests/build/lint results and limitations;
- remaining direct Prisma access and why it is acceptable;
- confirmation that changes remain uncommitted unless the user requested a commit.
