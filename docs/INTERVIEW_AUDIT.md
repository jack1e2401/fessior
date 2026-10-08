# Fessior Interview Readiness Audit

**Review date:** 2026-10-08  
**Scope:** Read-only audit of the four requested flows, their tests, schema, runtime configuration, and the requested project docs. No code was changed and no test/build command was run. Findings below describe the repository as inspected; documentation claims are checked against source where practical.

## Executive summary

The four core flows are present and have meaningful integration or unit coverage. The strongest demonstrated invariants are testcase version pinning and import rollback, guarded submission terminal writes with a recovery scan, Judge0 resource request configuration with a fixture matrix, and compare-and-set match settlement with race tests.

The main gaps for an interview explanation are narrower than the docs imply: API operations and realtime authorization do not consistently recheck account/role status; a claimed `PROCESSING` submission has no database watchdog; testcase and match integrity relies partly on application code rather than relational constraints; the match has no submission deadline; MLE is diagnostic-text inference; and aggregate memory/network guarantees are limited to the configured Judge0/isolate behavior and observed fixtures. `docs/sandbox-security.md` directly contradicts the later judging documentation and current configuration. Phase 7 polish is incomplete: no API health/readiness endpoint or graceful shutdown is visible, and logs are unstructured.

## FLOW 1 — Secure testcase ingestion and versioning

### 1. Purpose

An authenticated administrator uploads a ZIP. The API checks its structure and text before opening a database transaction, creates a new immutable `TestcaseSet`, and switches the problem's active pointer. New submissions pin that set; old submissions keep their original set.

### 2. Entry point

- Mount: `apps/api/src/app.ts` mounts `testcaseSetRouter` under `/api/v1/problems/:problemId/testcase-sets`.
- Route: `apps/api/src/modules/testcases/testcase.route.ts` registers `POST /import` behind `requireAuth` and `requireAdmin`.
- Controller: `TestcaseController.importArchive` wraps the request in `withUploadedArchive` and calls the service.

### 3. End-to-end call graph

```text
POST /api/v1/problems/:problemId/testcase-sets/import
  -> requireAuth -> requireAdmin
  -> TestcaseController.importArchive
  -> withUploadedArchive (Busboy stream -> temporary archive.zip + SHA-256)
  -> TestcaseService.importArchive
  -> parseTestcaseArchive (lazy yauzl reads; no extraction)
  -> problemRepository.getProblemBySlug (ID-or-slug lookup)
  -> TestcaseRepository.importSet
     -> serializable Prisma transaction
        -> read Problem.active_testcase_set_id / latest version
        -> create TestcaseSet + ordered Testcase rows
        -> CAS update Problem.active_testcase_set_id
        -> commit
```

Submission pinning occurs separately in `SubmissionRepository.createPendingSubmissionForActiveSet`: it selects `Problem.active_testcase_set_id` and creates the `PENDING` row with that `testcase_set_id` inside one transaction. `JudgingContextRepository.findTestcasesBySetId` later queries the pinned set, never the current active pointer.

### 4. Important files

- `apps/api/src/modules/testcases/testcase.route.ts`
- `apps/api/src/modules/testcases/testcase.controller.ts`
- `apps/api/src/modules/testcases/ingestion/archive-upload.ts`
- `apps/api/src/modules/testcases/ingestion/archive-parser.ts`
- `apps/api/src/modules/testcases/ingestion/manifest.schema.ts`
- `apps/api/src/modules/testcases/ingestion/archive-limits.ts`
- `apps/api/src/modules/testcases/testcase.service.ts`
- `apps/api/src/modules/testcases/testcase.repository.ts`
- `apps/api/src/modules/submissions/submission.repository.ts`
- `apps/judge-worker/src/submissions/judging-context.repository.ts`
- `apps/api/prisma/schema.prisma` (`Problem`, `TestcaseSet`, `Testcase`, `Submission`)

### 5. Database operations

- The transaction reads the problem's active set, checks that the referenced set belongs to the same problem, obtains `MAX(version)+1`, inserts the set and all cases, then changes the active pointer.
- The `Problem` active pointer is unique and references `TestcaseSet`; `(problem_id, version)` and `(testcase_set_id, position)` are unique.
- Manual add/delete operations also create and activate a copied set instead of mutating an existing version. Those manually-created sets have a null checksum.
- `Submission.testcase_set_id` is required and has `onDelete: Restrict`, retaining old case data while submissions reference it.

### 6. Redis/BullMQ/Socket/Judge0 interactions

None during import. The request does not put archive bytes on a queue. The worker later reads MySQL rows from the pinned set.

### 7. State transitions

