# Feature Flows

This file lists the main flows worth learning and explaining. The project is intentionally trimmed to a focused resume-friendly scope.

## 1. Authentication And Session

Users register/login, receive access + refresh tokens, and can revoke sessions.

```mermaid
flowchart LR
  FE[Auth UI] --> API[auth.route]
  API --> Validator[auth.schema]
  Validator --> Controller[auth.controller]
  Controller --> Service[auth.service]
  Service --> Repo[auth.repository]
  Repo --> MySQL[(users / refresh_tokens / password_reset_tokens)]
  Service --> JWT[jwt.ts]
  Service --> Password[password.ts]
```

Key files:

- `apps/api/src/modules/auth/auth.route.ts`
- `apps/api/src/modules/auth/auth.controller.ts`
- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/src/modules/auth/auth.repository.ts`
- `apps/api/src/modules/auth/auth.middleware.ts`
- `apps/api/src/modules/auth/jwt.ts`
- `apps/api/src/modules/auth/password.ts`

## 2. Problem And Testcase Management

Problems, tags, starter code, limits, and testcases are stored in MySQL through Prisma.

```mermaid
flowchart LR
  FE[Problem/Admin UI] --> API[problem.route / testcase.route]
  API --> Validator[problem.schema / testcase.schema]
  Validator --> Controller[problem.controller / testcase.controller]
  Controller --> Service[problem.service / testcase.service]
  Service --> Repo[problem.repository / testcase.repository]
  Repo --> MySQL[(problems / testcases / tags / problem_tags)]
```

Key files:

- `apps/api/src/modules/problems/problem.route.ts`
- `apps/api/src/modules/problems/problem.controller.ts`
- `apps/api/src/modules/problems/problem.service.ts`
- `apps/api/src/modules/problems/problem.repository.ts`
- `apps/api/src/modules/problems/problem.schema.ts`
- `apps/api/src/modules/testcases/testcase.route.ts`
- `apps/api/src/modules/testcases/testcase.controller.ts`
- `apps/api/src/modules/testcases/testcase.service.ts`
- `apps/api/src/modules/testcases/testcase.repository.ts`
- `apps/api/src/modules/testcases/testcase.schema.ts`
- `apps/api/prisma/schema.prisma`

## 3. Submit Code And Judge

Main-service creates a MySQL submission, queues a BullMQ job, and judge-worker evaluates testcases asynchronously.

```mermaid
flowchart LR
  FE[Editor / Submit UI] --> API[submission.route]
  API --> Controller[submission.controller]
  Controller --> Service[submission.service]
  Service --> Repo[submission.repository]
  Repo --> MySQL[(submissions)]
  Service --> Queue[BullMQ submission_queue]
  Queue --> Worker[judge-worker]
  Worker --> MySQL2[(problems / testcases / submissions)]
  Worker --> Executor["@ocj/executor / Judge0"]
  Worker --> PubSub[Redis submission-updates]
  PubSub --> Subscriber[submission-updates.subscriber]
  Subscriber --> MatchService[match.service]
```

Key files:

- `apps/api/src/modules/submissions/submission.route.ts`
- `apps/api/src/modules/submissions/submission.controller.ts`
- `apps/api/src/modules/submissions/submission.service.ts`
- `apps/api/src/modules/submissions/submission.repository.ts`
- `apps/api/src/modules/submissions/execution-preview.service.ts`
- `apps/api/src/config/queue.ts`
- `apps/judge-worker/src/submissions/submission.worker.ts`
- `packages/executor/src/index.ts`

## 4. Realtime Matchmaking 1v1

Users join a Socket.io matchmaking queue. Main-service pairs close-ELO users, selects a MySQL problem, creates a match, and emits realtime match events.

```mermaid
flowchart LR
  FE[Match Finding UI] --> SocketClient[web socket service]
  SocketClient --> SocketServer[socket.server.ts]
  SocketServer --> SocketAdapter[match.socket.ts]
  SocketAdapter --> MatchmakingService[matchmaking.service.ts]
  MatchmakingService --> MatchRepo[match.repository.ts]
  MatchRepo --> MySQL[(problems / matches / users)]
  MatchmakingService --> Room["match:{matchId}"]
  Room --> FE
  JudgeUpdate[Redis submission-updates] --> SubAdapter[submission-updates.subscriber.ts]
  SubAdapter --> MatchService[match.service.ts]
  MatchService --> EndMatch[matchRepo.endMatchWithEloTransaction]
  EndMatch --> Emit[SOCKET_EVENTS.MATCH_ENDED]
```

Key files:

- `apps/api/src/realtime/socket.server.ts`
- `apps/api/src/realtime/submission-updates.subscriber.ts`
- `apps/api/src/modules/matches/match.socket.ts`
- `apps/api/src/modules/matches/matchmaking.service.ts`
- `apps/api/src/modules/matches/match.route.ts`
- `apps/api/src/modules/matches/match.service.ts`
- `apps/api/src/modules/matches/match.repository.ts`
- `apps/api/src/modules/matches/elo.ts`

## Removed From Current Learning Scope

The previous contest, social/friendship, shop, notification, report/moderation, AI roadmap/debug, news, and mock interview flows are no longer part of the active product surface.
