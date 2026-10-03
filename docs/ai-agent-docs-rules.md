# AI Agent Documentation Rules

File nay la rule bat buoc cho bat ky AI agent nao sua repo OCJ. Muc tieu: moi thay doi code/deployment/database/API/flow deu cap nhat `docs/` de tai lieu luon dung voi source.

## Prime Directive

Khi sua hoac bo sung bat ky hanh vi nao trong repo, agent phai kiem tra tac dong den docs. Neu source thay doi lam docs sai, thieu hoac cu, agent phai cap nhat docs trong cung change set.

Khong coi task la hoan tat neu code da doi nhung docs lien quan chua duoc sync.

## Required Workflow

1. Doc source lien quan truoc khi sua.
2. Xac dinh docs nao bi anh huong trong `docs/`.
3. Sua code/config/test theo yeu cau.
4. Cap nhat docs bi anh huong.
5. Neu them luong moi, cap nhat `feature-flows.md`.
6. Neu them/sua database schema, cap nhat database docs.
7. Neu them/sua API route, cap nhat API docs va flow docs neu can.
8. Neu them/sua env/deployment script/Docker, cap nhat setup/deployment docs.
9. Neu them/sua test strategy, cap nhat testing docs.
10. Cap nhat `docs/README.md` neu them file docs moi.
11. Chay review nhanh docs: link dung, diagram dung, khong noi trai source.

## Docs Ownership Map

| Khi thay doi... | Phai xem/cap nhat |
| --- | --- |
| Cau truc folder, workspace, package moi | `project-structure.md`, `architecture.md`, `README.md` |
| App/service moi | `architecture.md`, `project-structure.md`, `deployment.md`, `feature-flows.md` |
| Prisma schema/migration | `database-mysql-prisma-erd.md`, `database-boundaries.md`, `feature-flows.md` |
| API route/controller/service moi | `api-overview.md`, `feature-flows.md` |
| Auth/role/session/permission | `auth-and-permissions.md`, `api-overview.md`, `feature-flows.md` |
| Submission/queue/worker/executor | `judging-pipeline.md`, `architecture.md`, `feature-flows.md`, `deployment.md` neu co infra |
| Socket event/realtime/matchmaking | `realtime-matchmaking.md`, `feature-flows.md`, `packages/contracts` docs references |
| Frontend view/component workflow | `feature-flows.md`, docs module lien quan |
| Env var moi | `development-setup.md`, `deployment.md` |
| Docker/deploy/VPS script | `deployment.md`, `development-setup.md` neu anh huong local |
| Test framework/test command | `testing.md`, docs flow lien quan neu test bao phu behavior moi |
| Third-party integration | `architecture.md`, `development-setup.md`, `deployment.md`, flow lien quan |

## Database Rules

Neu thay doi `apps/api/prisma/schema.prisma`:

- Cap nhat ERD trong `database-mysql-prisma-erd.md`.
- Cap nhat phan nhom bang/field neu model/field moi co y nghia nghiep vu.
- Ghi ro quan he nao la Prisma `@relation`, quan he nao chi la logical reference.
- Cap nhat `database-boundaries.md` neu ownership hoac consistency cua MySQL data thay doi.

## API Rules

Neu them/sua route trong `apps/api/src/modules/*/*.route.ts`:

- Cap nhat `api-overview.md` neu prefix/module/endpoint group thay doi.
- Cap nhat `feature-flows.md` neu route tham gia luong chinh.
- Cap nhat `auth-and-permissions.md` neu middleware auth/admin/role thay doi.
- Dam bao docs ghi dung base path `/api/v1`.

## Flow Rules

Neu them chuc nang moi hoac thay doi luong nghiep vu lon:

- Them hoac sua section trong `feature-flows.md`.
- Section phai co:
  - Mo ta ngan.
  - Mermaid diagram.
  - Danh sach file lien quan.
- File lien quan nen gom web, route, controller, service, repository, validator, model/schema va shared package neu co.

## Realtime And Queue Rules

Neu thay doi Socket.io event:

- Cap nhat `realtime-matchmaking.md`.
- Cap nhat `feature-flows.md` neu event anh huong luong chinh.
- Cap nhat references toi `packages/contracts/`.

Neu thay doi BullMQ/Redis/Judge flow:

- Cap nhat `judging-pipeline.md`.
- Cap nhat `architecture.md` neu them thanh phan moi.
- Cap nhat `deployment.md` neu can service/env/port moi.

## Setup, Testing, Deployment Rules

Neu thay doi script trong `package.json`:

- Cap nhat `development-setup.md` hoac `testing.md`.

Neu thay doi Docker Compose/Dockerfile/deploy scripts:

- Cap nhat `deployment.md`.
- Cap nhat service ports, volumes, env checklist, dependency order.

Neu them test suite hoac test command:

- Cap nhat `testing.md`.
- Neu test bao phu flow quan trong, ghi vao flow docs lien quan khi huu ich.

## Style Rules

- Viet docs bang Markdown.
- Dung Mermaid cho flow/architecture/ERD khi co the.
- Giu docs ngan gon nhung trace duoc source.
- Uu tien ASCII de dong bo voi bo docs hien tai.
- Dung path code chinh xac.
- Khong viet docs theo suy doan neu chua doc source.
- Neu behavior chua chac, ghi ro "hien tai" hoac "can verify" va tro den file source.

## Completion Checklist

Truoc khi ket thuc task, agent phai tu hoi:

- Code/config/schema/API vua doi co lam docs nao sai khong?
- `docs/README.md` co can them link khong?
- `feature-flows.md` co can them/sua flow khong?
- Database docs co con khop Prisma schema khong?
- Setup/deployment/testing docs co con chay dung command moi khong?
- Mermaid diagram co con dung voi source khong?
- `git status` co cho thay docs da duoc cap nhat khi can khong?

Neu cau tra loi cho bat ky muc nao la "co the", hay doc source va cap nhat docs truoc khi final.
