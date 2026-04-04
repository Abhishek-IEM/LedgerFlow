import request from "supertest";
import app from "../src/app";

// use a unique email per test run so re-runs don't collide
const testEmail = `testuser_${Date.now()}@test.com`;

describe("Auth endpoints", () => {
  it("should register a new user and return a token", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test User", email: testEmail, password: "test1234" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.body.data.user.password).toBeUndefined();
  });

  it("should reject duplicate email registration", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Dupe User", email: testEmail, password: "test1234" });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("should reject registration with an invalid email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Bad Email", email: "not-an-email", password: "test1234" });

    expect(res.status).toBe(400);
  });

  it("should login with valid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: testEmail, password: "test1234" });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  it("should reject login with wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: testEmail, password: "wrongpassword" });

    expect(res.status).toBe(401);
  });

  it("should reject login for non-existent user", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@nowhere.com", password: "whatever" });

    expect(res.status).toBe(401);
  });
});