There is no testcase-set status enum. A version becomes current when the `Problem.active_testcase_set_id` pointer changes. The import response reports `active: true`; historical sets remain queryable to the worker through old submission pins. Public testcase GET is restricted to examples for non-admin users; admins can read all cases in the active set.

### 8. Transactions / atomic operations

`TestcaseRepository.importSet` uses a serializable transaction, with a compare-and-set update whose predicate includes the previously-read active-set ID. Version uniqueness and transaction conflicts are retried up to three times; exhaustion becomes 409. This makes set creation and activation atomic. Submission pinning is also atomic with submission creation.

### 9. Failure scenarios

- Invalid content type/multipart shape or missing/multiple archive parts: rejected before service import.
- Upload larger than compressed limit: transform rejects while streaming; route returns 413.
- Invalid archive, manifest, UTF-8, missing pair, unsafe entry, or resource limit: parser rejects before the DB transaction.
- Unknown problem: 404 after parsing; no set is created.
- DB insert or activation failure: transaction rolls back; temp directory is removed in `finally`.
- Concurrent imports/edits: conditional pointer update or unique version conflict retries, then returns 409.

### 10. Concurrency / idempotency guarantees

- Same ZIP bytes are not deduplicated: re-import creates a new version.
- Concurrent activations cannot silently replace a newer active pointer because of the CAS predicate and serializable isolation. Retry handling is bounded.
- Historical submission versions remain pinned.
- No archive data is extracted to a user-derived filesystem path, which removes the normal ZIP Slip write primitive. Path validation still rejects traversal and absolute paths as defense in depth.

### 11. Tests proving the guarantees

- `apps/api/src/modules/testcases/__tests__/archive-parser.test.ts`: canonical parsing/order, UTF-8, malformed manifest, missing/unexpected entries, traversal, absolute/backslash paths, duplicate entries/IDs, depth, symlink/encrypted/reparse entries, compression ratio, file/entry/total limits.
- `apps/api/src/tests/testcase-import.test.ts`: admin authorization, multipart shape, streaming compressed limit, temp cleanup, secrecy, version activation, old submission pin, malformed/malicious archive cleanup, DB failure cleanup, concurrent imports and rollback on testcase insertion failure.
- `apps/api/src/tests/testcase-versioning.test.ts`: pinning, immutable old cases, unique versions, activation rollback and foreign-set rejection.

### 12. Known limitations

- Limits are 25 MiB compressed, 100 MiB declared/observed aggregate uncompressed, 60 KiB per file (including manifest), 500 entries, 200 cases, path depth 3, ratio 100:1 (`archive-limits.ts`). The per-file limit fits MySQL `TEXT` byte capacity. It intentionally excludes large/binary datasets.
- Testcase payloads are stored as MySQL `TEXT`; large datasets would require a different storage model, which is outside this scope.
- Checksum is of the compressed ZIP, not normalized manifest/cases; checksum dedupe is absent.
- The DB does not express a composite FK proving `Problem.active_testcase_set_id` points to a set with the same `problem_id`; repository checks enforce ownership on the active set and imports.
- API admin authorization uses the JWT role claim. `requireAuth` reloads account existence/ban status but not current role, so role changes may remain stale until token expiry. Socket handshake auth only verifies the JWT and does not reload account/ban status.

### 13. Code smells

- `TestcaseRepository` mixes version allocation, activation, and read formatting; this is still small enough to explain, but `addTestcase`/`deleteTestcase` duplicate the copy-forward version creation.
- `formatTestcase` returns both `id` and legacy `_id`.
- Archive upload/parser functions use compact inline handlers; several operations are easier to audit if expanded into named helpers.

### 14. Refactor candidates

Keep archive parsing separate from persistence. Consider a small shared `createNextVersion` path for manual edits, retain the same transaction and CAS boundary, and add a database-level ownership invariant only if MySQL/Prisma can express it without destabilizing the baseline. Make current-role/current-ban behavior explicit at the socket and admin authorization boundary.

## FLOW 2 — Persistent asynchronous submission judging

### 1. Purpose

Persist user code and its testcase-set pin first, then enqueue an ID-only BullMQ job. The worker reloads authoritative data from MySQL, claims the row, judges it through the sandbox, persists one final status, and publishes a best-effort notification.

### 2. Entry point

- `POST /api/v1/submissions` in `apps/api/src/modules/submissions/submission.route.ts`, behind `requireAuth` and `submitCodeSchema`.
- `SubmissionController.submit` delegates to `SubmissionService.submit`.
- Worker entry: `apps/judge-worker/src/worker.ts` -> `startSubmissionWorker`.

### 3. End-to-end call graph

