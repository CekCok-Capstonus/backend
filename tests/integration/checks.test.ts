import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../../src/app.js";

describe("POST /api/checks", () => {
  it("should reject empty content", async () => {
    const res = await request(app).post("/api/checks").send({
      content: "",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should create text check with progress status", async () => {
    const res = await request(app).post("/api/checks").send({
      title: "Judul berita test",
      content:
        " Ini adalah konten berita mnimal untuk melakukan pengujian endpoint create check.",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.input_type).toBe("text");
    expect(res.body.data.status).toBe("progress");
    expect(res.body.data.label).toBeNull();
    expect(res.body.data.confidence_score).toBeNull();
  });
});
