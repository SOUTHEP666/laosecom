import bcrypt from "bcrypt";
import { query } from "../config/db.js";
import { generateToken } from "../utils/jwt.js";
import jwt from "jsonwebtoken";



// 用户注册（买家/商家）
export const register = async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: "用户名、密码和角色不能为空" });
  }

  try {
    const userCheck = await query("SELECT * FROM users WHERE username = $1", [username]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ message: "用户名已存在" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      "INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role",
      [username, hashedPassword, role]
    );

    res.status(201).json({ message: "注册成功", user: result.rows[0] });
  } catch (err) {
    console.error("注册失败：", err);
    res.status(500).json({ message: "服务器错误" });
  }
};

// 登录
export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await query("SELECT * FROM users WHERE username = $1", [username]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "用户不存在" });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "密码错误" });
    }

    const token = generateToken({ id: user.id, username: user.username, role: user.role });
    res.json({
      message: "登录成功",
      token,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (err) {
    console.error("登录失败：", err);
    res.status(500).json({ message: "服务器错误" });
  }
};


const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

// 通用鉴权中间件
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "未授权访问" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Token 验证失败:", err);
    return res.status(403).json({ message: "Token 无效或已过期" });
  }
}