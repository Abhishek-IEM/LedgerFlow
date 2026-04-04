import request from "supertest";
import app from "../src/app";

let adminToken: string;
let viewerToken: string;
let createdRecordId: string;

beforeAll(async () => {
  // register an admin and a viewer for these tests
  const adminEmail = `admin_rec_${Date.now()}@test.com`;
  const viewerEmail = `viewer_rec_${Date.now()}@test.com`;

  const adminRes = await request(app)
    .post("/api/auth/register")
    .send({ name: "Admin Rec", email: adminEmail, password: "admin1234" });
  adminToken = adminRes.body.data.token;

  const viewerRes = await request(app)
    .post("/api/auth/register")
    .send({ name: "Viewer Rec", email: viewerEmail, password: "viewer1234" });
  viewerToken = viewerRes.body.data.token;

  // promote the admin user — we need to hit the DB directly since our test user
  // was created as VIEWER by default
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  await prisma.user.update({
    where: { email: adminEmail },
    data: { role: "ADMIN" },
  });
  await prisma.$disconnect();
});

describe("Records endpoints", () => {
  it("POST /api/records — 201 for ADMIN with valid body", async () => {
    const res = await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        amount: 5000,
        type: "INCOME",
        category: "Salary",
        date: "2025-06-15T00:00:00.000Z",
        notes: "Test salary",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.category).toBe("Salary");
    createdRecordId = res.body.data.id;
  });

  it("POST /api/records — 403 for VIEWER", async () => {
    const res = await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${viewerToken}`)
      .send({
        amount: 1000,
        type: "EXPENSE",
        category: "Rent",
        date: "2025-06-15T00:00:00.000Z",
      });

    expect(res.status).toBe(403);
  });

  it("POST /api/records — 401 without token", async () => {
    const res = await request(app)
      .post("/api/records")
      .send({ amount: 1000, type: "INCOME", category: "Gift", date: "2025-06-15T00:00:00.000Z" });

    expect(res.status).toBe(401);
  });

  it("POST /api/records — 400 for negative amount", async () => {
    const res = await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        amount: -500,
        type: "EXPENSE",
        category: "Bad",
        date: "2025-06-15T00:00:00.000Z",
      });

    expect(res.status).toBe(400);
  });

  it("GET /api/records — 200 for VIEWER (read access)", async () => {
    const res = await request(app)
      .get("/api/records")
      .set("Authorization", `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("GET /api/records — 200 for ADMIN", async () => {
    const res = await request(app)
      .get("/api/records")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  it("GET /api/records/:id — 200 with valid id", async () => {
    const res = await request(app)
      .get(`/api/records/${createdRecordId}`)
      .set("Authorization", `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdRecordId);
  });

  it("GET /api/records/:id — 404 for non-existent id", async () => {
    const res = await request(app)
      .get("/api/records/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${viewerToken}`);

    expect(res.status).toBe(404);
  });

  it("DELETE /api/records/:id — 200 for ADMIN (soft delete)", async () => {
    const res = await request(app)
      .delete(`/api/records/${createdRecordId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  it("GET /api/records/:id — 404 after soft delete", async () => {
    const res = await request(app)
      .get(`/api/records/${createdRecordId}`)
      .set("Authorization", `Bearer ${viewerToken}`);

    expect(res.status).toBe(404);
  });
});
