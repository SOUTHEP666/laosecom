import express from "express";
import { query } from "../config/db.js";

const router = express.Router();

// 获取用户列表（带分页、搜索、筛选）
router.get("/users", async (req, res) => {
  const { page = 1, limit = 5, keyword = "", role = "" } = req.query;
  const offset = (page - 1) * limit;

  let baseQuery = "SELECT id, username, email, role FROM users WHERE 1=1";
  let countQuery = "SELECT COUNT(*) FROM users WHERE 1=1";
  let params = [];
  let paramIndex = 1;

  if (keyword) {
    baseQuery += ` AND (username ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
    countQuery += ` AND (username ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
    params.push(`%${keyword}%`);
    paramIndex++;
  }

  if (role) {
    baseQuery += ` AND role = $${paramIndex}`;
    countQuery += ` AND role = $${paramIndex}`;
    params.push(role);
    paramIndex++;
  }

  baseQuery += ` ORDER BY id DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  try {
    const data = await query(baseQuery, params);
    const totalResult = await query(countQuery, params.slice(0, paramIndex - 2));
    res.json({
      data: data.rows,
      total: parseInt(totalResult.rows[0].count, 10),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "获取用户失败" });
  }
});

// 新增用户
router.post("/users", async (req, res) => {
  const { username, email, password, role } = req.body;
  if (!username || !email || !password || !role) {
    return res.status(400).json({ message: "参数不完整" });
  }
  try {
    await query(
      "INSERT INTO users (username, email, password, role) VALUES ($1, $2, crypt($3, gen_salt('bf')), $4)",
      [username, email, password, role]
    );
    res.json({ message: "新增成功" });
  } catch (err) {
    res.status(500).json({ message: "新增失败" });
  }
});

// 编辑用户
router.put("/users/:id", async (req, res) => {
  const { username, email, role } = req.body;
  try {
    await query(
      "UPDATE users SET username=$1, email=$2, role=$3 WHERE id=$4",
      [username, email, role, req.params.id]
    );
    res.json({ message: "更新成功" });
  } catch {
    res.status(500).json({ message: "更新失败" });
  }
});

// 删除用户
router.delete("/users/:id", async (req, res) => {
  try {
    await query("DELETE FROM users WHERE id=$1", [req.params.id]);
    res.json({ message: "删除成功" });
  } catch {
    res.status(500).json({ message: "删除失败" });
  }
});

export default router;
