import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../../src/app.js";

describe("GET /health/db", () => {
  it("should return database health status", async () => {
    const res = await request(app).get("/health/db");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Database berfungsi dengan baik");
    expect(res.body.data.now).toBeDefined();
  });
});
