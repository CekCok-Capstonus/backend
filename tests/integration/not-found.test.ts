import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../src/app.js";

describe("404 Not Found", () => {
  it("should return not found error", async () => {
    const res = await request(app).get("/not-exist");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Route /not-exist tidak ditemukan");
  });
});
