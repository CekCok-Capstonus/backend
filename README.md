# CekCok Backend

Backend API untuk aplikasi **CekCok - Cek dulu supaya cocok!** - sistem Klasifikasi berita hoaks/valid berbasis AI.

## Tech Stack

- Node.JS
- Express.JS
- TypeScript
- PostgreSQL
- Docker Compose

## Checkpoint pengerjaan

- [x] Backend melakukan HTTP request ke AI inference API.
- [x] Membangun RESTful API untuk mendukung aplikasi Front-End.
- [x] Membuat RESTful API dengan URL yang mengikuti standar konvensi RESTful.
- [x] Mengintegrasikan kemampuan AI/ML sebagai fitur utama aplikasi, baik melalui back-end aplikasi maupun langsung pada perangkat pengguna (browser).
- [x] Memastikan implementasi fitur utama yang dikembangkan dalam proyek berjalan dengan baik tanpa menyebabkan aplikasi crash.
- [x] RESTful API dapat menyimpan data ke dalam database.
- [x] RESTful API dibangun menggunakan framework Express.
- [x] Deploy backend API ke Vercel.

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
AI_API_URL=http://localhost:8000
AI_API_TIMEOUT=30000
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
docker exec -i cekcok-postgres psql -U postgres -d cekcok < database/migrations/003_final_schema.sql
```

### 6. Verifikasi database

```bash
docker exec -it cekcok-postgres psql -U postgres -d cekcok
```

```sql
  \dt
  \d+ checks
  \dx
```

### 7. Jalankan development server

```bash
   npm run dev
```

Server akan berjalan di `http://localhost:3000`

## API Documentation

Base URL local: `http://localhost:3000`

### Health endpoint

#### GET /health

Cek status server.

Response:

```json
{
  "success": true,
  "message": "Server berfungsi dengan baik"
}
```

#### GET /health/db

Cek koneksi database.

Response:

```json
{
  "success": true,
  "message": "Database berfungsi dengan baik",
  "data": {
    "now": "2026-05-17T03:49:56.005Z"
  }
}
```

---

### Checks endpoint

#### POST /api/checks

Membuat pengecekan dari teks berita.

Request:

```json
{
  "title": "Judul berita (opsional)",
  "content": "Isi berita minimal 20 karakter..."
}
```

Response:

```json
{
  "success": true,
  "message": "Pengecekan berita berhasil dibuat",
  "data": {
    "id": "e4048de6-b923-4ab4-bccf-ea8d079fa3ee",
    "input_type": "text",
    "source_url": null,
    "title": "Judul berita",
    "content": "Isi berita...",
    "label": null,
    "confidence_score": null,
    "status": "progress",
    "explanation": null,
    "error_message": null,
    "created_at": "2026-05-17T03:51:32.593Z",
    "updated_at": "2026-05-17T03:51:32.593Z"
  }
}
```

