import db from "../db.js";
import bcrypt from "bcrypt";

export const register = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "用户名和密码不能为空" });
  }

  try {
    // 检查用户名是否存在
    const userCheck = await db.query("SELECT * FROM users WHERE username = $1", [username]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: "用户名已存在" });
    }

    // 密码加密
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 插入用户
    await db.query("INSERT INTO users (username, password) VALUES ($1, $2)", [
      username,
      hashedPassword,
    ]);

    res.status(201).json({ message: "注册成功" });
  } catch (err) {
    console.error("注册失败:", err);
    res.status(500).json({ message: "服务器错误" });
  }
};
