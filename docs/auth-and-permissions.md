# Auth And Permissions

Authentication dung JWT access token + refresh token luu trong MySQL. Middleware chinh nam trong `apps/api/src/modules/auth/auth.middleware.ts`.

## Token Types

| Token | Utility | TTL | Muc dich |
| --- | --- | --- | --- |
| Access token | `generateAccessToken` | `15m` | Goi protected REST API va auth Socket.io. |
| Refresh token | `generateRefreshToken` | `7d` | Xin access token moi, quan ly session. |

JWT payload:

```ts
{
  userId: string;
  role: string;
}
```

Refresh token co them `jti` random trong payload luc sign.

## Password

Password duoc hash bang bcrypt:

```text
salt rounds: 10
```

Helpers:

- `hashPassword`
- `comparePassword`

## REST Auth Middleware

Protected endpoint can header:

```text
Authorization: Bearer <accessToken>
```

`requireAuth` thuc hien:

1. Kiem tra header ton tai va bat dau bang `Bearer `.
2. Verify access token.
3. Tim user trong MySQL theo `decoded.userId`.
4. Neu user khong ton tai hoac `is_banned = true`, tra `401`.
5. Gan `req.user = decoded`.

`requireAdmin` thuc hien:

1. Kiem tra `req.user`.
2. Kiem tra `req.user.role === 'ADMIN'`.
3. Neu khong dung, tra `403`.

## Socket Auth

Socket.io auth nam trong `apps/api/src/realtime/socket.ts`.

Token duoc lay tu:

```text
socket.handshake.auth.token
socket.handshake.query.token
```

Socket middleware verify access token. Neu thieu/invalid token, socket connect bi reject.

Luu y: REST `requireAuth` co check `is_banned` trong MySQL. Socket middleware hien verify token, nhung khong query lai `is_banned`; neu can ban user realtime chat hon, nen bo sung check ban trong socket middleware.

## Auth Routes

Base path:

```text
/api/v1/auth
```

| Method | Path | Auth | Muc dich |
| --- | --- | --- | --- |
| `POST` | `/register` | Public | Dang ky user moi. |
| `POST` | `/login` | Public | Dang nhap, tra access/refresh token. |
| `POST` | `/logout` | Required | Revoke refresh token hien tai. |
| `POST` | `/refresh` | Public with refresh token | Xin access token moi. |
| `GET` | `/me` | Required | Lay user hien tai. |
| `POST` | `/change-password` | Required | Doi mat khau. |
| `GET` | `/sessions` | Required | Lay danh sach session. |
| `DELETE` | `/sessions/:sessionId` | Required | Revoke mot session. |
| `DELETE` | `/sessions` | Required | Revoke tat ca sessions. |
| `POST` | `/forgot-password` | Public | Gui/reset token qua email. |
| `POST` | `/reset-password` | Public with token | Dat lai mat khau. |

## Session Storage

Refresh token duoc luu trong bang `refresh_tokens`:

- `token`: unique.
- `user_id`: FK den `users`.
- `expires_at`.
- `user_agent`.
- `ip_address`.
- `last_used_at`.
- `is_revoked`.

Session revoke thuc chat la update/mark refresh token bi revoke.

## Roles

Prisma enum:

```text
USER
ADMIN
```

Admin-only behavior nam rai rac trong route files, vi du:

- User management.
- Problem create/update/delete.
- Submission and match inspection.

## Ban Behavior

User co cac field:

- `is_banned`
- `banned_at`
- `banned_reason`

REST protected routes se tu choi user bi ban trong `requireAuth`.
