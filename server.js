require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");
const auth = require("./auth");

const app = express();
app.use(express.json());

const STATUSES = ["todo", "in_progress", "done"];

app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password || password.length < 6) {
    return res.status(400).json({ error: "Email and a password of 6+ characters are required" });
  }
  const hash = await bcrypt.hash(password, 10);
  try {
    const info = db.prepare("INSERT INTO users (email, password) VALUES (?, ?)").run(email, hash);
    res.status(201).json({ id: info.lastInsertRowid, email });
  } catch {
    res.status(409).json({ error: "Email already registered" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "2h" });
  res.json({ token });
});
app.post("/tasks", auth, (req, res) => {
  const { title, description = "", status = "todo", due_date = null } = req.body;
  if (!title) return res.status(400).json({ error: "Title is required" });
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${STATUSES.join(", ")}` });
  }
  const info = db.prepare(
    "INSERT INTO tasks (user_id, title, description, status, due_date) VALUES (?, ?, ?, ?, ?)"
  ).run(req.user.id, title, description, status, due_date);
  res.status(201).json(db.prepare("SELECT * FROM tasks WHERE id = ?").get(info.lastInsertRowid));
});

app.get("/tasks", auth, (req, res) => {
  const { status } = req.query;
  let sql = "SELECT * FROM tasks WHERE user_id = ?";
  const params = [req.user.id];
  if (status) {
    sql += " AND status = ?";
    params.push(status);
  }
  sql += " ORDER BY due_date IS NULL, due_date";
  res.json(db.prepare(sql).all(...params));
});

app.get("/tasks/:id", auth, (req, res) => {
  const task = db.prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.user.id);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
});

app.put("/tasks/:id", auth, (req, res) => {
  const task = db.prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.user.id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const {
    title = task.title,
    description = task.description,
    status = task.status,
    due_date = task.due_date,
  } = req.body;
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${STATUSES.join(", ")}` });
  }
  db.prepare(
    "UPDATE tasks SET title = ?, description = ?, status = ?, due_date = ? WHERE id = ? AND user_id = ?"
  ).run(title, description, status, due_date, task.id, req.user.id);
  res.json(db.prepare("SELECT * FROM tasks WHERE id = ?").get(task.id));
});

app.delete("/tasks/:id", auth, (req, res) => {
  const info = db.prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?")
    .run(req.params.id, req.user.id);
  if (info.changes === 0) return res.status(404).json({ error: "Task not found" });
  res.status(204).send();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));