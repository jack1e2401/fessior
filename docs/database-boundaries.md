# Database Ownership

OCJ now uses MySQL as the only application database. Prisma is the single ORM boundary for api and judge-worker.

## MySQL Owns

- Identity and auth: `users`, refresh tokens, password reset tokens.
- Problem catalog: `problems`, `problem_tags`, `tags`.
- Judge data: `testcases`, `submissions`.
- Competition runtime: `matches`, `match_participants`. Legacy `custom_rooms` and `custom_room_participants` await a data-safe migration.
- Learning/profile support: badges, ELO history, activities, user tag stats.

## Why One Database

The project is intended to be easy to operate and explain in interviews. Keeping problem content, testcase data, submissions, and user/match state in MySQL avoids cross-database consistency concerns:

- A submission and its problem/testcases can be read in one Prisma-backed workflow.
- Worker-service does not need a second DB connection.
- `npm run dev` only needs MySQL and Redis.
- Data cleanup/seed scripts are simpler and safer for local demos.

## Submission Consistency

The submission flow is intentionally transactional at the application boundary:

1. Main-service validates the problem by `id` or `slug`.
2. Main-service creates a MySQL `submissions` row with status `PENDING`.
3. Main-service enqueues the BullMQ job.
4. Worker-service loads the same submission/problem/testcases from MySQL.
5. Worker-service updates verdict fields on the submission row.
6. Worker-service publishes a Redis event for realtime UI/match updates.

## Removed Scope

Contest, social/friendship, shop, notification, report/moderation, AI roadmap/debug, and news modules are not part of the current active backend scope.
