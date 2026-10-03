# Deployment

Repo co Docker Compose cho development:

- `infra/docker-compose.yml`
- `.env.docker.example`
- `infra/judge0/judge0.env.example`

## Docker Compose Services

```mermaid
flowchart TB
  Frontend[web :5173] --> Main[api :6868]
  Main[api :6868] --> MySQL[(mysql :3306)]
  Main --> Redis[(redis :6379)]
  Worker[judge-worker] --> MySQL
  Worker --> Redis
```

| Service | Image/Build | Container | Port |
| --- | --- | --- | --- |
| `mysql` | `mysql:8.0` | `ocj_mysql` | `3307:3306` |
| `redis` | `redis:7-alpine` | `ocj_redis` | `6379:6379` |
| `web` | build `apps/web/Dockerfile` | `ocj_web` | `5173:5173` |
| `api` | build `apps/api/Dockerfile` | `ocj_api` | `6868:6868` |
| `judge-worker` | build `apps/judge-worker/Dockerfile` | `ocj_judge_worker` | none exposed |

## Volumes

```text
mysql_data -> /var/lib/mysql
redis_data -> /data
web_node_modules -> /app/node_modules
```

Redis chay voi:

```text
redis-server --appendonly yes
```

## Health And Dependencies

`api` phu thuoc:

- MySQL healthy.
- Redis started.

`judge-worker` phu thuoc:

- Redis started.

`web` phu thuoc:

- api started.

MySQL co healthcheck:

```text
mysqladmin ping -h localhost
```

## Run The Full Development Stack

1. Tao env:

   ```bash
   cp .env.docker.example .env.docker
   ```

2. Dien secrets va connection config trong `.env.docker`. File `.env.docker.example` duoc Docker Compose dung lam default cho dev, con `.env.docker` la override tuy chon nhung nen co trong staging/production.

3. Build va chay:

   ```bash
   npm run dev:docker
   ```

   Lenh nay tuong duong `docker compose -f infra/docker-compose.yml up -d --build --remove-orphans --wait --wait-timeout 120`.

4. Xem logs:

   ```bash
   docker compose -f infra/docker-compose.yml logs -f api
   docker compose -f infra/docker-compose.yml logs -f judge-worker
   ```

5. Dung stack:

   ```bash
   docker compose -f infra/docker-compose.yml down
   ```

## Environment Checklist

Truoc khi deploy production/staging, kiem tra:

- `DATABASE_URL` tro dung MySQL trong network Docker.
- `REDIS_HOST` la service name `redis` neu chay trong Docker network.
- JWT secrets khong dung default.
- Judge0 Docker sandbox config san sang.
- Cloudinary config neu bat upload avatar/assets.
- CORS origin neu can siet production.

## Database Migration

Prisma hien co migration folder:

```text
apps/api/prisma/migrations/
```

Trong Docker deploy nen dung Prisma migration workflow phu hop production, vi `db:push` tien cho dev nhung khong luu audit migration nhu `migrate deploy`.

## Production Notes

- Matchmaking queue hien dang in-memory trong api. Neu scale nhieu replica, can centralized queue/matchmaking.
- Socket.io khi scale nhieu instance can adapter Redis va sticky sessions/load balancer config.
- Worker concurrency hien la `2`; can tune theo CPU/RAM va Judge0 throughput.
- `removeOnFail: false` giup giu failed queue jobs de debug.
- Nen backup MySQL volume.
- Nen monitor Redis memory vi queue va Pub/Sub deu phu thuoc Redis.

## Public Endpoints

Neu deploy mac dinh:

```text
Frontend: http://<host>:5173
Main API: http://<host>:6868
Swagger:  http://<host>:6868/api-docs
```

Frontend service hien tai la Vite dev server de tien chay full stack bang Docker trong qua trinh dev. Neu can production web nghiem tuc, nen build `apps/web` va serve static bang Nginx/CDN hoac mot container static rieng.
