// tests/auth.test.js
import request from "supertest";
import app from "../server.js";

describe("Auth API", () => {
  const email = "test_auth@example.com";
  const password = "12345678";
  const nickname = "TestAuth";

  test("POST /api/register should create or reject existing user", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({ email, password, nickname });

    // якщо користувач уже існує, то 409; якщо створився вперше — 200
    expect([200, 409]).toContain(res.status);
  });

  test("POST /api/login should return user object", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("email", email);
    expect(res.body).toHaveProperty("nickname");
  });
});
