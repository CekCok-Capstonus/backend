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
      explanation,
      error_message,
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
  label?: "hoax" | "valid";
  sort_by: "newest" | "oldest" | "confidence_high" | "confidence_low";
};

export async function getChecks(input: GetChecksInput) {
  const offset = (input.page - 1) * input.limit;
  const conditions: string[] = [];
  const params: (string | number)[] = [];
  let paramIndex = 1;

  if (input.search) {
    conditions.push(
      `(title ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`,
    );
    params.push(`%${input.search}%`);
    paramIndex++;
  }

  if (input.label) {
    conditions.push(`label = $${paramIndex}`);
    params.push(input.label);
    paramIndex++;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  let orderByClause = "ORDER BY created_at DESC";
  switch (input.sort_by) {
    case "oldest":
      orderByClause = "ORDER BY created_at ASC";
      break;
    case "confidence_high":
      orderByClause =
        "ORDER BY confidence_score DESC NULLS LAST, created_at DESC";
      break;
    case "confidence_low":
      orderByClause =
        "ORDER BY confidence_score ASC NULLS LAST, created_at DESC";
      break;
    case "newest":
    default:
      orderByClause = "ORDER BY created_at DESC";
      break;
  }

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM checks ${whereClause}`,
    params,
  );

  const total = parseInt(countResult.rows[0].count);

  params.push(input.limit, offset);

  // ambil data sesuai dengan kondisi filter
  const result = await pool.query(
    `
    SELECT
      id,
      input_type,
      source_url,
      title,
      content,
      label,
      confidence_score,
      status,
      explanation,
      error_message,
      created_at,
      updated_at
    FROM checks
    ${whereClause}
    ${orderByClause}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `,
    params,
  );

  return {
    data: result.rows,
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      total_pages: Math.ceil(total / input.limit),
    },
  };
}

export async function getCheckById(id: string) {
  const result = await pool.query(
    `
    SELECT
      id,
      input_type,
      source_url,
      title,
      content,
      label,
      confidence_score,
      status,
      explanation,
      error_message,
      created_at,
      updated_at
    FROM checks
    WHERE id = $1
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

type CreateUrlCheckInput = {
  source_url: string;
  title?: string | null;
  content: string;
};

export async function createUrlCheck(input: CreateUrlCheckInput) {
  const result = await pool.query(
    `
       INSERT INTO checks (input_type, source_url, title, content)
       VALUES ('url', $1, $2, $3)
       RETURNING
         id,
         input_type,
         source_url,
         title,
         content,
         label,
         confidence_score,
         status,
         explanation,
         error_message,
         created_at,
         updated_at
       `,
    [input.source_url, input.title ?? null, input.content],
  );

  return result.rows[0];
}

type UpdateCheckResultInput = {
  id: string;
  label: "hoax" | "valid";
  confidence_score: number;
  status: "success" | "fail";
  error_message?: string;
  explanation?: string;
};

export async function updateCheckResult(input: UpdateCheckResultInput) {
  const result = await pool.query(
    `
    UPDATE checks
    SET
      label = $2,
      confidence_score = $3,
      status = $4,
      error_message = $5,
      explanation = $6,
      updated_at = NOW()
    WHERE id = $1
    RETURNING
      id,
      input_type,
      source_url,
      title,
      content,
      label,
      confidence_score,
      status,
      explanation,
      error_message,
      created_at,
      updated_at
    `,
    [
      input.id,
      input.label,
      input.confidence_score,
      input.status,
      input.error_message ?? null,
      input.explanation ?? null,
    ],
  );

  return result.rows[0];
}
