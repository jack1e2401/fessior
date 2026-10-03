# Realtime Matchmaking

Realtime duoc xu ly trong api bang Socket.io. Socket server duoc tao trong `apps/api/src/server.ts`, init trong `apps/api/src/realtime/socket.server.ts`, va dang ky match event handlers qua `apps/api/src/modules/matches/match.socket.ts`.

## Socket Authentication

Socket handshake can co token:

```text
socket.handshake.auth.token
```

Hoac:

```text
socket.handshake.query.token
```

Token duoc verify bang `verifyAccessToken`. Neu thieu hoac invalid, connection bi reject.

## Socket Events

Events duoc khai bao trong `packages/contracts/socket.ts`.

| Event | Direction | Vai tro |
| --- | --- | --- |
| `connect` | client -> server | Ket noi socket. |
| `disconnect` | client -> server | Ngat ket noi, remove user khoi queue va online set. |
| `error` | server -> client | Bao loi socket/action. |
| `join-queue` | client -> server | Vao matchmaking queue. |
| `leave-queue` | client -> server | Roi matchmaking queue. |
| `forfeit-match` | client -> server | Dau hang/roi match. |
| `join-match` | client -> server | Vao room cua tran dau 1v1. |
| `leave-match` | client -> server | Roi room cua tran dau 1v1. |
| `queue-status` | server -> client | Trang thai queue cua user. |
| `match-found` | server -> client | Da tim thay tran 1v1. |
| `rival-submission` | server -> client | Doi thu vua co submission update. |
| `match-ended` | server -> client | Tran ket thuc va ELO updated. |

## Rooms

| Room name | Muc dich |
| --- | --- |
| `user:{userId}` | Room rieng tung user, dung cho direct/user-scoped event. |
| `match:{matchId}` | Room cua tran 1v1 matchmaking. |

## Online Users

Khi socket connect:

```text
redis.sadd('online_users', userId)
```

Khi disconnect:

```text
redis.srem('online_users', userId)
```

## Matchmaking Flow

```mermaid
sequenceDiagram
  participant C1 as Client A
  participant C2 as Client B
  participant Socket as Main Service Socket
  participant MySQL as MySQL

  C1->>Socket: join-queue
  Socket->>MySQL: get user + ELO
  Socket-->>C1: queue-status QUEUED

  C2->>Socket: join-queue
  Socket->>MySQL: get user + ELO
  Socket->>Socket: sort queue by ELO and pick closest pair
  Socket->>MySQL: pick random Problem
  Socket->>MySQL: create Match(PENDING)
  Socket->>Socket: join both sockets to match:{matchId}
  Socket-->>C1: match-found
  Socket-->>C2: match-found
```

## Matchmaking Algorithm

Implementation: `apps/api/src/modules/matches/matchmaking.service.ts`

1. Queue luu in-memory trong bien `matchmakingQueue`.
2. Moi player co `userId`, `socketId`, `username`, `elo`.
3. Khi co it nhat 2 player, sort queue theo ELO tang dan.
4. Tim cap player lien ke co ELO diff nho nhat.
5. Remove 2 player khoi queue.
6. Pick random MySQL `Problem`.
7. Tao MySQL `Match` status `PENDING`.
8. Emit `match-found`.

## Submission Update In Match

```mermaid
flowchart LR
  Worker[Worker Service] -->|publish submission-updates| Redis[(Redis)]
  Redis -->|subscribe| Socket[Main Service Socket]
  Socket -->|handleSubmissionUpdate| Match[Find active MySQL Match]
  Match --> Emit[RIVAL_SUBMISSION]
  Match -->|ACCEPTED| End[endMatch transaction]
  End --> Elo[Update ELO for both players]
  End --> Done[MATCH_ENDED]
```

## Forfeit

Client emit:

```text
forfeit-match
```

Payload:

```json
{
  "matchId": "..."
}
```

Server tim match, xac dinh user con lai la winner, sau do goi `endMatch`.

## Active Match Recovery (F5 Reload)

Khi user dang trong mot tran dau (`status: PENDING`) nhung vo tinh F5 hoac bi mat mang ket noi lai:
1. Sockets se bi disconnect.
2. Frontend se tu dong goi API `GET /api/v1/matches/active` de kiem tra xem co match nao dang `PENDING` khong.
3. Neu co, he thong se block user tim tran moi va hien thi banner de user click vao quay tro lai URL `/match/:matchId`.
4. Khi vao lai URL `/match/:matchId`, user se tu dong join lai Socket room `match:{matchId}`.

## Realtime Participant Status & ELO Updates

Component `<MatchParticipantStatus />` tren giao dien match render trang thai cua hai nguoi choi (Dang code..., Sai KQ, Hoan thanh).
He thong MySQL `Match` khoi tao hai ban ghi `MatchParticipant` o trang thai `CODING` khi bat dau tran 1v1.
Khi Socket ban event `RIVAL_SUBMISSION`, trang thai participant duoc cap nhat tren giao dien.

Khi ket thuc tran (endMatch), logic `calculateEloPvP` luu so diem thay doi vao cot `score_change` cua `MatchParticipant`. Lich su `Recent Matches` o man hinh Home dung du lieu nay de hien thi ELO thay doi.

## Production Notes

Matchmaking queue dang nam trong memory cua mot api instance. Neu scale nhieu instance, can dua queue sang Redis hoac dung sticky session + centralized matchmaking service.
