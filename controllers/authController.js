// ===================== authController.js =====================
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'yoursecretkey';

export const register = async (req, res) => {
  // 同时支持 username 或 name 字段
  const { username, name, email, password, role } = req.body;
  const userNameToUse = username || name;  // 先用 username，没有则用 name

  if (!userNameToUse || !email || !password) {
    return res.status(400).json({ message: '用户名、邮箱和密码为必填项' });
  }

  try {
    const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: '邮箱已被注册' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [userNameToUse, email, hashedPassword, role || 'customer']
    );

    res.status(201).json({ user: result.rows[0], message: '注册成功' });
  } catch (err) {
    console.error('注册错误:', err);
    res.status(500).json({ error: '服务器错误，注册失败' });
  }
};


export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ token, user });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
};