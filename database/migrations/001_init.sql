CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    input_type VARCHAR(20) NOT NULL CHECK (input_type IN ('text','url')),
    source_url TEXT,
    title TEXT,
    content TEXT NOT NULL,

    label VARCHAR(20) CHECK (label IN ('hoax','valid')),
    confidence_score NUMERIC(5,4) CHECK (confidence_score >= 0 AND confidence_score <= 1), -- tingkat keyakinan model

    status VARCHAR(20) NOT NULL DEFAULT 'progress' CHECK(status IN('progress','success','fail')), -- status inference ke backend ai engineer

    category VARCHAR(50) DEFAULT 'general', -- politik, tekno, ekonomi dll.
    explanation TEXT, -- kesimpulan singkat dari generative ai

    error_message TEXT,

    evidence_refs JSONB DEFAULT '[]'::jsonb, -- daftar rujukan berita [{ title: "Penyakit MPOX Bukan karena Efek Vaksin COVID-19", url:"https://kemkes.go.id/id/penyakit-mpox-bukan-karena-efek-vaksin-covid-19", source:"kemkes.go.id", date: "2 September 2024"}] max 3 berita

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- validasi kondisi data valid untuk mencegah data success tapi hasilnya kosong
    CONSTRAINT checks_success_requires_result CHECK (status != 'success' OR (label IS NOT NULL AND confidence_score IS NOT NULL)),

    -- validasi kondisi data error untuk memastikan jika data error maka error_message tidak boleh kosong
    CONSTRAINT checks_fail_requires_error CHECK (
      status != 'fail'
      OR NULLIF(TRIM(error_message), '') IS NOT NULL
    )
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- safer buat re migrate skema agar tidak terjadi error
DROP TRIGGER IF EXISTS trg_checks_updated_at ON checks;

CREATE TRIGGER trg_checks_updated_at
BEFORE UPDATE ON checks
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_checks_label ON checks(label);
CREATE INDEX IF NOT EXISTS idx_checks_category ON checks(category);
CREATE INDEX IF NOT EXISTS idx_checks_status ON checks(status);
CREATE INDEX IF NOT EXISTS idx_checks_input_type ON checks(input_type);
CREATE INDEX IF NOT EXISTS idx_checks_created_at ON checks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checks_source_url ON checks(source_url);
-- indeks untuk mendukung fitur pencarian agar lebih cepat dari ILIKE biasa
CREATE INDEX IF NOT EXISTS idx_checks_title_trgm ON checks USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_checks_content_trgm ON checks USING GIN (content gin_trgm_ops);
