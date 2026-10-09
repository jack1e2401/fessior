# Interview code map

Start at an entry point, follow the named business steps, then open a lower-level primitive when explaining its concurrency or security guarantee.

| Story | Entry and path through the code | Why each layer exists |
| --- | --- | --- |
| Testcase ZIP import | `apps/api/src/modules/testcases/testcase.route.ts` → `testcase.controller.ts` → `ingestion/archive-upload.ts` → `ingestion/archive-parser.ts` → `testcase.repository.ts#importSet` | Route enforces admin access; upload streams to a temporary file; parser validates ZIP and manifest; repository creates and activates an immutable version in one DB transaction. |
| Submit and judge | `apps/api/src/modules/submissions/submission.service.ts#submit` → `submission.repository.ts#createPendingSubmissionForActiveSet` → BullMQ → `apps/judge-worker/src/submissions/submission.processor.ts#process` → `sandbox/submission-judge.service.ts#judge` → `packages/executor/src/index.ts#executeTestCase` | API pins a testcase set and persists PENDING before enqueue; worker claims and reloads the submission; judge loops through pinned cases; executor translates limits and verdicts to Judge0. |
| Recover a missed job or verdict | `apps/api/src/modules/submissions/submission.reconciler.ts#runOnce` → `apps/judge-worker/src/submissions/submission.repository.ts` → `apps/judge-worker/src/submissions/submission.publisher.ts` | Reconciler repairs stale PENDING submissions; worker guards state transitions and persists before best-effort Pub/Sub. Clients read `GET /submissions/:id` to recover. |
| Realtime 1v1 | `apps/api/src/modules/matches/match.socket.ts` → `matchmaking.service.ts#joinQueue` → `pairClosest` → `match.repository.ts#createMatch` → `match.service.ts#handleSubmissionUpdate` → `match.repository.ts#endMatchWithEloTransaction` | Socket handlers use authenticated identity; Redis coordinates pairing; MySQL locks prevent overlapping matches; one RUNNING→FINISHED claim owns ELO settlement. |

For the last story, follow `apps/web/src/views/PvPWorkspaceView.tsx` to see how the client rejoins a match and reloads durable state after reconnect. See [library cheatsheet](LIBRARY_CHEATSHEET.md) for the primitives behind these steps.

## Admin interview surface

`apps/web/src/views/AdminDashboard.tsx` routes the three admin workflows through URL-addressable tabs. `components/admin/AdminProblemsTab.tsx` uses `ProblemRepository` for problem edits, ZIP import and active testcase examples. `components/admin/AdminSubmissionsTab.tsx` uses the guarded `GET /submissions/admin` metadata endpoint, refreshes only while visible rows are pending/processing (up to twelve refreshes), and links to the existing authorized submission detail. `components/admin/AdminMatchesTab.tsx` reads paginated match history and stored match details; it has no queue, forfeit, or settlement actions.
