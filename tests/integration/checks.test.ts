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

describe("GET /api/checks", () => {
  it("should return checks list with pagination", async () => {
    const res = await request(app).get("/api/checks").query({
      page: 1,
      limit: 10,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(10);
    expect(res.body.pagination.total).toBeDefined();
  });

  it("should reject invalid pagination", async () => {
    const res = await request(app)
      .get("/api/checks")
      .query({ page: 0, limit: 10 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should sort by oldest", async () => {
    const res = await request(app)
      .get("/api/checks")
      .query({ sort_by: "oldest" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should sort by confidence high", async () => {
    const res = await request(app)
      .get("/api/checks")
      .query({ sort_by: "confidence_high" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should sort by confidence low", async () => {
    const res = await request(app)
      .get("/api/checks")
      .query({ sort_by: "confidence_low" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should reject invalid sort_by", async () => {
    const res = await request(app)
      .get("/api/checks")
      .query({ sort_by: "invalid" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe("GET /api/checks/:id", () => {
  it("should reject invalid uuid", async () => {
    const res = await request(app).get("/api/checks/id-random");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 404 when check not found", async () => {
    const res = await request(app).get(
      "/api/checks/00000000-0000-0000-0000-000000000000",
    );

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("should return check detail by id", async () => {
    const createRes = await request(app).post("/api/checks").send({
      title: "Judul berita test",
      content:
        " Ini adalah konten berita mnimal untuk melakukan pengujian endpoint create check.",
    });

    const id = createRes.body.data.id;

    const res = await request(app).get(`/api/checks/${id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(id);
  });
});

describe("POST /api/checks/url", () => {
  it("should reject invalid url", async () => {
    const res = await request(app).post("/api/checks/url").send({
      url: "not-url",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should reject localhost url", async () => {
    const res = await request(app).post("/api/checks/url").send({
      url: "http://localhost:3000",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