```text
API POST submission
  -> schema validates problemId, code length >=10, language, optional matchId
  -> SubmissionService.submit
  -> SubmissionRepository.createPendingSubmissionForActiveSet (MySQL transaction)
     -> resolve problem and active set
     -> if matchId: lock match, verify RUNNING + membership + same problem
     -> insert PENDING Submission pinned to testcase_set_id
  -> Queue.add('submission-job', { submissionId }, { jobId: submissionId }) [up to 3 attempts]
  -> BullMQ Worker (concurrency 2)
  -> SubmissionProcessor.process
     -> findById; ignore missing/terminal row
     -> guarded PENDING -> PROCESSING claim (or continue PROCESSING retry)
     -> load Problem + ordered cases by pinned set ID
     -> SubmissionJudgeService.judge -> execute each case
     -> guarded PROCESSING -> terminal verdict
     -> Redis Pub/Sub publish after DB write
  -> API subscriber -> MatchService validates event against DB and settles match if relevant
  -> Socket.IO emits; client recovers via GET /submissions/:id
```

Recovery: `SubmissionReconciler.runOnce` scans a bounded stale-PENDING batch. It checks BullMQ by deterministic ID; re-enqueues if absent, leaves active/waiting/delayed jobs alone, and guardedly marks stale PENDING as `SYSTEM_ERROR` if the retained job is failed/completed. Worker final-failure handling also guardedly marks `PENDING`/`PROCESSING` as `SYSTEM_ERROR`.

### 4. Important files

- `apps/api/src/modules/submissions/submission.route.ts`, `submission.controller.ts`, `submission.schema.ts`
- `apps/api/src/modules/submissions/submission.service.ts`, `submission.repository.ts`, `submission.reconciler.ts`
- `apps/api/src/config/queue.ts`, `apps/api/src/modules/submissions/submission.constants.ts`
- `apps/judge-worker/src/worker.ts`
- `apps/judge-worker/src/submissions/submission.worker.ts`, `submission.processor.ts`, `submission.repository.ts`, `judging-context.repository.ts`, `submission.publisher.ts`
- `apps/api/src/realtime/submission-updates.subscriber.ts`, `apps/api/src/realtime/socket.server.ts`
- `packages/contracts/queue.ts`, `packages/contracts/submission.ts`, `apps/api/prisma/schema.prisma`

### 5. Database operations

MySQL is authoritative. API transaction creates `PENDING` with problem, user, code, language, testcase-set ID and optional match ID. Worker reads submission/problem/cases; `updateMany` with a status predicate claims or finalizes. `GET /submissions/:id` reads MySQL and checks owner/admin access. Finalizer stores status, counts, time, memory, and error message before notification.

### 6. Redis/BullMQ/Socket/Judge0 interactions

Queue name is `submission_queue`; job data contains only `{ submissionId }`; job ID is the submission ID. Queue options use 3 attempts, exponential backoff starting at 1 second, remove completed jobs, and retain failed jobs. Redis Pub/Sub channel is `submission-updates`; it is separate from the Socket.IO Redis adapter. Socket events are notification-only; the client can read submission state from MySQL-backed HTTP.

### 7. State transitions

Intended path is `PENDING -> PROCESSING -> ACCEPTED|WA|TLE|MLE|RE|CE|SYSTEM_ERROR`. `claimPending` is a conditional update. `finalize` only updates `PROCESSING`; `markSystemError` only updates `PENDING` or `PROCESSING`. A duplicate delivery for a terminal status returns without judging or writing.

### 8. Transactions / atomic operations

Submission creation plus testcase pinning is one transaction. Enqueue happens after commit, so there is a crash gap. State transitions use conditional database writes. Final verdict and counts persist before Pub/Sub. There is no transactional outbox by design; the stale-row reconciler repairs the enqueue gap and HTTP reads repair lost notification delivery.

### 9. Failure scenarios

- Enqueue throws: API retries three times, returns the durable PENDING submission, and logs; later reconciler retries.
- Queue job missing: stale PENDING is re-enqueued with the same ID.
- Retained job failed/completed while row still PENDING: reconciler stores SYSTEM_ERROR.
- Worker exception: BullMQ retries; exhausted failure stores SYSTEM_ERROR. A terminal write failure can also retry.
- Judge0/worker infrastructure exception: retries, then SYSTEM_ERROR. Compile error and wrong answer are normal terminal verdicts.
- Redis Pub/Sub failure after final DB write: logged and swallowed; result remains durable and client polls/reloads HTTP.
- API/worker crash after claim: BullMQ stalled-job recovery is relied on; there is no explicit DB reconciliation for stale PROCESSING rows.

### 10. Concurrency / idempotency guarantees

