# Fessior backend interview goal

## Đích đến

Biến repo thành một **online judge backend** có bốn câu chuyện kỹ thuật có thể giải thích và chứng minh bằng code, test, tài liệu:

1. Secure, versioned testcase ZIP ingestion.
2. Persistent, asynchronous, idempotent code judging.
3. Sandboxed execution of untrusted code qua Judge0/isolate.
4. Realtime 1v1 matchmaking với phân quyền và kết thúc trận atomically.

Mô tả đích cho README: **Online Judge backend with versioned testcase ingestion, asynchronous code judging, sandboxed untrusted-code execution, and realtime 1v1 matchmaking.** Auth, MySQL, Redis, BullMQ, Pub/Sub và Socket.io phục vụ bốn flow này. Frontend chỉ cần đủ để demo.

## Cách làm việc trong repo

- Làm **từng giai đoạn** theo thứ tự bên dưới. Mỗi giai đoạn phải có phần thay đổi review được, kiểm tra phù hợp và cập nhật tài liệu liên quan trước khi chuyển tiếp.
- **Không commit** trừ khi người dùng yêu cầu rõ ràng. Không tự tạo PR, deploy hay publish.
- Audit được dán là định hướng và danh sách giả thuyết cần kiểm chứng, không mặc định mọi nhận định về code hiện tại đều còn đúng. Đọc implementation, schema và tests trước khi sửa.
- Cấu trúc hiện tại gồm `apps/api`, `apps/judge-worker`, `apps/web`, `packages/contracts`, `packages/executor` và `infra`. Ưu tiên sửa có mục tiêu trong các module hiện có; không rewrite toàn repo chỉ vì cấu trúc.
- Khi cắt tính năng, tìm references, dependencies, routes, schema, migrations, seed, web và docs; giữ build/dev flow chạy được. Không xóa dữ liệu người dùng hoặc migration lịch sử một cách mù quáng.
- Không quảng cáo tính năng hoặc verdict chưa được implementation và test chứng minh. Chọn giá trị giới hạn cụ thể dựa trên Judge0, schema và nhu cầu demo, rồi ghi rõ trong docs/tests.

## Scope giữ lại

| Module | Phạm vi đích |
| --- | --- |
| Auth | Register, login, refresh, logout; USER/ADMIN. |
| Problem | CRUD, statement, starter code, CPU/time và memory limits. |
| Testcase | Admin ZIP import, validation, example/hidden cases, immutable versions. |
| Submission | Persistent state machine, BullMQ retry, idempotency, realtime result. |
| Sandbox | Judge0 riêng, giới hạn CPU/wall time, memory, process, file/output, network; security tests. |
| Match | Redis-backed 1v1 matchmaking theo ELO, member authorization, first AC wins, atomic ELO. |

Loại khỏi scope: chat/Gemini, comments, global leaderboard, custom room, N-player Arena, badges, tags và tag statistics, streak/activity, editorial video, shop, contest/friend/notification/report dead APIs, và web tương ứng. Password reset email và avatar Cloudinary đã được bỏ; EloHistory chỉ giữ nếu cần cho flow cốt lõi đã kiểm chứng. Dọn file noise và vendored Judge0 sau khi xác nhận chúng không còn cần cho dev/deploy. Không thêm S3/MinIO, Kafka hay transactional outbox chỉ để làm đẹp kiến trúc.

## Các hợp đồng kỹ thuật cần đạt

### Testcase ingestion và versioning

- Admin upload `multipart/form-data` tại `POST /api/v1/problems/:problemId/testcase-sets/import`, với ZIP gồm `manifest.json` và cặp `cases/*.in`, `cases/*.out`.
- Stream upload vào file tạm trên disk; giới hạn compressed bytes ngay khi nhận. Validate archive trước khi extract, validate manifest và toàn bộ cases trước khi ghi DB. Luôn cleanup file/thư mục tạm kể cả lỗi.
- Giới hạn tổng uncompressed bytes, số entry, bytes mỗi case và độ sâu path. Reject path traversal/absolute path, symlink, duplicate/ambiguous paths, entry/extension lạ, thiếu cặp input/output, manifest sai và archive có dấu hiệu zip bomb. Đảm bảo path đích nằm trong thư mục tạm bằng kiểm tra path chuẩn hoá và ranh giới thư mục.
- `Problem` trỏ tới active `TestcaseSet`; mỗi set có version/checksum và các `Testcase` có position/example flag. Import và đổi active set phải atomic. `Submission` chốt `testcaseSetId` lúc tạo; worker chỉ đọc version đó. Version cũ vẫn dùng được để reproduce submission cũ.
- Lưu payload testcase có giới hạn trong MySQL `TEXT` ở scope hiện tại; document ngưỡng và trade-off.

### Submission pipeline

- API persist `PENDING` trước khi enqueue. Job payload chỉ chứa `submissionId`, `jobId` xác định từ ID đó; worker load dữ liệu từ MySQL.
- Chỉ transition hợp lệ `PENDING -> PROCESSING -> terminal`; retry/duplicate delivery không được xử lý lại submission terminal hoặc ghi đè trạng thái mới. Các lỗi cuối cùng phải được lưu thành `SYSTEM_ERROR` có kiểm soát.
- Bịt khoảng trống insert thành công nhưng enqueue thất bại bằng enqueue retry và cơ chế reconciliation cho `PENDING` quá hạn/thiếu job. Không cần outbox ở giai đoạn này; ghi rõ giới hạn còn lại.
- Kết quả persist vào MySQL trước khi publish realtime event. Redis Pub/Sub chỉ là best-effort notification; API đọc trạng thái từ DB để client recover sau reconnect.

