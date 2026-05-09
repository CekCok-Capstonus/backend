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
- [ ] Membangun RESTful API untuk mendukung aplikasi Front-End.
- [ ] Membuat RESTful API dengan URL yang mengikuti standar konvensi RESTful.
- [ ] Mengintegrasikan kemampuan AI/ML sebagai fitur utama aplikasi, baik melalui back-end aplikasi maupun langsung pada perangkat pengguna (browser).
- [ ] Memastikan implementasi fitur utama yang dikembangkan dalam proyek berjalan dengan baik tanpa menyebabkan aplikasi crash.
- [ ] RESTful API dapat menyimpan data ke dalam database.
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
