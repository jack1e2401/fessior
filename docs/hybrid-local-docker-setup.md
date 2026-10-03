# Hybrid Local + Docker Setup

Hybrid mode is the default development flow:

- `apps/web` runs locally with Vite.
- `apps/api` runs locally with `tsx watch`.
- `apps/judge-worker` runs locally with `tsx watch`.
- `mysql` and `redis` run through `infra/docker-compose.yml`.
- Judge0 runs in Docker and is required for executing untrusted code. The executor only talks to the configured Judge0 Docker sandbox.

## One Command

From the repository root:

```powershell
npm install
npm run dev
```

`npm run dev` expands to:

```powershell
npm run dev:hybrid
```

The hybrid script:

1. Starts MySQL and Redis with Docker Compose.
2. Removes old orphan containers from previous compose versions.
3. Generates Prisma Client.
4. Pushes the Prisma schema to MySQL.
5. Builds shared `@ocj/*` packages.
6. Starts web, api, and judge-worker locally through Turbo.

## Infrastructure Only

```powershell
docker compose -f infra/docker-compose.yml up -d --remove-orphans --wait --wait-timeout 120 mysql redis judge0-server judge0-workers
```

Default ports:

```text
MySQL: localhost:3307
Redis: localhost:6379
```

## Optional Local Env

The services have local defaults, so `.env` files are optional for normal dev.

Main service default:

```dotenv
PORT=6868
DATABASE_URL="mysql://root:ocj_root_secret@localhost:3307/ocj_main_db"
REDIS_HOST="localhost"
REDIS_PORT=6379
JWT_ACCESS_SECRET="your_jwt_access_secret_here"
JWT_REFRESH_SECRET="your_jwt_refresh_secret_here"
```

Worker service default:

```dotenv
DATABASE_URL="mysql://root:ocj_root_secret@localhost:3307/ocj_main_db"
REDIS_HOST="localhost"
REDIS_PORT=6379
JUDGE0_URL="http://localhost:2358"
```

## Seed Data

```powershell
npm run seed
```

The seed script creates demo users, tags, problems, testcases, and submissions in MySQL. It is for local/dev only and clears demo tables before recreating data.

Sample accounts:

- Admin: `admin@example.com` / `password123`
- User: `tester@example.com` / `password123`

## URLs

- Frontend Vite: `http://localhost:5173`
- Main API: `http://localhost:6868`
- Swagger: `http://localhost:6868/api-docs`
- MySQL: `localhost:3307`
- Redis: `localhost:6379`
- Judge0 sandbox: `http://localhost:2358`

## Stop

Stop local app terminals with `Ctrl + C`.

Stop Docker infrastructure:

```powershell
docker compose -f infra/docker-compose.yml stop mysql redis
```

Remove containers:

```powershell
docker compose -f infra/docker-compose.yml down --remove-orphans
```
