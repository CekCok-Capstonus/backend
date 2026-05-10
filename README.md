# CekCok Backend

Backend API untuk aplikasi **CekCok - Cek dulu supaya cocok!** - sistem Klasifikasi berita hoaks/valid berbasis AI.

## Tech Stack

- Node.JS
- Express.JS
- TypeScript
- PostgreSQL
- Docker Compose

## Checkpoint pengerjaan

- [ ] Backend melakukan HTTP request ke AI inference API.
- [x] Membangun RESTful API untuk mendukung aplikasi Front-End.
- [x] Membuat RESTful API dengan URL yang mengikuti standar konvensi RESTful.
- [ ] Mengintegrasikan kemampuan AI/ML sebagai fitur utama aplikasi, baik melalui back-end aplikasi maupun langsung pada perangkat pengguna (browser).
- [x] Memastikan implementasi fitur utama yang dikembangkan dalam proyek berjalan dengan baik tanpa menyebabkan aplikasi crash.
- [x] RESTful API dapat menyimpan data ke dalam database.
- [x] RESTful API dibangun menggunakan framework Express.
- [ ] Deploy backend API ke Vercel.

## Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/CekCok-Capstonus/backend.git
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

```bash
cp .env.example .env
```

Contoh .env:

```bash
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cekcok
NODE_ENV=development
```

### 4. Start postgresql di docker

```bash
docker compose up -d
```

Cek container:

```bash
docker ps
```

### 5. Jalankan database migration

```bash
docker exec -i cekcok-postgres psql -U postgres -d cekcok < database/migrations/001_init.sql
```

### 6. Masuk ke postgresql shell

```bash
docker exec -it cekcok-postgres psql -U postgres -d cekcok
```

### 7. Cek database

```bash
\dt
```

Cek detail table:

```bash
\d+ checks
```

## API Endpoints

Base URL local:

```txt
http://localhost:3000
```

### Health

#### GET /health

Cek server.

#### GET /health/db

Cek koneksi database.

---

### Checks

#### POST /api/checks

Membuat pengecekan dari teks berita.

Request:

```json
{
  "title": "Judul berita",
  "content": "Isi berita minimal 20 karakter..."
}
```

Response:

```json
{
  "success": true,
  "message": "Pengecekan berita berhasil dibuat",
  "data": {
    "id": "...",
    "input_type": "text",
    "title": "Judul berita",
    "content": "...",
    "status": "progress"
  }
}
```

#### POST /api/checks/url

Membuat pengecekan dari URL berita.

Request:

```json
{
  "url": "https://www.tempo.co/..."
}
```

Response:

```json
{
  "success": true,
  "message": "Pengecekan berita dari URL berhasil dibuat",
  "data": {
    "id": "...",
    "input_type": "url",
    "source_url": "https://www.tempo.co/...",
    "title": "...",
    "content": "...",
    "status": "progress"
  },
  "extraction": {
    "source": "tempo.co",
    "published": "2026-05-10T10:15:00+07:00",
    "quality": "clean"
  },
  "steps": [
    {
      "key": "visit_url",
      "label": "Mengunjungi www.tempo.co",
      "status": "success"
    }
  ]
}
```

#### GET /api/checks

Mengambil riwayat pengecekan.

Query:

```txt
  page=1
  limit=10
  search=keyword
```

Example:

```txt
  GET /api/checks?page=1&limit=10&search=politik
```

#### GET /api/checks/:id

Mengambil detail pengecekan berdasarkan ID.

---

### Analytics

#### GET /api/analytics/summary

Mengambil ringkasan analytics.

Response:

```json
{
  "success": true,
  "message": "Ringkasan analytics berhasil diambil",
  "data": {
    "total_checks": 10,
    "total_progress": 8,
    "total_success": 1,
    "total_fail": 1,
    "total_hoax": 1,
    "total_valid": 0,
    "total_text": 5,
    "total_url": 5
  }
}
```

---

### Testing

Cek TypeScript Lint:

```bash
npm run typecheck
```

Cek integration test:

```bash
npm run test
```

Build:

```bash
npm run build
```
