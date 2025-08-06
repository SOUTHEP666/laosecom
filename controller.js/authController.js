// controllers/authController.js
import { hashPassword, comparePassword } from "../utils/hash.js";
import { generateToken } from "../utils/jwt.js";
import { findUserByUsername, createUser } from "../models/userModel.js";

export const register = async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || role === undefined) {
    return res.status(400).json({ message: "参数不完整" });
  }

  const existing = await findUserByUsername(username);
  if (existing) return res.status(409).json({ message: "用户名已存在" });

  const hashed = await hashPassword(password);
  const user = await createUser({ username, password: hashed, role });
  res.json({ message: "注册成功", user: { id: user.id, username: user.username, role: user.role } });
};

export const login = async (req, res) => {
  const { username, password } = req.body;
  const user = await findUserByUsername(username);
  if (!user) return res.status(401).json({ message: "用户不存在" });

  const match = await comparePassword(password, user.password);
  if (!match) return res.status(401).json({ message: "密码错误" });

  const token = generateToken(user);
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
};
