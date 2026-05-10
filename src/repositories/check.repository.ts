import { pool } from "../config/db.js";

type CreateTextCheckInput = {
  title?: string;
  content: string;
};

export async function createTextCheck(input: CreateTextCheckInput) {
  // create data berita dan mengembalikan semua data
  const result = await pool.query(
    `
    INSERT INTO checks (input_type, title, content)
    VALUES ('text', $1, $2)
    RETURNING
      id,
      input_type,
      source_url,
      title,
      content,
      label,
      confidence_score,
      status,
      category,
      explanation,
      error_message,
      evidence_refs,
      created_at,
      updated_at
    `,
    [input.title ?? null, input.content],
  );

  return result.rows[0];
}

type GetChecksInput = {
  page: number;
  limit: number;
  search?: string;
};

export async function getChecks(input: GetChecksInput) {
  const offset = (input.page - 1) * input.limit;
  const values: unknown[] = [];
  const where: string[] = [];

  if (input.search) {
    values.push(`%${input.search}%`);
    where.push(
      `(title ILIKE $${values.length} OR content ILIKE $${values.length})`,
    );
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  values.push(input.limit);
  const limitParam = values.length;

  values.push(offset);
  const offsetParam = values.length;

  // ambil data sesuai dengan kondisi filter
  const dataQuery = `
    SELECT
      id,
      input_type,
      source_url,
      title,
      content,
      label,
      confidence_score,
      status,
      category,
      explanation,
      error_message,
      evidence_refs,
      created_at,
      updated_at
    FROM checks
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${limitParam}
    OFFSET $${offsetParam}
    `;

  // hitung total data yang sesuai dengan kondisi filter
  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM checks
    ${whereClause}
    `;

  // jalankan kedua query bersama
  const [dataResult, countResult] = await Promise.all([
    pool.query(dataQuery, values),
    pool.query(countQuery, values.slice(0, values.length - 2)),
  ]);

  const total = countResult.rows[0].total as number;

  return {
    data: dataResult.rows,
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      total_pages: Math.ceil(total / input.limit),
    },
  };
}