> Status awal `progress`, setelah 2-5 detik akan berubah menjadi `success` atau `fail` dengan hasil klasifikasi.

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
    "id": "25721c50-87e9-4022-adc8-473547ee2e84",
    "input_type": "url",
    "source_url": "https://www.tempo.co/politik/prabowo-soroti-kolusi-aparat-dan-kapitalis-dalam-kasus-marsinah-2136141",
    "title": "Prabowo: Akan Ada Tambahan 3 Smart Board",
    "content": "PRESIDEN Prabowo Subianto mengatakan...",
    "label": null,
    "confidence_score": null,
    "status": "progress",
    "explanation": null,
    "error_message": null,
    "created_at": "2026-05-17T03:54:22.169Z",
    "updated_at": "2026-05-17T03:54:22.169Z"
  },
  "extraction": {
    "source": "tempo.co",
    "published": "2026-05-16T15:03:57+07:00",
    "quality": "clean"
  },
  "steps": [
    {
      "key": "visit_url",
      "label": "Mengunjungi www.tempo.co",
      "status": "success"
    },
    {
      "key": "extract_title",
      "label": "Judul artikel berhasil ditemukan",
      "status": "success"
    },
    {
      "key": "extract_content",
      "label": "Isi konten berhasil diekstrak",
      "status": "success"
    },
    {
      "key": "clean_content",
      "label": "Konten berhasil dibersihkan",
      "status": "success"
    },
    {
      "key": "ai_check",
      "label": "Menunggu proses pengecekan AI",
      "status": "warning"
    }
  ]
}
```

List website berita yang sudah dicoba dan hasilnya cukup bersih:

- Tempo.co (blocked)
- Kompas.com
- Detik.com
- CNNIndonesia.com
- Liputan6.com
- Kumparan.com
- Antaranews.com
- Tribunnews.com
- Suara.com
- Viva.co.id

#### GET /api/checks

Mengambil riwayat pengecekan dengan pagination, search, filter, dan sorting.

Query parameter:

| Parameter | Type   | Default | Description                                                     |
| --------- | ------ | ------- | --------------------------------------------------------------- |
| page      | number | 1       | Halaman yang ingin diambil                                      |
| limit     | number | 10      | Jumlah data per halaman (max 50)                                |
| search    | string | -       | Cari berdasarkan title atau content                             |
| label     | string | -       | Filter: `hoax` atau `valid`                                     |
| sort_by   | string | newest  | Sorting: `newest`, `oldest`, `confidence_high`, confidence_low` |

Contoh:

```
  GET /api/checks?page=1&limit=10
  GET /api/checks?search=politik
  GET /api/checks?label=hoax
  GET /api/checks?sort_by=confidence_high
```

Response:

```json
{
    "success": true,
    "message": "Daftar riwayat pengecekan berhasil diambil",
    "data": [
        {
            "id": "132a5037-3159-4042-bd7a-f5b518f64041",
            "input_type": "text",
            "source_url": null,
            "title": "Judul berita",
            "content": "Isi berita...",
            "label": "hoax",
            "confidence_score": "0.9786",
            "status": "success",
            "explanation": "Sistem mendeteksi...",
            "error_message": null,
            "created_at": "2026-05-16T07:59:52.600Z",
            "updated_at": "2026-05-16T07:59:53.604Z"
        },
        {...}
    ],
    "pagination": {
        "page": 1,
        "limit": 10,
        "total": 13,
        "total_pages": 2
    }
}
```

#### GET /api/checks/:id

Mengambil detail pengecekan berdasarkan ID.

Response:

```json
{
  "success": true,
  "message": "Detail pengecekan berhasil diambil",
  "data": {
    "id": "a31c5986-08d2-4dea-8bdf-24e165d237fd",
    "input_type": "text",
    "source_url": null,
    "title": "Judul berita",
    "content": "Isi berita lengkap...",
    "label": "hoax",
    "confidence_score": "0.9708",
    "status": "success",
    "explanation": "Berdasarkan analisis mendalam menggunakan <strong>ensemble model AI</strong> (BiLSTM, GRU, CNN-BiLSTM), konten ini              \n <strong>terindikasi kuat sebagai informasi yang tidak akurat</strong> dengan tingkat keyakinan <strong>97.1%</strong>. Model ...",
    "error_message": null,
    "created_at": "2026-05-17T04:11:13.620Z",
    "updated_at": "2026-05-17T04:11:14.007Z"
  }
}
```

> Field `explanation` berisi HTML formatting (`<strong>`, `<em>`, `<u>`) untuk styling di frontend.

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
    "total_checks": 60,
    "total_progress": 27,
    "total_success": 20,
    "total_fail": 13,
    "total_hoax": 19,
    "total_valid": 14,
    "total_text": 45,
    "total_url": 15
  }
}
```

---

### Error responses

```json
{
  "success": false,
  "message": "Error message"
}
```

---

### HTTP Status code:

| Code | Description           |
| ---- | --------------------- |
| 200  | Success               |
| 201  | Created               |
| 400  | Bad Request           |
| 404  | Not Found             |
| 422  | Unprocessable Entity  |
| 500  | Internal Server Error |
| 504  | Gateway Timeout       |

---

### Testing

```bash
npm run typecheck # Type check
npm run test # Run all tests
npm run build # Build production
```
