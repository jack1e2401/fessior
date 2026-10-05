# Library primitives used in the four flows

| Primitive | Meaning in this repo | Where to look |
| --- | --- | --- |
| Prisma `$transaction()` | Keeps testcase activation or match/ELO settlement atomic. An exception rolls back all writes inside the callback. | `testcase.repository.ts`, `match.repository.ts` |
| Prisma `updateMany()` with a state filter | Compare-and-set: `count === 1` won the state transition; `count === 0` means another operation changed it first. | `claimRunningMatchWinner`, `activateNewSet` |
| SQL `FOR UPDATE` | Locks the player or match row until the transaction ends, protecting the check followed by the write. | `assertPlayersAvailableForMatch`, `createPendingSubmissionForActiveSet` |
| BullMQ `jobId = submissionId` | Re-enqueueing the same submission does not intentionally create a second independent job. The worker still guards duplicate delivery using DB state. | `submission.service.ts`, `submission.reconciler.ts` |
| Redis `SET key token PX ttl NX` | Acquire the matchmaking lock only when absent (`NX`); expire it after the lease (`PX`). | `acquireMatchmakingLock` |
| Redis Lua `EVAL` on lock release | Delete the lock only if its token still belongs to this owner. | `releaseMatchmakingLock` |
| Redis sorted set and hash | Sorted set orders queued users by ELO; hash stores the metadata used to announce a pair. | `matchmaking.service.ts` |
| Socket.IO user and match rooms | User room delivers a match offer; match room broadcasts match events. The Redis adapter carries room operations across API instances. | `socket.server.ts`, `notifyMatchedPlayers` |
| Judge0 `POST /submissions` | Runs code outside API/worker processes with server-selected language and execution limits. Status and output are decoded and normalized before persistence. | `packages/executor/src/index.ts` |

Redis Pub/Sub and Socket.IO events are notifications. MySQL submission and match rows remain the source of truth after a disconnect or missed event.
