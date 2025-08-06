// backend/controllers/adminController.js
import { pool } from "../config/db.js";

export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query("SELECT id, username, role FROM users");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "获取用户失败" });
  }
};

export const deleteUser = async (req, res) => {
  const id = req.params.id;
  try {
    await pool.query("DELETE FROM users WHERE id = $1", [id]);
    res.json({ message: "删除成功" });
  } catch (err) {
    res.status(500).json({ error: "删除失败" });
  }
};

export const updateUserRole = async (req, res) => {
  const id = req.params.id;
  const { role } = req.body;
  try {
    await pool.query("UPDATE users SET role = $1 WHERE id = $2", [role, id]);
    res.json({ message: "角色更新成功" });
  } catch (err) {
    res.status(500).json({ error: "更新失败" });
  }
};
