# Interview demo UI

The web client keeps a small home workbench and provides separate, paginated tabs for Problems, Submissions, and Match history. Sandbox is an editor view and does not create a submission.

## Routes and data scope

| Route | Scope |
| --- | --- |
| `/home` | Suggested problems, signed-in user's recent submissions, and only matches where that user participated |
| `/problems` | Searchable, server-paginated problem list |
| `/problems/:slug` | Problem statement, editor, sample/custom testcase runner, and submit action |
| `/submissions` | Signed-in user's paginated submissions |
| `/submissions/:id` | Owner/admin submission source, verdict, pinned testcase version, recorded case results, and status events |
| `/matches/history` | Paginated public metadata for all matches |
| `/sandbox` | Standalone editor and custom testcase runner; no submit action |
| `/admin/problems` | Admin-only problem configuration, Markdown statement editor/preview, testcase ZIP import, active version/checksum and public examples (loaded when expanded) |
| `/admin/submissions` | Admin-only paginated global submission metadata; source is available only from authorized detail |
| `/admin/matches` | Read-only paginated 1v1 outcomes, winner and persisted participant ELO changes |

All paginated tabs request 20 items per page; API list endpoints cap the page size at 100. Match history exposes usernames, match/problem identifiers and titles, timestamps, status, and ELO deltas. It omits email, source code, and testcase input/output.

## Code execution and evidence

Run requests support at most 10 custom cases, 20 KB per input and expected output, and 100 KB total. Expected output is optional. Without it the API reports `EXECUTED` after successful execution rather than claiming an accepted answer. Existing single-input fields remain accepted for compatibility.

Submissions record guarded `PENDING -> PROCESSING -> terminal` events and executed case verdict/runtime/memory. Persisted case records omit testcase payloads. Older submissions with no evidence rows render an explicit unavailable state; the UI does not synthesize timestamps or case results.

## Motion

Auth displays the Anime.js-inspired dial without promotional or placeholder social-login copy. The signed-in shell mounts the same SVG as a dim decorative layer and syncs its animation to the shell's scrolling content via Anime.js `onScroll`. `prefers-reduced-motion` leaves the illustration static. Styling uses Tailwind utility classes.

## Admin interview walkthrough

1. As an admin, create or select a problem and set its statement, starter code, CPU time and memory limit.
2. Import a validated testcase ZIP. Confirm the active version, checksum and example/hidden case counts; older versions remain listed.
3. Sign in as a user in another browser and submit a solution against that problem.
4. In `/admin/submissions`, filter the persisted global list and open a row. The list omits source; the authorized detail view shows source and recorded judging evidence, including the submission's pinned testcase version.
5. Import another testcase ZIP as the next version. Reopen the earlier submission and confirm it still references the original version.
6. Have two users complete a 1v1 match. In `/admin/matches`, confirm the stored winner and each participant's ELO delta.

The admin UI presents backend records; it does not simulate judging or claim Judge0 health. Sandbox/isolation evidence remains in Judge0 configuration and security/integration tests. This walkthrough requires MySQL, Redis, API, judge worker, Judge0 and two user accounts; steps not exercised against those running services are not considered verified.

Problem statements can be authored with Markdown headings (`##`), bold (`**text**`), inline code (`` `code` ``), bullet lists (`- item`) and fenced code blocks. The editor includes formatting shortcuts and a preview. Existing HTML statements are converted to Markdown when opened for editing. Starter code is edited one language at a time. Admins can add an example testcase directly; the API creates and activates a new immutable version. Existing versions can be re-activated without changing testcase rows or submissions pinned to them. Public testcase input/output is fetched only after expanding the examples disclosure.
