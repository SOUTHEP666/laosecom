// backend/controllers/adminController.js
import { pool } from "../config/db.js";

export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, role, email, created_at FROM users ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "获取用户失败" });
  }
};


export const deleteUser = async (req, res) => {
  const id = req.params.id;
  try {
    const result = await pool.query("DELETE FROM users WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "用户不存在" });
    }
    res.json({ message: "删除成功" });
  } catch (err) {
    res.status(500).json({ error: "删除失败" });
  }
};


export const updateUserRole = async (req, res) => {
  const id = req.params.id;
  const { role } = req.body;

  if (!role || ![1, 2, 3, 4].includes(Number(role))) {
    return res.status(400).json({ error: "无效的角色值" });
  }

  try {
    const result = await pool.query("UPDATE users SET role = $1 WHERE id = $2", [role, id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "用户不存在" });
    }
    res.json({ message: "角色更新成功" });
  } catch (err) {
    res.status(500).json({ error: "更新失败" });
  }
};

