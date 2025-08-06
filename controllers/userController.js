import { query } from "../config/db.js";

// 获取当前用户信息
export const getProfile = async (req, res) => {
  try {
    const result = await query("SELECT id, username, role, created_at FROM users WHERE id = $1", [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "用户不存在" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("获取用户信息失败:", err);
    res.status(500).json({ message: "服务器错误" });
  }
};

// 修改当前用户信息（只允许修改 username）
export const updateProfile = async (req, res) => {
  const { username } = req.body;
  try {
    const result = await query("UPDATE users SET username = $1 WHERE id = $2 RETURNING id, username, role", [
      username,
      req.user.id,
    ]);
    res.json({ message: "更新成功", user: result.rows[0] });
  } catch (err) {
    console.error("更新用户信息失败:", err);
    res.status(500).json({ message: "服务器错误" });
  }
};
