# LearnHub

LearnHub la ung dung hoc truc tuyen gom frontend Next.js va backend FastAPI. Repo nay duoc chuan hoa de nhom co the clone ve chay local, day code len GitHub va deploy theo mo hinh:

- Frontend: Vercel
- Backend: Render hoac Railway
- Database: Supabase PostgreSQL
- Storage: Supabase Storage, neu can upload file ben vung
- Source code: GitHub

## Cong nghe

Frontend:

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui style components

Backend:

- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL
- JWT authentication

## Cau truc thu muc

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
|-- .gitignore
`-- README.md
```

## Chuan bi moi truong

Can cai san:

- Python 3.11+
- Node.js 20+
- PostgreSQL local hoac Supabase PostgreSQL
- Git

Khong commit cac file sau len GitHub:

- `.env`, `.env.local`
- `.venv/`
- `node_modules/`
- `.next/`
- `__pycache__/`
- `Backend/uploads/`
- file log, cache, report sinh ra khi chay app

## Chay backend local

```powershell
cd Backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

Sua file `Backend/.env`:

```env
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/learnhub
SECRET_KEY=change-this-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
```

Tao database local neu chua co:

```sql
CREATE DATABASE learnhub;
```

Chay migration:

```powershell
alembic upgrade head
```

Tao du lieu mau:

```powershell
python -m app.seed
```

Chay backend:

```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Kiem tra:

- API root: `http://127.0.0.1:8000/`
- Swagger docs: `http://127.0.0.1:8000/docs`

Tai khoan demo sau khi seed deu dung mat khau `Demo@123`:

- `admin123`
- `instructor123`
- `student123`

## Chay frontend local

```powershell
cd Frontend
npm install
copy .env.example .env.local
npm run dev
```

File `Frontend/.env.local` can tro den backend:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

Mo frontend tai:

```text
http://localhost:3000
```

## Bien moi truong

Backend:

| Bien | Y nghia |
| --- | --- |
| `DATABASE_URL` | Connection string PostgreSQL dung cho SQLAlchemy |
| `SECRET_KEY` | Khoa ky JWT, can thay bang chuoi dai va bi mat khi deploy |
| `ALGORITHM` | Thuat toan JWT, mac dinh `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Thoi gian het han access token |
| `CORS_ORIGINS` | Danh sach domain frontend duoc phep goi API |

Frontend:

| Bien | Y nghia |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL cua backend API, vi du `https://your-api.onrender.com/api` |

## Deploy database tren Supabase

1. Tao project tren Supabase.
2. Vao Project Settings > Database de lay connection string.
3. Dung URI dang PostgreSQL va them driver `postgresql+psycopg2://` cho backend.
4. Dat `DATABASE_URL` nay vao Render/Railway.
5. Chay migration production:

```bash
alembic upgrade head
```

Luu y: khong dua mat khau Supabase vao GitHub. Chi dat trong Environment Variables cua dich vu deploy.

## Deploy backend tren Render

Tao Web Service moi tu GitHub repo:

- Root Directory: `Backend`
- Runtime: Python
- Build Command: `pip install -r requirements.txt`
- Start Command: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`

Environment Variables:

```env
DATABASE_URL=postgresql+psycopg2://...
SECRET_KEY=your-production-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
CORS_ORIGINS=["https://your-frontend.vercel.app"]
```

Sau khi service co bien moi truong, chay migration cho database production bang shell cua Render/Railway:

```bash
alembic upgrade head
```

## Deploy backend tren Railway

Tao service tu GitHub repo:

- Root Directory: `Backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`

Dat cac bien moi truong tuong tu Render. Railway thuong tien hon neu nhom muon quan ly service va logs nhanh.

## Deploy frontend tren Vercel

Tao project tu GitHub repo:

- Framework Preset: Next.js
- Root Directory: `Frontend`
- Install Command: `npm install`
- Build Command: `npm run build`

Environment Variables:

```env
NEXT_PUBLIC_API_URL=https://your-backend-domain/api
```

Sau khi backend co domain that, cap nhat lai:

- `NEXT_PUBLIC_API_URL` tren Vercel
- `CORS_ORIGINS` tren backend de cho phep domain Vercel

## Ghi chu ve upload file

Hien backend co mount thu muc local `Backend/uploads` tai route `/uploads`. Cach nay dung duoc khi chay local, nhung khong phu hop cho deploy lau dai vi file tren Render/Railway co the mat khi service restart hoac redeploy.

Neu app can upload video, tai lieu, anh khoa hoc hoac minh chung giang vien, nen chuyen sang Supabase Storage:

1. Upload file tu backend len Supabase Storage.
2. Luu public URL hoac storage path vao database.
3. Frontend hien thi file bang URL da luu.
4. Khong commit noi dung trong `Backend/uploads` len GitHub.

## Quy trinh lam viec nhom

Khuyen nghi:

1. Moi thanh vien clone repo tu GitHub.
2. Moi nguoi tao file `.env` rieng tu `.env.example`.
3. Lam tinh nang tren branch rieng, vi du `feature/course-review`.
4. Mo Pull Request vao `main`.
5. Kiem tra frontend build va backend migration truoc khi merge.
6. Deploy tu branch `main`.

Lenh kiem tra nhanh truoc khi day code:

```powershell
cd Frontend
npm run build
```

```powershell
cd Backend
alembic upgrade head
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

## API response

Backend tra response thong nhat:

```json
{
  "success": true,
  "message": "OK",
  "data": {}
}
```

Khi loi, API tra `success: false` kem `message` va `data` neu co.
