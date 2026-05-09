import express from "express";
import { pool } from "./config/db.js";

export const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Server berfungsi dengan baik",
  });
});

app.get("/health/db", async (req, res) => {
  const result = await pool.query("SELECT NOW()");

  res.status(200).json({
    success: true,
    message: "Database berfungsi dengan baik",
    data: {
      now: result.rows[0].now,
    },
  });
});
