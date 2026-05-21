# LearnHub Backend

Backend FastAPI cho nền tảng khóa học trực tuyến. Code nằm riêng trong `Backend/` và không thay đổi frontend hiện có.

## Công nghệ

- FastAPI, SQLAlchemy, Alembic
- PostgreSQL
- JWT access token
- Passlib bcrypt
- CORS cho Next.js frontend ở `localhost:3000`

## Chạy backend

1. Tạo database PostgreSQL:

```sql
CREATE DATABASE learnhub;
```

2. Cấu hình môi trường:

```powershell
cd Backend
copy .env.example .env
```

Sửa `DATABASE_URL` và `SECRET_KEY` trong `.env`.

3. Cài requirements:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

4. Chạy migration:

```powershell
alembic upgrade head
```

5. Tạo dữ liệu mẫu:

```powershell
.\.venv\Scripts\python.exe -m app.seed
```

Tài khoản mẫu đều dùng mật khẩu `Demo@123`:

- `admin123`
- `instructor123`
- `student123`

6. Chạy server:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Nếu terminal đang ở thư mục gốc đồ án `D:\Code SE104`, chạy:

```powershell
cd Backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Không nên chạy bằng lệnh `python` chung của máy nếu máy có nhiều Python, vì có thể trỏ nhầm sang Python của pgAdmin/PostgreSQL và thiếu thư viện backend.

Docs: `http://127.0.0.1:8000/docs`

## Response JSON

API trả về dạng thống nhất:

```json
{
  "success": true,
  "message": "OK",
  "data": {}
}
```

Lỗi cũng trả `success: false` kèm `message`.

## Endpoint chính cho frontend

- `POST /api/auth/register`: đăng ký `student` hoặc `instructor`
- `POST /api/auth/login`: đăng nhập bằng `username` hoặc `email`
- `GET /api/auth/me`: lấy user hiện tại
- `PATCH /api/users/me`: cập nhật tài khoản
- `GET /api/users`: admin xem danh sách user
- `PATCH /api/users/{user_id}/status`: admin khóa/mở tài khoản
- `GET /api/courses`: danh sách khóa học đã duyệt, hỗ trợ `keyword`, `category`, `min_price`, `max_price`, `level`
- `GET /api/courses/{course_id}`: chi tiết khóa học
- `GET /api/courses/mine`: instructor xem khóa học của mình
- `POST /api/courses`: instructor tạo khóa học
- `PATCH /api/courses/{course_id}`: instructor cập nhật khóa học của mình
- `DELETE /api/courses/{course_id}`: instructor xóa mềm/ẩn khóa học
- `PATCH /api/courses/{course_id}/moderation`: admin duyệt/từ chối khóa học
- `GET /api/lessons/course/{course_id}`: danh sách bài học
- `POST /api/lessons`: instructor thêm bài học
- `GET /api/lessons/{lesson_id}`: xem bài học, yêu cầu ghi danh nếu là student
- `POST /api/enrollments`: student ghi danh khóa học
- `GET /api/enrollments/mine`: student xem khóa đã ghi danh
- `PATCH /api/enrollments/{enrollment_id}/cancel`: hủy ghi danh nếu chưa học
- `POST /api/progress`: cập nhật tiến độ học, tự hoàn thành nếu xem >= 90%
- `GET /api/progress/course/{course_id}`: phần trăm hoàn thành khóa học
- `GET /api/questions/lesson/{lesson_id}`: câu hỏi quiz; student không nhận đáp án đúng
- `POST /api/questions`: instructor thêm câu hỏi
- `POST /api/quizzes/submit`: student nộp quiz, điểm >= 5 là đạt
- `POST /api/certificates/course/{course_id}`: cấp chứng chỉ nếu đủ điều kiện
- `GET /api/certificates/mine`: chứng chỉ của student
- `POST /api/reviews`: student đánh giá khóa học đã đăng ký
- `GET /api/reviews/course/{course_id}`: danh sách đánh giá
- `GET /api/reports/student`: thống kê cá nhân
- `GET /api/reports/instructor`: thống kê khóa học của instructor
- `GET /api/reports/admin`: thống kê toàn hệ thống

## Ghi chú tích hợp frontend

Frontend đã có `Frontend/.env.local` trỏ tới:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

Các màn hình `login`, `register` và `search` đã bắt đầu gọi API backend thật. Login lưu token vào `localStorage` với key `learnhub-auth-token` và gửi header:

```http
Authorization: Bearer <access_token>
```

Để chạy thử liên kết FE/BE:

```powershell
# Terminal 1
cd Backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Terminal 2
cd Frontend
npm run dev
```

Mở frontend tại `http://localhost:3000`, đăng nhập bằng `student123 / Demo@123`, rồi vào trang `/search` để thấy danh sách khóa học lấy từ backend. Các field khóa học backend đã có `title`, `category`, `description`, `price`, `thumbnail_url`, `level`, `rating`, `reviews_count`, `students_count`, `lessons_count`, `instructor` để map sang card khóa học hiện tại.
