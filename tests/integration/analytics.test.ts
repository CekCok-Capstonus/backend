import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../../src/app.js";

describe("GET /api/analytics/summary", () => {
  it("should return analytics summary", async () => {
    const res = await request(app).get("/api/analytics/summary");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Ringkasan analytics berhasil diambil");

    expect(res.body.data.total_checks).toBeDefined();
    expect(res.body.data.total_progress).toBeDefined();
    expect(res.body.data.total_success).toBeDefined();
    expect(res.body.data.total_fail).toBeDefined();
    expect(res.body.data.total_hoax).toBeDefined();
    expect(res.body.data.total_valid).toBeDefined();
    expect(res.body.data.total_text).toBeDefined();
    expect(res.body.data.total_url).toBeDefined();
  });
});