### Sandbox

- API và worker không chạy code người dùng trong process/container ứng dụng; worker gọi Judge0/isolate. Judge0 chỉ trên private Docker network hoặc bind `127.0.0.1` cho hybrid dev; không public `2358`.
- Worker truyền limits của `Problem` đến executor và map thành cấu hình Judge0 thực tế: CPU, wall time, memory, processes, file/output. Network bị tắt; compiler/command arguments do server kiểm soát; additional files/callbacks tắt nếu không cần.
- Judge0 không có application DB access hoặc app secrets. Xác minh mapping `MLE`; implement và test đúng hoặc bỏ claim nếu Judge0 không cung cấp tín hiệu đáng tin cậy.
- Integration tests tối thiểu: AC, WA, CE, RE, infinite loop/TLE, memory limit, process limit, network denied, output/file bound.

### Realtime 1v1

- Chỉ 1v1, hai participants cho mỗi match. Tránh lưu trùng `player1_id`/`player2_id` với `MatchParticipant` khi normalize schema.
- Socket `join-match` và `forfeit-match` phải xác minh authenticated user là participant; submit có `matchId` phải kiểm tra membership, problem, trạng thái trận và cửa sổ nhận submission.
- First accepted submission kết thúc trận bằng DB compare-and-set trên trạng thái `RUNNING`; chỉ bên thắng race được update ELO, một lần và trong transaction. Emit `MATCH_ENDED` sau commit.
- Matchmaking queue chuyển khỏi in-memory sang Redis để không phụ thuộc một API instance; chọn thao tác atomic và xử lý disconnect/rejoin. Client reconnect đọc `GET /submissions/:id` và `GET /matches/:id` để khôi phục state.

## Thứ tự thực hiện

- [ ] **1. Thu gọn scope:** audit references rồi bỏ feature ngoài scope, dead API/web, noise và vendored Judge0; giữ dev/build hoạt động.
  - [x] Gỡ `tags`, `problem_tags`, `user_tag_stats`, `badges`, `user_badges` và toàn bộ API, seed, contract, Swagger, web flow phụ thuộc; baseline Phase 2 và DB dev đã cập nhật.
- [x] **2. Chuẩn hoá domain:** `Problem -> TestcaseSet -> Testcase`, `Submission -> TestcaseSet`, `Match + MatchParticipant`.
  - [x] TestcaseSet version theo Problem, active set tường minh, Submission pin set lúc tạo, worker đọc set đã pin; seed và tests cho quan hệ này. Dev DB dùng baseline migration mới sau khi người dùng xác nhận có thể reset dữ liệu và thay lịch sử migration cũ bị hỏng.
  - [x] `MatchParticipant` là nguồn dữ liệu duy nhất cho hai người chơi, status và ELO delta; bỏ `player1_id`/`player2_id` và status trùng khỏi `Match`, cập nhật baseline cho DB dev reset sạch, repository/service/web và tests. Baseline không migrate dữ liệu production cũ.
- [x] **3. Testcase ingestion:** ZIP import an toàn, atomic version activation, cleanup và tests cho archive hợp lệ/độc/lỗi DB/version cũ; GET chỉ trả example cases cho user thường.
- [x] **4. Submission hardening:** ID-only job, deterministic job ID, guarded transitions, retries, reconciliation và tests cho duplicate/crash/exhausted retries.
- [x] **5. Sandbox hardening:** private Judge0, limits thật, verdict mapping, threat cases và integration tests; per-process/thread limits và giới hạn aggregate chưa chứng minh được trên Docker Desktop được ghi rõ trong docs.
- [ ] **6. Realtime 1v1:** bỏ room/Arena, Redis matchmaking, authorization, match-bound submit, atomic winner/ELO, reconnect recovery và race tests.
- [ ] **7. Interview polish:** structured logs với `submissionId`/`jobId`/`matchId`, liveness/readiness, graceful shutdown, focused architecture/security docs, README chỉ nêu bốn technical stories và demo web tối thiểu.

## Tiêu chí hoàn tất

- README, routes, schema, UI và docs cùng mô tả một scope; không còn feature ngoài scope được quảng cáo hay dead references gây lỗi build.
- Có tests có ý nghĩa cho ZIP Slip/zip bomb/rollback/version pinning; worker duplicate/retry/reconciliation; sandbox limits; unauthorized match actions và simultaneous AC/ELO once.
- Có thể demo: admin import ZIP -> user submit -> worker judge version đã pin -> verdict realtime; hai user match 1v1 -> first AC kết thúc trận -> reconnect đọc đúng kết quả từ DB.
- Chạy và ghi nhận kết quả build, lint, tests và flow dev phù hợp với thay đổi. Mỗi kết luận về security/isolation phải dựa trên config hoặc test quan sát được.

Nguồn định hướng: bản audit backend interview người dùng cung cấp trong cuộc trò chuyện ngày 2026-10-03. Tài liệu này là goal và quy tắc triển khai; chưa phải bằng chứng rằng các hạng mục đã được thực hiện.
