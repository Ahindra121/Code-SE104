# LearnHub - Hệ Thống Học Trực Tuyến

LearnHub là đồ án website học trực tuyến gồm:

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Backend:** FastAPI, SQLAlchemy, Alembic
- **Database:** PostgreSQL
- **Storage upload file:** Supabase Storage

Tài liệu này hướng dẫn giảng viên hoặc thành viên nhóm pull source code về và chạy được dự án trên máy local.

## 1. Yêu Cầu Môi Trường

Cần cài sẵn:

- Git
- Python 3.11 trở lên
- Node.js 20 trở lên
- PostgreSQL local hoặc Supabase PostgreSQL
- Tài khoản Supabase nếu muốn test chức năng upload ảnh/video/tài liệu/minh chứng giảng viên

Kiểm tra phiên bản:

```powershell
python --version
node --version
npm --version
git --version
```

## 2. Cấu Trúc Thư Mục

```text
.
|-- Backend/
|   |-- alembic/
|   |-- app/
|   |   |-- core/
|   |   |-- dependencies/
|   |   |-- models/
|   |   |-- routers/
|   |   |-- schemas/
|   |   `-- services/
|   |-- .env.example
|   `-- requirements.txt
|-- Frontend/
|   |-- app/
|   |-- components/
|   |-- hooks/
|   |-- lib/
|   |-- public/
|   |-- .env.example
|   `-- package.json
|-- README.md
`-- .gitignore
```

## 3. Clone Hoặc Pull Source Code

Nếu chưa có source:

```powershell
git clone <link-repository>
cd "Code SE104"
```

Nếu đã có source:

```powershell
git pull
```

## 4. Cấu Hình Và Chạy Backend

Di chuyển vào thư mục Backend:

```powershell
cd Backend
```

Tạo môi trường ảo Python:

```powershell
python -m venv .venv
```

Kích hoạt môi trường ảo trên Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Nếu PowerShell chặn chạy script, dùng lệnh sau rồi kích hoạt lại:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Cài thư viện Backend:

```powershell
pip install -r requirements.txt
```

Tạo file môi trường:

```powershell
copy .env.example .env
```

Mở file `Backend/.env` và chỉnh các biến sau.

### Trường Hợp Dùng PostgreSQL Local

Tạo database tên `learnhub` bằng pgAdmin hoặc psql:

```sql
CREATE DATABASE learnhub;
```

Cấu hình `Backend/.env`:

```env
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/learnhub
SECRET_KEY=change-this-secret-key-before-deploy
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]

SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_COURSE_ASSETS_BUCKET=course-assets
SUPABASE_LESSON_FILES_BUCKET=lesson-files
SUPABASE_VERIFICATION_FILES_BUCKET=verification-files
```

Lưu ý:

- Nếu chỉ xem giao diện và dữ liệu mẫu, có thể tạm để nguyên các biến Supabase.
- Nếu test upload thumbnail, video, tài liệu hoặc minh chứng giảng viên thì phải cấu hình Supabase thật.

### Trường Hợp Dùng Supabase PostgreSQL

Lấy connection string trong Supabase ở phần **Project Settings > Database**.

Ví dụ:

```env
DATABASE_URL=postgresql+psycopg2://postgres.your-project-ref:your-password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

Nếu mật khẩu database có ký tự đặc biệt, cần URL encode mật khẩu trước khi đưa vào `DATABASE_URL`.

### Chạy Migration

Trong thư mục `Backend`, chạy:

```powershell
alembic upgrade head
```

### Tạo Dữ Liệu Mẫu

```powershell
python -m app.seed
```

Sau khi seed, có các tài khoản demo sau. Tất cả dùng mật khẩu:

```text
Demo@123
```

| Vai trò | Username | Email |
| --- | --- | --- |
| Admin | `admin123` | `admin@example.com` |
| Giảng viên | `instructor123` | `instructor@example.com` |
| Học viên | `student123` | `student@example.com` |

### Chạy Backend

```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Kiểm tra Backend:

- API root: `http://127.0.0.1:8000/`
- Swagger docs: `http://127.0.0.1:8000/docs`

Backend API có prefix `/api`, ví dụ:

```text
http://127.0.0.1:8000/api/auth/login
```

## 5. Cấu Hình Và Chạy Frontend

Mở terminal mới, từ thư mục gốc dự án di chuyển vào Frontend:

```powershell
cd Frontend
```

Cài thư viện:

```powershell
npm install
```

Tạo file môi trường:

```powershell
copy .env.example .env.local
```

Kiểm tra file `Frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

Chạy Frontend:

```powershell
npm run dev
```

Mở trình duyệt:

```text
http://localhost:3000
```

## 6. Thứ Tự Chạy Khi Demo

Nên chạy theo thứ tự:

1. Mở terminal 1, chạy Backend:

```powershell
cd Backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

2. Mở terminal 2, chạy Frontend:

```powershell
cd Frontend
npm run dev
```

3. Truy cập:

```text
http://localhost:3000
```

4. Đăng nhập bằng tài khoản demo, ví dụ:

```text
Username: admin123
Password: Demo@123
```

## 7. Cấu Hình Supabase Storage Cho Upload File

Dự án hiện tại dùng Supabase Storage cho các chức năng:

- Upload thumbnail khóa học
- Upload video bài học
- Upload tài liệu bài học
- Upload minh chứng xác minh giảng viên

Trong Supabase, tạo 3 bucket:

| Bucket | Mục đích |
| --- | --- |
| `course-assets` | Lưu ảnh thumbnail khóa học |
| `lesson-files` | Lưu video và tài liệu bài học |
| `verification-files` | Lưu file xác minh giảng viên |

