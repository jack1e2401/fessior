# Realtime 1v1 Matchmaking

The Backend HTTP Service (`apps/api`) owns durable `Match` and `MatchParticipant` rows in MySQL. Redis coordinates matchmaking; Socket.IO carries notifications. The Judge Worker publishes verdict notifications only after writing a terminal Submission. Clients recover through HTTP when notifications are missed.

## Queue and Pairing

`MatchmakingService` stores user IDs in a Redis sorted set scored by ELO and user display metadata in a Redis hash. All queue joins, leaves, and pairing use one short Redis lock (`SET NX PX`, token checked by Lua on release). Two Backend HTTP Service instances therefore cannot remove the same pair concurrently. The service considers up to 200 users per pairing attempt and chooses the closest adjacent ELO pair. A 5-second periodic retry also attempts pairs left queued after a transient database failure.

A joining user is checked against MySQL for an active match while the Redis lock is held. `MatchRepository.createMatch` locks both user rows in MySQL and rechecks active matches before inserting exactly two participants. This is the durable backstop if the Redis lock expires or an API process crashes. On successful creation the pair is removed from Redis. On database failure both users remain queued. `leave-queue` is idempotent. A normal socket disconnect removes that user's queue entry; a process crash can leave an entry until a later join, pairing attempt, or explicit leave. A user paired while offline can recover the match via `GET /matches/active`.

New matches start directly as `RUNNING` after both participants are created. Migration `20261004000100_phase6_running_matches` promotes older unfinished `PENDING` matches with exactly two participants to `RUNNING` without deleting them. `FINISHED` stores the winner; `DRAW` remains in the schema but has no current transition. Pairing selects only problems whose active testcase set has cases.

## Authentication and Authorization

Socket.IO verifies an access JWT before protected handlers run. The client never supplies its user ID for match operations. `join-match` checks `(matchId, socket.userId)` membership in MySQL before joining `match:{matchId}`. `forfeit-match` checks membership and uses the same conclusion path as accepted judging. HTTP `GET /matches/:id` is restricted to participants or ADMIN. A match-bound `POST /submissions` locks and checks the match row inside the submission creation transaction: match is `RUNNING`, caller is a participant, and problem IDs agree. The check occurs before a Submission row or BullMQ job is created.

## Atomic Conclusion and Recovery

For a verified accepted submission, or a valid forfeit, `MatchRepository.endMatchWithEloTransaction` conditionally updates `RUNNING -> FINISHED` with `winner_id`. Only the transaction whose compare-and-set updates one row writes both participant results and both users' ELO values. A duplicate or losing race returns no result and emits no second `match-ended`. The Backend HTTP Service emits after the transaction commits. A socket delivery failure cannot roll back the durable outcome.

Each Backend HTTP Service instance subscribes to Judge Worker Pub/Sub verdict notifications. The service reloads the referenced Submission from MySQL and checks match, user, problem, and status before acting. This prevents a stale or forged Redis event from being treated as authoritative. A bounded 30-second reconciliation scan finds accepted submissions in still-running matches and applies the same CAS path when Pub/Sub is missed. Simultaneous accepted verdicts and accepted-versus-forfeit races settle once. Winner means the first successful conclusion transaction, not necessarily the earliest timestamp among nearly simultaneous verdicts.

Socket.IO uses its separate Redis adapter for cross-instance room broadcasts and room joins. The Judge Worker application Pub/Sub channel and the Socket.IO adapter are distinct mechanisms. The adapter does not store missed events. The Web Frontend reconnects with its JWT, reloads `GET /matches/:id` and the last known `GET /submissions/:id`, then rejoins the authorized room. `GET /matches/active` recovers a running match after refresh.

## Verification

`apps/api/src/tests/matchmaking-redis.test.ts` exercises duplicate join, idempotent leave, two concurrent coordinators, failure retention/retry, queue removal, and active-match rejection against Redis and MySQL. `match-domain.test.ts` races accepted conclusions and accepted-versus-forfeit, checks winner membership, participant rows, and ELO once. `match-submission-authorization.test.ts` rejects outsider, wrong problem, and finished match submissions. `match.socket.test.ts` checks unauthorized room joins and forfeits. `match-reconciliation.test.ts` proves an accepted DB submission concludes without Pub/Sub. `socket-adapter.test.ts` sends a match-room event across two Socket.IO instances.

The Redis lock has a 30-second lease. A DB operation lasting longer could outlive it, so MySQL user-row locks and active-match checks provide a second guard. Socket.IO room notifications remain best effort; production use behind a load balancer also needs sticky sessions for any HTTP polling transport. The Web Frontend currently requests WebSocket transport directly.
