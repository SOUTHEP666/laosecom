import express from "express";
import { authMiddleware, authorizeRoles } from "../middlewares/auth.js";
import { pool } from "../config/db.js";

const router = express.Router();

router.use(authMiddleware, authorizeRoles(3)); // 仅一级管理员可访问

// 查询用户，支持分页、搜索、角色过滤
router.get("/users", async (req, res) => {
  const { page = 1, pageSize = 10, search = "", role } = req.query;
  const offset = (page - 1) * pageSize;
  try {
    let baseQuery = "SELECT id, username, email, role, created_at FROM users WHERE 1=1";
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      baseQuery += ` AND (username ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }

    if (role) {
      params.push(role);
      baseQuery += ` AND role = $${params.length}`;
    }

    const countQuery = baseQuery.replace(
      "SELECT id, username, email, role, created_at",
      "SELECT COUNT(*)"
    );
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(pageSize, offset);
    baseQuery += ` ORDER BY id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const dataResult = await pool.query(baseQuery, params);

    res.json({
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      users: dataResult.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "查询失败" });
  }
});

// 更新用户角色
router.put("/user/:id", async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (![1, 2, 3, 4].includes(Number(role))) {
    return res.status(400).json({ message: "角色无效" });
  }

  try {
    const result = await pool.query("UPDATE users SET role = $1 WHERE id = $2", [role, id]);
    if (result.rowCount === 0) return res.status(404).json({ message: "用户不存在" });

    res.json({ message: "角色更新成功" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "更新失败" });
  }
});

// 删除用户
router.delete("/user/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM users WHERE id = $1", [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: "用户不存在" });

    res.json({ message: "删除成功" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "删除失败" });
  }
});

export default router;
