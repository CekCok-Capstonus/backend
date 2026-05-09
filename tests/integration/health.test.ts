import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../../src/app.js";

describe("GET /health", () => {
  it("should return server health status", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: "Server berfungsi dengan baik",
    });
  });
});
