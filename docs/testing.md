# Testing

Repo co test o api, judge-worker va web.

## Root Test

Chay tu root:

```bash
npm run test
```

Root script dung Turborepo:

```bash
turbo run test
```

## Main Service Tests

Main-service dung Jest, ts-jest va Supertest.

Chay tat ca test:

```bash
cd apps/api
npm run test
```

Script:

```json
{
  "test": "jest --runInBand"
}
```

Test files:

```text
apps/api/src/tests/
  auth.test.ts
  setup.ts
```

Chay mot suite:

```bash
npm run test src/tests/auth.test.ts
```

## Frontend Tests

Frontend dung Vitest va Testing Library.

Chay:

```bash
cd apps/web
npm run test
```

Script:

```json
{
  "test": "vitest run"
}
```

Files lien quan:

```text
apps/web/src/test/setup.ts
apps/web/src/components/layout/Navbar.test.tsx
```

## Worker Tests

Worker E2E tests need to be rebuilt for the current MySQL-only judge flow. New tests should seed MySQL `problems`, `testcases`, and `submissions`, enqueue a BullMQ job, then assert the updated MySQL submission verdict.

## Test Dependencies

Test backend co the can:

- MySQL running neu test cham Prisma.
- Redis running neu test cham queue/socket.
- Env JWT secrets.
- Mock hoac API key neu test cham external services.

## Suggested Test Order For Dev

1. Chay unit/integration test api:

   ```bash
   cd apps/api
   npm run test
   ```

2. Chay web test:

   ```bash
   cd apps/web
   npm run test
   ```

3. Chay worker E2E sau khi viet lai suite MySQL-only cho queue/Judge0.

## Coverage Gaps To Watch

- Worker E2E coverage for MySQL-only submission judging.
- Queue retry/recovery khi worker fail giua chung.
- Socket matchmaking khi multi-instance.
- Judge0 timeout/error mapping.
- Ban user behavior tren Socket.io.
