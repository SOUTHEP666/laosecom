// ===================== authController.js =====================
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'yoursecretkey';

// 注册
export const register = async (req, res) => {
  const { username, name, email, password, role } = req.body;

  // 检查必填
  if (!username || !email || !password) {
    return res.status(400).json({ message: '用户名、邮箱和密码为必填项' });
  }

  try {
    // 检查邮箱是否存在
    const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: '邮箱已被注册' });
    }

    // 检查用户名是否存在
    const existingUsername = await query('SELECT * FROM users WHERE username = $1', [username]);
    if (existingUsername.rows.length > 0) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 插入用户数据
    const result = await query(
      'INSERT INTO users (username, name, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, name, email, role',
      [username, name || username, email, hashedPassword, role || 'buyer']
    );

    res.status(201).json({ user: result.rows[0], message: '注册成功' });
  } catch (err) {
    console.error('注册错误:', err);
    res.status(500).json({ error: '服务器错误，注册失败' });
  }
};

// 登录
export const login = async (req, res) => {
  const { account, password } = req.body; // account 可以是 username 或 email

  try {
    const result = await query(
      'SELECT * FROM users WHERE username = $1 OR email = $1',
      [account]
    );
    const user = result.rows[0];
    if (!user) return res.status(400).json({ message: '账号不存在' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: '密码错误' });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    // 返回精简后的用户信息
    res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('登录错误:', err);
    res.status(500).json({ error: '登录失败' });
  }
};
