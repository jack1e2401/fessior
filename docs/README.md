# OCJ Documentation

Thu muc nay tong hop tai lieu ky thuat cho du an Online Code Judge (OCJ), duoc viet lai dua tren source hien tai cua monorepo.

## Danh muc tai lieu

| File | Noi dung |
| --- | --- |
| [project-structure.md](project-structure.md) | Cau truc monorepo, vai tro tung app/package. |
| [architecture.md](architecture.md) | Kien truc tong quan va cac thanh phan he thong. |
| [testcase-import.md](testcase-import.md) | Hop dong ZIP import va trang thai hien tai. |
| [sandbox-security.md](sandbox-security.md) | Judge0 config va phan hardening con thieu. |
| [feature-flows.md](feature-flows.md) | Cac luong chuc nang chinh, so do va file lien quan. |
| [database-mysql-prisma-erd.md](database-mysql-prisma-erd.md) | ERD MySQL/Prisma va giai thich cac bang chinh. |
| [database-boundaries.md](database-boundaries.md) | Quyen so huu du lieu MySQL-only va consistency cua submission flow. |
| [api-overview.md](api-overview.md) | Tong quan REST API modules va route prefix. |
| [judging-pipeline.md](judging-pipeline.md) | Luong nop bai, queue BullMQ, worker cham bai va realtime update. |
| [realtime-matchmaking.md](realtime-matchmaking.md) | Socket.io events, 1v1 matchmaking, Redis Pub/Sub. |
| [auth-and-permissions.md](auth-and-permissions.md) | Authentication, refresh token, session revoke, role/permission. |
| [development-setup.md](development-setup.md) | Huong dan chay local/dev. |
| [hybrid-local-docker-setup.md](hybrid-local-docker-setup.md) | Huong dan hybrid: FE/api/judge-worker chay local, MySQL/Redis/Judge0 chay Docker. |
| [testing.md](testing.md) | Cau truc va cach chay test. |
| [deployment.md](deployment.md) | Docker Compose, VPS scripts, env va cac luu y trien khai. |
| [ai-agent-docs-rules.md](ai-agent-docs-rules.md) | Rule cho AI agent: moi thay doi repo phai sync docs. |

## Source chinh

- Prisma schema: `apps/api/prisma/schema.prisma`
- API routes: `apps/api/src/modules/*/*.route.ts`
- Socket flow: `apps/api/src/realtime/*`
- Worker flow: `apps/judge-worker/src/submissions/submission.worker.ts`
- Shared contracts: `packages/contracts/`
