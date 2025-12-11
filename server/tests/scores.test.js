// tests/scores.test.js
import request from "supertest";
import app from "../server.js";

let userId;

beforeAll(async () => {
  const email = "test_scores@example.com";
  const password = "12345678";
  const nickname = "TestScores";

  // спробуємо зареєструвати (ігноруємо 409)
  await request(app)
    .post("/api/register")
    .send({ email, password, nickname });

  const loginRes = await request(app)
    .post("/api/login")
    .send({ email, password });

  expect(loginRes.status).toBe(200);
  userId = loginRes.body.id;
});

describe("Scores API", () => {
  test("POST /api/score should add new score", async () => {
    const res = await request(app)
      .post("/api/score")
      .send({ userId, score: 42 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  test("GET /api/leaderboard should return list", async () => {
    const res = await request(app).get("/api/leaderboard");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
