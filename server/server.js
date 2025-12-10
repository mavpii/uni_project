import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import mysql from "mysql2/promise";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------- БАЗА ДАНИХ ----------------------

const pool = mysql.createPool({
  host: "localhost",
  user: "root",      // ЗАМІНИ на свій логін
  password: "1234",      // ЗАМІНИ на свій пароль
  database: "snake_arena",
  waitForConnections: true,
  connectionLimit: 10
});

// ---------------------- APP ----------------------

const app = express();
const PORT = 3000;

// CORS, JSON, статика
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// Простий "токен" = id користувача, який фронт зберігає в localStorage.
// У реальному додатку треба робити JWT / сесії, але для практики достатньо.

async function getUserByEmail(email) {
  const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
    email
  ]);
  return rows[0];
}

async function getUserById(id) {
  const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
  return rows[0];
}

// ---------------------- API: AUTH ----------------------

// Реєстрація
app.post("/api/register", async (req, res) => {
  try {
    const { email, password, nickname } = req.body;
    if (!email || !password || !nickname) {
      return res.status(400).json({ error: "Заповніть всі поля" });
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "Користувач вже існує" });
    }

    const hash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO users (email, password_hash, nickname) VALUES (?, ?, ?)",
      [email, hash, nickname]
    );

    const user = await getUserById(result.insertId);

    res.json({
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      bestScore: user.best_score,
      avatar: user.avatar_url
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Помилка сервера" });
  }
});

// Вхід
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Заповніть пошту та пароль" });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Невірна пошта або пароль" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Невірна пошта або пароль" });
    }

    res.json({
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      bestScore: user.best_score,
      avatar: user.avatar_url
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Помилка сервера" });
  }
});

// Зміна імені
app.post("/api/change-name", async (req, res) => {
  try {
    const { userId, newName } = req.body;
    if (!userId || !newName) {
      return res.status(400).json({ error: "Немає userId або нового імені" });
    }

    await pool.query("UPDATE users SET nickname = ? WHERE id = ?", [
      newName,
      userId
    ]);

    const user = await getUserById(userId);

    res.json({
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      bestScore: user.best_score,
      avatar: user.avatar_url
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Помилка сервера" });
  }
});

// (за бажанням) зміна аватара – тут лише URL/ dataURL
app.post("/api/change-avatar", async (req, res) => {
  try {
    const { userId, avatar } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "Немає userId" });
    }
    await pool.query("UPDATE users SET avatar_url = ? WHERE id = ?", [
      avatar || null,
      userId
    ]);
    const user = await getUserById(userId);
    res.json({
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      bestScore: user.best_score,
      avatar: user.avatar_url
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Помилка сервера" });
  }
});

// ---------------------- API: SCORES & LEADERBOARD ----------------------

// Зберегти новий результат
app.post("/api/score", async (req, res) => {
  try {
    const { userId, score } = req.body;
    if (!userId || !Number.isInteger(score) || score <= 0) {
      return res.status(400).json({ error: "Некоректний результат" });
    }

    await pool.query("INSERT INTO scores (user_id, score) VALUES (?, ?)", [
      userId,
      score
    ]);

    // Оновлюємо best_score, якщо потрібно
    await pool.query(
      "UPDATE users SET best_score = GREATEST(best_score, ?) WHERE id = ?",
      [score, userId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Помилка сервера" });
  }
});

// Лідерборд (найкращий результат кожного користувача)
app.get("/api/leaderboard", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, nickname, avatar_url, best_score
       FROM users
       WHERE best_score > 0
       ORDER BY best_score DESC
       LIMIT 10`
    );

    res.json(
      rows.map((u) => ({
        userId: u.id,
        nickname: u.nickname,
        avatar: u.avatar_url,
        score: u.best_score
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Помилка сервера" });
  }
});

// ---------------------- START ----------------------

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
