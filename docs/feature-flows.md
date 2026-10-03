# Feature Flows

This file lists the main flows worth learning and explaining. The project is intentionally trimmed to a focused resume-friendly scope.

## 1. Authentication And Session

Users register/login, receive access + refresh tokens, and can revoke sessions.

```mermaid
flowchart LR
  FE[Auth UI] --> API[auth.route]
  API --> Validator[auth.validator]
  Validator --> Controller[auth.controller]
  Controller --> Service[auth.service]
  Service --> Repo[auth.repository]
  Repo --> MySQL[(users / refresh_tokens / password_reset_tokens)]
  Service --> JWT[jwt.util]
  Service --> Password[password.util]
```

Key files:

- `apps/api/src/modules/auth/auth.route.ts`
- `apps/api/src/modules/auth/auth.controller.ts`
- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/src/modules/auth/auth.repository.ts`
- `apps/api/src/modules/auth/auth.middleware.ts`

## 2. Problem And Testcase Management

Problems, tags, starter code, limits, and testcases are stored in MySQL through Prisma.

```mermaid
flowchart LR
  FE[Problem/Admin UI] --> API[problem.route]
  API --> Validator[problem.validator]
  Validator --> Controller[problem.controller]
  Controller --> Service[problem.service]
  Service --> Repo[problem.repository]
  Repo --> MySQL[(problems / testcases / tags / problem_tags)]
```

Key files:

- `apps/api/src/modules/problems/problem.route.ts`
- `apps/api/src/modules/problems/problem.controller.ts`
- `apps/api/src/modules/problems/problem.service.ts`
- `apps/api/src/modules/problems/problem.repository.ts`
- `apps/api/src/modules/problems/problem.validator.ts`
- `apps/api/prisma/schema.prisma`

## 3. Submit Code And Judge

Main-service creates a MySQL submission, queues a BullMQ job, and judge-worker evaluates testcases asynchronously.

```mermaid
flowchart LR
  FE[Editor / Submit UI] --> API[submission.route]
  API --> Controller[submission.controller]
  Controller --> Service[submission.service]
  Service --> MySQL[(submissions)]
  Service --> Queue[BullMQ submission_queue]
  Queue --> Worker[judge-worker]
  Worker --> MySQL2[(problems / testcases / submissions)]
  Worker --> Executor["@ocj/executor / Judge0"]
  Worker --> PubSub[Redis submission-updates]
  PubSub --> Socket[api socket subscriber]
```

Key files:

- `apps/api/src/modules/submissions/submission.route.ts`
- `apps/api/src/modules/submissions/submission.controller.ts`
- `apps/api/src/modules/submissions/submission.service.ts`
- `apps/api/src/config/queue.ts`
- `apps/judge-worker/src/submissions/submission.worker.ts`
- `packages/executor/src/index.ts`

## 4. Realtime Matchmaking 1v1

Users join a Socket.io matchmaking queue. Main-service pairs close-ELO users, selects a MySQL problem, creates a match, and emits realtime match events.

```mermaid
flowchart LR
  FE[Match Finding UI] --> SocketClient[web socket service]
  SocketClient --> SocketServer[api Socket.io]
  SocketServer --> Queue[In-memory matchmakingQueue]
  Queue --> MySQL[(problems / matches / users)]
  MySQL --> Room["match:{matchId}"]
  Room --> FE
  JudgeUpdate[submission-updates] --> EndMatch[endMatch]
  EndMatch --> Elo[Update ELO / streak]
  EndMatch --> Emit[match-ended]
```

Key files:

- `apps/api/src/realtime/socket.ts`
- `apps/api/src/realtime/matchmaking.ts`
- `apps/api/src/modules/matches/match_history.route.ts`
- `apps/api/src/modules/matches/match_history.service.ts`
- `apps/api/src/modules/matches/elo.ts`

## Removed From Current Learning Scope

The previous contest, social/friendship, shop, notification, report/moderation, AI roadmap/debug, news, and mock interview flows are no longer part of the active product surface.
