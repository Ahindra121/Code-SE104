Hiện tại:
- Lesson đã có video_url trong database
- Video đang được lưu local trong backend/uploads để chạy local
- Frontend đã có trang xem lesson
- Backend đã có auth/user hiện tại

Yêu cầu:
Hãy bổ sung chức năng:
1. Xem video bài học
2. Theo dõi tiến độ học
3. Resume video khi quay lại
4. Không cho tua nhanh vượt quá phần đã xem
5. Cho phép pause và tua lại
6. Hoàn thành bài học khi xem >= 90%
7. Xem tài liệu trực tiếp + tải tài liệu

QUAN TRỌNG:
- Chỉ chỉnh sửa phần liên quan đến lesson video/document/progress.
- Không refactor toàn bộ project.
- Không thay đổi flow auth, user, course, enrollment nếu không cần.
- Tận dụng route, model, service, component hiện có.
- Nếu project đã có progress table thì tận dụng, không tạo trùng.

==================================================
VIDEO PLAYER LOGIC
==================================================

Yêu cầu:
- User được:
  ✔ pause
  ✔ play
  ✔ tua lại đoạn đã xem

- User KHÔNG được:
  ✖ tua nhanh vượt quá phần đã xem

Cách xử lý:
- Lưu:
  max_watched_seconds
- Nếu user seek tới thời gian:
  > max_watched_seconds + 2 giây
→ tự động kéo video về max_watched_seconds

Frontend cần dùng:
- onTimeUpdate
- onSeeking
- onLoadedMetadata
- onPause
- onEnded

==================================================
DATABASE / PROGRESS
==================================================

Kiểm tra project đã có bảng progress chưa.
Nếu chưa có thì tạo:

lesson_progress
- id
- user_id
- lesson_id
- watched_seconds
- max_watched_seconds
- duration_seconds
- progress_percent
- is_completed
- completed_at
- updated_at

Unique:
- user_id
- lesson_id

Ý nghĩa:
- watched_seconds:
  vị trí hiện tại để resume video

- max_watched_seconds:
  mốc xa nhất user đã xem
  dùng để chống tua nhanh

==================================================
BACKEND API
==================================================

1. API update progress:
POST /api/lessons/{lesson_id}/progress

Request body:
{
  "watched_seconds": number,
  "max_watched_seconds": number,
  "duration_seconds": number,
  "progress_percent": number
}

2. Backend:
- lấy user_id từ auth hiện tại
- không cho frontend tự gửi user_id

3. Logic:
- không cho progress giảm xuống
- nếu max_watched_seconds mới < cũ
→ giữ giá trị cũ

4. Nếu:
progress_percent >= 90
→ is_completed = true

5. Nếu đã completed:
→ không reset completed = false

6. API lấy progress:
GET /api/lessons/{lesson_id}/progress

Response:
{
  "watched_seconds": 350,
  "max_watched_seconds": 520,
  "progress_percent": 86,
  "is_completed": false
}

==================================================
FRONTEND VIDEO
==================================================

1. Tìm video player hiện tại.

2. Thêm:

<video
  controls
  onLoadedMetadata={handleLoadedMetadata}
  onTimeUpdate={handleTimeUpdate}
  onSeeking={handleSeeking}
  onPause={handlePause}
  onEnded={handleEnded}
>
  <source
    src={`${API_BASE_URL}${lesson.video_url}`}
    type="video/mp4"
  />
</video>

==================================================
RESUME VIDEO
==================================================

Khi load lesson:
- gọi:
GET /api/lessons/{lesson_id}/progress

Nếu có watched_seconds:
→ set:
video.currentTime = watched_seconds

Nếu có max_watched_seconds:
→ lưu vào:
maxWatchedRef.current

==================================================
ANTI FAST FORWARD
==================================================

Logic:
- user được tua lại
- user không được tua vượt quá:
  max_watched_seconds + 2 giây

Ví dụ:
- đã xem tới 120s
- tua tới 300s
→ tự kéo về 120s

==================================================
SAVE PROGRESS
==================================================

Không gọi API mỗi giây.

Chỉ save khi:
- mỗi 10–15 giây
- pause
- ended
- beforeunload

Lưu:
- watched_seconds
- max_watched_seconds
- duration_seconds
- progress_percent

==================================================
COMPLETION LOGIC
==================================================

1. Nếu:
progress_percent >= 90
→ lesson completed

2. Hiển thị:
✔ Đã hoàn thành

3. Nếu course có nhiều lessons:
Tính:
completed_lessons / total_lessons

==================================================
DOCUMENT VIEWER
==================================================

Lesson có:
- document_url
- document_name
- document_type

Nếu là PDF:
Hiển thị trực tiếp:

<iframe
  src={`${API_BASE_URL}${lesson.document_url}`}
  className="w-full h-[700px] rounded-lg border"
/>

Nếu là:
- doc
- docx
- ppt
- pptx

Hiển thị:
“Tài liệu này không hỗ trợ xem trực tiếp.”

==================================================
DOCUMENT BUTTONS
==================================================

Hiển thị:
- [Xem tài liệu]
- [Tải tài liệu]

Nút tải:
- tải file về máy

Nếu lesson không có video nhưng có tài liệu:
Hiển thị:
[Đánh dấu đã hoàn thành]

API:
POST /api/lessons/{lesson_id}/complete

→ set completed = true

==================================================
UI/UX
==================================================

Hiển thị:
- Chưa bắt đầu
- Đang học
- Đã hoàn thành

Nếu completed:
- icon check màu xanh
- badge “Completed”

Có progress bar:
Ví dụ:
65%

==================================================
KỸ THUẬT
==================================================

1. Không hard-code localhost nếu project đã có API_BASE_URL.
2. Dùng fetch/axios/API client hiện có.
3. Không tạo code trùng nếu project đã có route/model tương tự.
4. Tận dụng auth hiện tại.
5. Code rõ ràng, dễ hiểu, phù hợp đồ án môn học.

==================================================
SAU KHI CODE XONG
==================================================

1. Liệt kê tất cả file đã chỉnh sửa.
2. Giải thích:
- backend flow
- progress flow
- anti fast forward logic
- resume logic
- completion logic
- document viewer logic

3. Hướng dẫn test:
- xem video tới 30%
- refresh vẫn resume đúng vị trí
- tua lại được
- tua nhanh vượt quá phần đã xem bị chặn
- xem >= 90% → completed
- xem PDF trực tiếp
- tải tài liệu
- kiểm tra database progress