- Deterministic `jobId=submissionId` deduplicates normal duplicate enqueue while BullMQ retains that job ID.
- DB conditional writes prevent duplicate terminal updates and stale attempts overwriting a terminal row.
- A `PROCESSING` row is accepted as resumable on retry without an attempt token/lease. Thus concurrent or overlapping redelivery can execute the same submission more than once; the guarded terminal write lets one result persist, but it does not guarantee exactly-once execution.
- Reconciliation is process-local guarded (`running` flag), so multiple API replicas can scan the same IDs. Deterministic BullMQ job identity and guarded DB transitions are the cross-replica safety mechanisms.
- Reconciliation scans up to configured batch size (default 50) older than 60 seconds every 30 seconds. It is not an outbox and cannot guarantee recovery while Redis remains unavailable.

### 11. Tests proving the guarantees

- `apps/api/src/modules/submissions/__tests__/submission.service.test.ts`: creates/queues PENDING, handles enqueue failure, rejects missing active set, checks submission read authorization.
- `apps/api/src/modules/submissions/__tests__/submission.reconciler.test.ts`: bounded stale scan, deterministic requeue, no duplicate when job exists, failed/completed job settlement.
- `apps/api/src/tests/submission-reliability.test.ts`: real DB stale-PENDING selection/guard and BullMQ deterministic ID behavior.
- `apps/judge-worker/src/submissions/submission.processor.test.ts`: duplicate/terminal handling, transition outcomes, final failure behavior.
- `apps/judge-worker/src/submissions/submission.repository.test.ts`: guarded claim/finalize/system-error writes.
- `apps/judge-worker/src/submissions/judging-context.repository.test.ts`: loads pinned set cases rather than active set.

### 12. Known limitations

- No DB-level uniqueness on queue jobs; queue identity lives in BullMQ.
- No PROCESSING lease/heartbeat reconciler. Recovery after a worker crash depends on BullMQ stalled-job detection and final failure events.
- Enqueue and DB commit cannot be atomic without an outbox; current design documents this as a bounded eventual-recovery gap.
- Pub/Sub is ephemeral and is not the source of truth.
- Submission schema allows unbounded `LongText` code; request schema has a minimum but no maximum size, so API request/storage pressure is not bounded here.

### 13. Code smells

- `formatSubmission` accepts `any` and exposes both `id` and legacy `_id`.
- API and worker use `console` logs with formatted strings instead of structured fields; enqueue/reconciliation error branches do not consistently include a stable `jobId` field.
- Queue options are separated from the code that handles final failure, so retry behavior is explained across API and worker modules.

### 14. Refactor candidates

Document the execution semantics as at-least-once with single guarded terminal persistence. If stale PROCESSING recovery becomes a requirement, add a bounded lease/heartbeat and recovery policy that does not permit an old attempt to overwrite a new attempt. Add a concrete code-size limit and structured logs with `submissionId` and `jobId`; retain MySQL as the state source and HTTP recovery path.

## FLOW 3 — Sandboxed untrusted-code execution

### 1. Purpose

The judge worker sends each testcase to self-hosted Judge0; Judge0 invokes isolate to compile/run user code. API preview also calls the executor/Judge0 directly for ad-hoc runs. Neither path evaluates user code in a Node application process.

### 2. Entry point

- Official judge: `SubmissionProcessor.process` -> `SubmissionJudgeService.judge`.
- Preview: `POST /api/v1/submissions/run` -> `ExecutionPreviewService.runCode` -> executor. This path is synchronous in the API request and uses the same sandbox service.
- Executor: `packages/executor/src/index.ts#executeTestCase`.

### 3. End-to-end call graph

```text
Worker submission processor
  -> pinned problem limits + cases
  -> SubmissionJudgeService loops cases in position order
  -> getLanguageId(language)
  -> executeTestCase builds base64 Judge0 request + limits
  -> POST {JUDGE0_URL}/submissions?base64_encoded=true&wait=true
  -> Judge0 server/worker -> isolate
  -> normalize Judge0 status/output
  -> first non-AC ends testcase loop; result is persisted by processor
```

### 4. Important files

- `apps/judge-worker/src/sandbox/submission-judge.service.ts`
- `packages/executor/src/index.ts`
- `packages/executor/src/index.test.ts`
- `packages/executor/src/judge0.integration.test.ts`
- `apps/api/src/modules/submissions/execution-preview.service.ts`
- `infra/docker-compose.yml`
- `infra/judge0/judge0.env.example`
- `apps/api/src/modules/problems/problem.schema.ts`, `apps/api/src/modules/submissions/submission.schema.ts`

### 5. Database operations

Worker reads language, code, problem limits and testcase text from MySQL. Sandbox execution does not connect to the app database. API and worker receive app DB/Redis configuration in Compose; Judge0 receives separate Postgres/Redis configuration from `infra/judge0/judge0.env.example`.

