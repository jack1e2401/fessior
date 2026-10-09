# Interview demo UI

The web client keeps a small home workbench and provides separate, paginated tabs for Problems, Submissions, Match history, and Leaderboard. Sandbox is an editor view and does not create a submission.

## Routes and data scope

| Route | Scope |
| --- | --- |
| `/home` | Suggested problems, signed-in user's recent submissions, and only matches where that user participated |
| `/problems` | Searchable, server-paginated problem list |
| `/problems/:slug` | Problem statement, editor, sample/custom testcase runner, and submit action |
| `/submissions` | Signed-in user's paginated submissions |
| `/submissions/:id` | Owner/admin submission source, verdict, pinned testcase version, recorded case results, and status events |
| `/matches/history` | Paginated public metadata for all matches |
| `/leaderboard` | Paginated ELO ranking for non-banned accounts |
| `/sandbox` | Standalone editor and custom testcase runner; no submit action |

All paginated tabs request 20 items per page; API list endpoints cap the page size at 100. Match history exposes usernames, match/problem identifiers and titles, timestamps, status, and ELO deltas. It omits email, source code, and testcase input/output. Leaderboard exposes rank, username, avatar, and ELO.

## Code execution and evidence

Run requests support at most 10 custom cases, 20 KB per input and expected output, and 100 KB total. Expected output is optional. Without it the API reports `EXECUTED` after successful execution rather than claiming an accepted answer. Existing single-input fields remain accepted for compatibility.

Submissions record guarded `PENDING -> PROCESSING -> terminal` events and executed case verdict/runtime/memory. Persisted case records omit testcase payloads. Older submissions with no evidence rows render an explicit unavailable state; the UI does not synthesize timestamps or case results.

## Motion

Auth displays the Anime.js-inspired dial without promotional or placeholder social-login copy. The signed-in shell mounts the same SVG as a dim decorative layer and syncs its animation to the shell's scrolling content via Anime.js `onScroll`. `prefers-reduced-motion` leaves the illustration static. Styling uses Tailwind utility classes.

## Scope exception

The interview backend goal excludes a global leaderboard and public match browsing. These two authenticated, read-only views are added as explicit demo requests; their APIs return only the public metadata listed above.