Sau đó cấu hình trong `Backend/.env`:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_COURSE_ASSETS_BUCKET=course-assets
SUPABASE_LESSON_FILES_BUCKET=lesson-files
SUPABASE_VERIFICATION_FILES_BUCKET=verification-files
```

Lưu ý quan trọng:

- `SUPABASE_SERVICE_ROLE_KEY` là khóa bí mật, không commit lên GitHub.
- Nếu thiếu cấu hình Supabase, các chức năng upload sẽ báo lỗi.
- `course-assets` và `lesson-files` nên cho phép đọc public nếu muốn frontend hiển thị trực tiếp file đã upload.

## 8. Một Số Chức Năng Chính

### Học viên

- Đăng ký, đăng nhập
- Xem danh sách khóa học
- Đăng ký khóa học
- Xem bài học, cập nhật tiến độ học
- Làm quiz và final test
- Nhận chứng chỉ sau khi hoàn thành khóa học

### Giảng viên

- Gửi hồ sơ xác minh giảng viên
- Tạo và quản lý khóa học
- Upload thumbnail, video, tài liệu bài học
- Tạo bài kiểm tra cuối khóa
- Chấm bài tự luận trong final test nếu có
- Theo dõi học viên

### Admin

- Quản lý người dùng
- Duyệt hồ sơ giảng viên
- Duyệt khóa học
- Quản lý báo cáo
- Cấu hình giới hạn upload file

## 9. Các Lệnh Kiểm Tra Nhanh

Kiểm tra Frontend build:

```powershell
cd Frontend
npm run build
```

Kiểm tra Backend migration:

```powershell
cd Backend
alembic upgrade head
```

Chạy Backend:

```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## 10. Lỗi Thường Gặp

### Frontend báo không kết nối được máy chủ

Kiểm tra:

- Backend đã chạy ở `http://127.0.0.1:8000` chưa.
- File `Frontend/.env.local` có đúng:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

### Backend báo lỗi database

Kiểm tra:

- PostgreSQL đã chạy chưa.
- Database `learnhub` đã được tạo chưa.
- `DATABASE_URL` trong `Backend/.env` có đúng username, password, host, port, database chưa.

### Alembic không chạy được

Đảm bảo đang đứng trong thư mục `Backend`:

```powershell
cd Backend
alembic upgrade head
```

### Upload file bị lỗi

Kiểm tra:

- Đã tạo bucket Supabase chưa.
- `SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY` có đúng không.
- Tên bucket trong `.env` có khớp không:
  - `course-assets`
  - `lesson-files`
  - `verification-files`
- File upload có đúng định dạng và dung lượng cho phép không.

### PowerShell không cho activate môi trường ảo

Chạy:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Sau đó chạy lại:

```powershell
.\.venv\Scripts\Activate.ps1
```

## 11. Ghi Chú Khi Nộp Hoặc Chia Sẻ Source

Không commit các file/thư mục sau:

- `Backend/.env`
- `Frontend/.env.local`
- `Backend/.venv/`
- `Frontend/node_modules/`
- `Frontend/.next/`
- `__pycache__/`
- File log, cache, file tạm

Chỉ commit các file mẫu:

- `Backend/.env.example`
- `Frontend/.env.example`

## 12. API Response

Backend trả response thống nhất:

```json
{
  "success": true,
  "message": "OK",
  "data": {}
}
```

Khi lỗi:

```json
{
  "success": false,
  "message": "Error message",
  "data": null
}
```

## 13. Deploy Tham Khảo

Dự án đang dùng:

- Frontend: Vercel
- Backend: Railway
- Database: Supabase PostgreSQL
- Storage: Supabase Storage

### Deploy Backend Lên Railway

Tạo service mới trên Railway từ GitHub repository, sau đó cấu hình:

- Root Directory: `Backend`
- Build Command: để trống hoặc dùng mặc định của Railway
- Start Command:

```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Trong tab **Variables** của Railway, thêm các biến môi trường:

```env
DATABASE_URL=postgresql+psycopg2://username:password@host:port/database
SECRET_KEY=change-this-secret-key-before-deploy
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
CORS_ORIGINS=["https://your-frontend.vercel.app","http://localhost:3000"]

SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_COURSE_ASSETS_BUCKET=course-assets
SUPABASE_LESSON_FILES_BUCKET=lesson-files
SUPABASE_VERIFICATION_FILES_BUCKET=verification-files
```

Lưu ý:

- Railway tự cấp biến `$PORT`, không đặt cứng port `8000` khi deploy.
- Nếu dùng PostgreSQL của Railway, lấy `DATABASE_URL` trong service database của Railway.
- Nếu dùng Supabase PostgreSQL, dùng connection string của Supabase và giữ tiền tố `postgresql+psycopg2://`.
- `CORS_ORIGINS` phải chứa đúng domain frontend production trên Vercel.
- `SUPABASE_SERVICE_ROLE_KEY` là khóa bí mật, chỉ đặt trong Railway Variables, không commit lên GitHub.

Sau khi deploy backend thành công, kiểm tra:

```text
https://your-backend.up.railway.app/
https://your-backend.up.railway.app/docs
```

### Deploy Frontend Lên Vercel

Trong Vercel, cấu hình biến môi trường:

```env
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app/api
```

Sau khi đổi URL backend hoặc CORS, cần redeploy lại frontend/backend tương ứng.

### Chạy Migration Trên Production

Sau khi backend Railway đã có `DATABASE_URL`, chạy migration trong Railway shell hoặc local với cùng database production:

```bash
cd Backend
alembic upgrade head
```