### 6. Redis/BullMQ/Socket/Judge0 interactions

Official judge jobs use BullMQ; the worker performs synchronous `wait=true` Judge0 HTTP calls one testcase at a time, with worker concurrency 2. `JUDGE0_URL` is supplied by environment. Compose has no public `2358` port on `judge0-server`; its `judge0` network is `internal: true`. Hybrid development exposes a TCP proxy bound to `127.0.0.1:2358`. Judge0 server and workers are `privileged`, and the app API/worker share the private network so they can call it.

### 7. State transitions

Judge0 status IDs map as follows: 3 Accepted, 4 Wrong Answer, 5 TLE, 6 CE. IDs 7–12 map to RE unless selected runtime diagnostic strings match the MLE heuristic. ID 13 and unknown IDs throw, becoming retriable infrastructure errors and eventually SYSTEM_ERROR.

### 8. Transactions / atomic operations

No DB transaction spans sandbox execution. Each testcase request is independent. The worker persists the aggregate verdict in one guarded update after all required cases or the first failed case. The application job remains PROCESSING while calls are in flight.

### 9. Failure scenarios

- Unsupported persisted language is rejected by the worker before execution and ultimately becomes SYSTEM_ERROR. API submission language schema allows only cpp/java/python.
- Empty/invalid Judge0 URL, blocked hosted RapidAPI URL, HTTP error, timeout, unknown status, and Judge0 status 13 throw and are handled as worker retry/infrastructure failures.
- TLE comes from Judge0 status 5; CE status 6; RE IDs 7–12 absent MLE diagnostic.
- MLE is inferred from stderr/message text (`std::bad_alloc`, `MemoryError`, `OutOfMemoryError`, `cannot allocate memory`, `memory limit exceeded`), not a dedicated Judge0 CE status.

### 10. Concurrency / idempotency guarantees

Configured request limits are CPU `time_limit` seconds, wall time 3x CPU, memory in KiB, 16 processes/threads, 64 KiB max file size, network disabled, and per-process/thread time and memory flags enabled. Limits accepted by API are 100–10000 ms and 16–1024 MiB. Compiler args, command args, callback and additional-file fields are not constructed by the executor; Judge0 config disables the latter options and disallows user compiler/command arguments. CPU/memory per-process flags mean this is not a demonstrated aggregate memory ceiling. The integration fixture that tries 32 Python threads observes the configured bound; it is not a proof across every language/kernel configuration.

### 11. Tests proving the guarantees

- `packages/executor/src/index.test.ts`: language IDs, configured request fields, response normalization, MLE diagnostic handling, invalid limits, missing/hosted URL handling, and infrastructure errors.
- `packages/executor/src/judge0.integration.test.ts`: optional Judge0 fixture suite for AC, WA, CE, RE, CPU loop and wall sleep TLE, C++ MLE diagnostic, localhost network denial, process/thread bound, stdout and file output behavior. It skips without `JUDGE0_URL`.
- `scripts/test-judge0-security.ps1`: repeatable Docker/Judge0 security fixture script (not run during this audit).

### 12. Known limitations

- `MLE` mapping is heuristic and only proven for the exercised C++ allocation fixture; other languages/diagnostics may produce RE or a different status.
- Per-process/thread memory limit is enabled because aggregate cgroup settings produced Judge0 Internal Error on the documented Docker Desktop setup. There is no proven aggregate memory cap across 16 processes/threads.
- Network is disabled in the request and Judge0 config; integration test exercises loopback denial only. The guarantee depends on Judge0/isolate honoring this setting and the deployment host isolation.
- Output/file test asserts excessive output is not accepted; executor code itself has no explicit application byte counter for stdout.
- Compose runs Judge0 server/worker privileged. The private app-to-Judge0 network is not a sandbox boundary by itself; isolate and host/container configuration provide execution isolation.
- API preview invokes Judge0 from API request handling, so it consumes API request capacity while waiting; it is separate from persistent worker judging.

### 13. Code smells

- `getLanguageId` falls back to Python for an unexpected runtime key (`LANGUAGE_IDS[lang] || 71`), although normal API/worker validation should reject unsupported languages first.
- Response parsing uses `any`; MLE recognition is coupled to English diagnostic strings.
- Execution result aggregates testcase execution time but retains only maximum per-case memory, which is a reporting convention rather than peak process-wide usage.

### 14. Refactor candidates

Align `docs/sandbox-security.md` with actual configuration and tests before using it in an interview. Make language mapping fail closed at the executor boundary; keep allowed languages and resource ranges centralized. Describe MLE and network/output claims with their observed evidence and limits. Keep preview routed through the sandbox, and consider moving it to queued work only if request capacity becomes a measured problem.

