import { pool } from "../config/db.js";

export async function getAnalyticsSummary() {
  const result = await pool.query(
    `
    SELECT
      COUNT(*)::int AS total_checks,

      COUNT(*) FILTER (WHERE status = 'progress')::int AS total_progress,
      COUNT(*) FILTER (WHERE status = 'success')::int AS total_success,
      COUNT(*) FILTER (WHERE status = 'fail')::int AS total_fail,

      COUNT(*) FILTER (WHERE label = 'hoax')::int AS total_hoax,
      COUNT(*) FILTER (WHERE label = 'valid')::int AS total_valid,

      COUNT(*) FILTER (WHERE input_type = 'text')::int AS total_text,
      COUNT(*) FILTER (WHERE input_type = 'url')::int AS total_url
    FROM checks
    `,
  );

  return result.rows[0];
}
