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