## FLOW 4 — Realtime 1v1 matchmaking and atomic completion

### 1. Purpose

Authenticated users join a Redis ELO queue. API instances coordinate pairing, then MySQL creates the durable match and two participant rows. A match-bound accepted submission or participant forfeit competes to finish the match. The winner race updates both ELO values once, in the same DB transaction; Socket.IO announces the committed result.

### 2. Entry point

- Socket handshake authentication and user room setup: `apps/api/src/realtime/socket.server.ts`.
- Match socket handlers: `apps/api/src/modules/matches/match.socket.ts`.
- Redis queue and pairing: `apps/api/src/modules/matches/matchmaking.service.ts`.
- HTTP recovery/details: `apps/api/src/modules/matches/match.route.ts`.
- Match-bound submit check: `apps/api/src/modules/submissions/submission.repository.ts#createPendingSubmissionForActiveSet`.
- Verdict subscriber: `apps/api/src/realtime/submission-updates.subscriber.ts`.

### 3. End-to-end call graph

```text
Socket handshake JWT -> socket.data.user
  -> join-queue -> MatchmakingService.joinQueue
     -> Redis lock; MySQL active-match check; Redis sorted set + metadata hash
     -> pairClosest -> closest adjacent ELO pair from first 200 queue entries
     -> MatchRepository.createMatch (MySQL transaction + user row locks + recheck)
     -> remove queue entries; join user rooms and emit MATCH_FOUND

POST submission with matchId
  -> MySQL transaction locks match and checks RUNNING + participant + problem match
  -> create PENDING Submission with match_id
  -> worker judges -> persist ACCEPTED before Pub/Sub
  -> subscriber -> MatchService verifies event against DB
  -> MatchRepository.endMatchWithEloTransaction
     -> verify winner participant and two participants
     -> CAS RUNNING -> FINISHED
     -> calculate and write participant status/score + both user ELO/streaks
     -> commit -> emit MATCH_ENDED
```

Forfeit follows `match.socket.ts#FORFEIT_MATCH` -> `MatchService.handleForfeit` -> the same end transaction. A 30-second API timer scans accepted submissions on still-running matches to recover a missed Pub/Sub message.

### 4. Important files

- `apps/api/src/realtime/socket.server.ts`
- `apps/api/src/realtime/submission-updates.subscriber.ts`
- `apps/api/src/modules/matches/match.socket.ts`, `matchmaking.service.ts`, `match.service.ts`, `match.repository.ts`, `elo.ts`
- `apps/api/src/modules/submissions/submission.repository.ts`
- `apps/api/src/server.ts` (5-second matchmaking retry, 30-second match reconciliation)
- `apps/api/prisma/schema.prisma` (`Match`, `MatchParticipant`, `Submission`)
- `apps/web/src/views/PvPWorkspaceView.tsx`, `apps/web/src/services/socket.ts`

### 5. Database operations

- Queue identity, ELO score, and display metadata live in Redis.
- MySQL owns match status/problem/winner, participant membership/status/score delta, submissions, and user ELO/streak.
- Match creation locks both user rows in stable ID order, checks active matches, and inserts one RUNNING match with exactly two participant rows.
- Match-bound submission locks the match row and validates match state, caller membership, and matching problem before inserting any submission.
- Settlement transaction validates a two-member match and winner membership, conditionally changes RUNNING to FINISHED, then updates both participant records and both user records.

### 6. Redis/BullMQ/Socket/Judge0 interactions

Redis sorted set `matchmaking:v1:elo` stores user IDs by ELO; hash `matchmaking:v1:players` stores JSON metadata; `matchmaking:v1:lock` is acquired with `SET NX PX` and released with token-checking Lua. Socket.IO uses the Redis adapter for cross-instance room operations. Judge Worker uses a separate Redis Pub/Sub channel for verdict notification. Queue removal/disconnect cleanup is best effort; MySQL is used to reject stale queue members who already have an active match.

### 7. State transitions

Matches are created directly as RUNNING; completion is RUNNING -> FINISHED with `winner_id`. `DRAW` remains in the enum but has no transition. Participants start CODING; non-AC final result updates that user's participant status to SUBMITTED_WA; settlement marks winner ACCEPTED and loser SUBMITTED_WA. The participant status name compresses several verdicts, including CE/TLE/RE/SYSTEM_ERROR, into SUBMITTED_WA.

### 8. Transactions / atomic operations

The RUNNING-to-FINISHED `updateMany` is the compare-and-set winner claim. Participant and ELO writes occur in the same transaction. Only a transaction with one claimed row returns settlement data, and socket emission is after transaction resolution. Match creation also uses a transaction and DB row locks as a backstop to the Redis lease.

