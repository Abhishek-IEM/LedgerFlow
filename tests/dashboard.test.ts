import request from "supertest";
import app from "../src/app";

let adminToken: string;
let viewerToken: string;

beforeAll(async () => {
  const adminEmail = `admin_dash_${Date.now()}@test.com`;
  const viewerEmail = `viewer_dash_${Date.now()}@test.com`;

  // register users
  const adminRes = await request(app)
    .post("/api/auth/register")
    .send({ name: "Admin Dash", email: adminEmail, password: "admin1234" });
  adminToken = adminRes.body.data.token;

  const viewerRes = await request(app)
    .post("/api/auth/register")
    .send({ name: "Viewer Dash", email: viewerEmail, password: "viewer1234" });
  viewerToken = viewerRes.body.data.token;

  // promote admin
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  await prisma.user.update({
    where: { email: adminEmail },
    data: { role: "ADMIN" },
  });
  await prisma.$disconnect();

  // create a couple of records so the summary has data
  await request(app)
    .post("/api/records")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ amount: 1000, type: "INCOME", category: "Bonus", date: "2025-06-01T00:00:00.000Z" });

  await request(app)
    .post("/api/records")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ amount: 400, type: "EXPENSE", category: "Supplies", date: "2025-06-02T00:00:00.000Z" });
});

describe("Dashboard endpoints", () => {
  it("GET /api/dashboard/summary — 200 with income, expenses, balance", async () => {
    const res = await request(app)
      .get("/api/dashboard/summary")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("totalIncome");
    expect(res.body.data).toHaveProperty("totalExpenses");
    expect(res.body.data).toHaveProperty("netBalance");
  });

  it("GET /api/dashboard/summary — netBalance equals income minus expenses", async () => {
    const res = await request(app)
      .get("/api/dashboard/summary")
      .set("Authorization", `Bearer ${adminToken}`);

    const { totalIncome, totalExpenses, netBalance } = res.body.data;
    expect(netBalance).toBe(totalIncome - totalExpenses);
  });

  it("GET /api/dashboard/categories — 200 with array of breakdowns", async () => {
    const res = await request(app)
      .get("/api/dashboard/categories")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/dashboard/recent — 200 with max 10 items", async () => {
    const res = await request(app)
      .get("/api/dashboard/recent")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeLessThanOrEqual(10);
  });

  it("GET /api/dashboard/summary — 403 for VIEWER role", async () => {
    const res = await request(app)
      .get("/api/dashboard/summary")
      .set("Authorization", `Bearer ${viewerToken}`);

    expect(res.status).toBe(403);
  });
});
