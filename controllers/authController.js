import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'yoursecretkey';

// 允许的角色列表
const allowedRoles = ['superadmin', 'admin', 'merchant', 'buyer'];

// 注册
export const register = async (req, res) => {
  const { username, name, email, password, role } = req.body;

  // 必填校验
  if (!username || !email || !password || !role) {
    return res.status(400).json({ message: '用户名、邮箱、密码和角色为必填项' });
  }

  // 角色合法性校验
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: '无效的角色' });
  }

  try {
    // 邮箱是否已注册
    const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: '邮箱已被注册' });
    }

    // 用户名是否已存在
    const existingUsername = await query('SELECT * FROM users WHERE username = $1', [username]);
    if (existingUsername.rows.length > 0) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 插入用户，默认 is_active = true
    const result = await query(
      `INSERT INTO users (username, name, email, password, role, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, username, name, email, role`,
      [username, name || username, email, hashedPassword, role]
    );

    res.status(201).json({ user: result.rows[0], message: '注册成功' });
  } catch (err) {
    console.error('注册错误:', err);
    res.status(500).json({ error: '服务器错误，注册失败' });
  }
};

// 登录
export const login = async (req, res) => {
  const { account, password } = req.body; // account 可为 username 或 email

  if (!account || !password) {
    return res.status(400).json({ message: '账号和密码为必填项' });
  }

  try {
    const result = await query(
      'SELECT * FROM users WHERE username = $1 OR email = $1',
      [account]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ message: '账号不存在' });
    }

    // 账号是否激活
    if (!user.is_active) {
      return res.status(403).json({ message: '账号已被禁用，请联系管理员' });
    }

    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: '密码错误' });
    }

    // 签发 JWT Token，有效期7天
    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 返回用户基本信息和token
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