### 9. Failure scenarios

- Redis pair lock busy/error: socket gets a generic error; queued entries persist for retry if already inserted.
- Match DB create fails: pair remains queued; periodic retry tries again.
- Process crash after DB match create but before Redis removal/notification: a future pairing attempt detects active match and removes stale member; clients recover via `GET /matches/active`.
- Queue member with missing metadata is removed from sorted set; metadata/hash cleanup is best effort.
- Pub/Sub/Socket event missed: DB-backed match/submission GET and accepted-submission reconciliation recover durable state.
- Simultaneous accepted submissions or accepted-vs-forfeit: CAS permits one settlement.
- Matchmaking lock can expire during slow DB work; MySQL user-row locks and active-match check provide secondary protection.

### 10. Concurrency / idempotency guarantees

- Redis lock serializes normal queue joins/leaves/pairing across API instances, with 30-second lease.
- MySQL lock and active-match query protect against overlapping match creation if the Redis lease expires.
- Match-bound submission check holds a match row lock while inserting, so the transaction observes RUNNING before creating work. The conclusion CAS races against that lock/transaction.
- Winner settlement is once per match because the first successful RUNNING -> FINISHED update owns participant/ELO writes.
- Winner is the first transaction to claim completion, not necessarily the earliest wall-clock accepted verdict when events race.
- There is no `ends_at`/deadline field or time-window check. A submission is eligible at any time while MySQL status remains RUNNING.

### 11. Tests proving the guarantees

- `apps/api/src/tests/matchmaking-redis.test.ts`: duplicate join, idempotent leave, concurrent coordinators, creation failure retention/retry, queue cleanup and active-match rejection.
- `apps/api/src/tests/match-domain.test.ts`: exactly two participant creation, membership uniqueness, winner validation, concurrent accepted settlement once, accepted-vs-forfeit once, active testcase eligibility.
- `apps/api/src/tests/match-submission-authorization.test.ts`: outsider, wrong problem, finished match and participant submission authorization.
- `apps/api/src/modules/matches/__tests__/match.socket.test.ts`: unauthorized room join/forfeit and authenticated member join.
- `apps/api/src/tests/match-reconciliation.test.ts`: DB accepted result settles without Pub/Sub.
- `apps/api/src/tests/socket-adapter.test.ts`: cross-instance Socket.IO room delivery.

### 12. Known limitations

- Queue entries have no TTL; a crashed API can leave a user queued until a later operation discovers the condition. A normal disconnect removes the user, which also means an offline user may be removed from matchmaking.
- Redis lease is fixed at 30 seconds; DB locks protect match creation but lease expiry can allow duplicate coordinator work.
- Notifications are best effort. Recovery depends on client HTTP refresh and periodic reconciliation.
- `MatchParticipant` unique `(match_id,user_id)` does not enforce a maximum of two rows at the database level; the normal create path writes two and an `addParticipant` method checks count, but another writer can violate the 1v1 cardinality.
- Prisma schema has no relation/FK from `Match.problem_id` or `Submission.match_id` to `Match`; application checks are the integrity boundary for those links.
- No deadline/window is persisted or checked for match submissions.
- `EloHistory` is present in schema/API but settlement shown here updates current ELO and participant deltas; no match settlement history insert is visible in this transaction.

### 13. Code smells

- `matchmaking.service.ts` owns Redis key construction, locking, queue mutations, ELO selection, match creation orchestration, socket room joins and event formatting.
- `match.service.ts` accepts loosely-shaped Pub/Sub data and delegates to repository after runtime DB verification; a typed event schema would make the boundary clearer.
- `match.controller.ts` maps several unrelated errors to HTTP 400 while other handlers use centralized `AppError` middleware.
- Participant status `SUBMITTED_WA` does not distinguish a wrong answer from system error or other non-AC verdicts.

### 14. Refactor candidates

Keep Redis as the matchmaking coordination store and MySQL as the match authority. Put pairing/event formatting behind small helpers, add a DB invariant for exactly two participants if practical, and add an explicit match deadline only if the product requires one. Use a runtime-validated Pub/Sub payload and distinguish infrastructure failure from a rival's unsuccessful solution in participant status.

## CROSS-FLOW ISSUES

| Priority | Finding | Evidence / effect |
| --- | --- | --- |
| **P1** | Socket authorization does not recheck current user/ban state; admin checks trust JWT role claims. | `socket.server.ts` verifies JWT only; REST `requireAuth` reloads `is_banned`, while `requireAdmin` reads `req.user.role`. A banned user with an existing socket token can still invoke queue/match handlers; a demoted admin token can retain admin claims until expiration. |
| **P1** | Phase 1 scope cleanup is incomplete. | `UserActivity`/streak APIs and Profile UI remain; `EloHistory` APIs/schema remain; editorial video fields remain in the Problem API/schema. These are outside the stated target scope and expand the interview story. |
| **P1** | Missing liveness/readiness and API graceful shutdown; logs are not structured. | `apps/api/src/server.ts` starts intervals and listens without signal handlers or health routes. `worker.ts` has signal shutdown, but logs across API/worker are `console.log/error` strings rather than structured events with consistent `submissionId`, `jobId`, `matchId`. |
| **P1** | Documentation drift overstates or contradicts runtime behavior. | `docs/sandbox-security.md` says private Judge0 networking and the threat matrix are not verified, while `docs/judging-pipeline.md`, executor tests, `docker-compose.yml`, and `judge0.env.example` show configured networking and fixtures. `docs/architecture.md` still describes user stats/avatar storage and API module responsibilities that include out-of-scope features. |
| **P1** | Relational integrity is partly application-enforced. | `Match.problem_id` and `Submission.match_id` lack Prisma relations/FKs; max-two participant cardinality is not a DB constraint. Deletes or alternate writers can orphan or violate match relations. |
| **P1** | Match submission deadline is absent. | Match schema has no deadline and submission repository checks only RUNNING/member/problem. Any submission can be accepted while a match remains RUNNING. |
| **P1** | PROCESSING recovery depends on BullMQ. | API reconciliation handles only stale PENDING; a lost/stranded PROCESSING row has no DB watchdog/lease. Worker retries usually cover crashes, but this is not an independently reconciled invariant. |
| **P2** | Error handling and logs vary by boundary. | Some controllers centralize via `next(error)` while match history/active/delete catch and return 400. Logs are inconsistent and sometimes include raw error details; no request/job correlation context. |
| **P2** | Legacy DTO aliases and weak types remain. | Submission/testcase formatters return `_id` alongside `id`; `formatSubmission` uses `any`; executor response parsing uses `any`. |
| **P2** | Dead or low-value schema/service surface remains. | `EloHistory` and `UserActivity` models persist; `MatchRepository.addParticipant` and `activateTestcaseSet` are not part of a public application flow (activation is exercised by tests). Confirm before removing because they may support future admin/test workflows. |
| **P2** | Problem deletion and match deletion are broad admin operations. | Problem deletion is hard-delete behavior and schema cascades/constraints affect testcase history/submissions; match deletion removes durable history. This should be intentional for a demo admin API. |
| **P2** | Network/exposure claims need environment context. | Compose publishes MySQL/Redis ports for development and API/Judge Worker share the internal Judge0 network; only Judge0 port is loopback-only in hybrid. This is suitable for local demo configuration, not evidence of production firewall policy. |

No P0 finding was assigned from source inspection alone. The highest-priority observed gaps are authorization freshness, undocumented lifecycle behavior, and missing match time-window enforcement; the Judge0 config and execution fixture evidence are materially stronger than the stale sandbox doc suggests.

## Proposed refactor map (not implemented)

1. **Close interview-polish gaps:** add API liveness/readiness, graceful API shutdown for HTTP/Socket.IO, timers, subscriber, queue and Prisma; preserve the worker shutdown path and close all clients; use structured logs with stable correlation IDs.
2. **Align truth in docs:** fix `docs/sandbox-security.md` and architecture descriptions from current code; add this audit as a map of proven guarantees and limitations; remove claims for unimplemented match deadline or exactly-once execution.
3. **Tighten auth and resource bounds:** decide how current role/ban changes invalidate sockets/tokens; apply the same policy to REST and Socket.IO; cap submission code and preview payload sizes.
4. **Harden durable invariants:** add PROCESSING lease/recovery only if required, with attempt fencing; add schema relations and participant cardinality protections where supported; retain existing CAS transaction boundaries.
5. **Finish scope cleanup after reference checks:** remove streak/activity/EloHistory/editorial-video surfaces and associated web/docs/schema only when dependencies, migration impact and demo flow are understood. Keep ELO deltas on MatchParticipant if useful for match result display.
6. **Keep sandbox claims evidence-based:** retain the explicit 100–10000 ms, 16–1024 MiB, 16 process/thread and 64 KiB file limits; document per-process memory, MLE heuristic, network fixture coverage and privileged Judge0 deployment as constraints.
7. **Simplify only after correctness changes:** extract small helpers from matchmaking orchestration and testcase copy-forward version creation; replace legacy aliases/`any` at API boundaries. Avoid adding an outbox, broker, DI framework, or broader architecture without a demonstrated need.
