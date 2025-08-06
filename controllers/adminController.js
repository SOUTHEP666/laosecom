import { pool } from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key_here";

// 管理员登录
export const loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const userRes = await pool.query('SELECT * FROM users WHERE username = $1 AND role = $2', [username, 'admin']);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const user = userRes.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, username: user.username, role: user.role });
  } catch (error) {
    console.error('管理员登录失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取待审核商家列表
export const getPendingSellers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.id, s.shop_name, s.contact_info, s.description, u.username, u.status AS user_status
      FROM sellers s
      JOIN users u ON s.user_id = u.id
      WHERE u.status = 'pending'
      ORDER BY s.created_at DESC
    `);
    res.json({ sellers: result.rows });
  } catch (error) {
    console.error('获取待审核商家失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 审核商家，status: approved 或 rejected
export const reviewSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { status } = req.body; // 'approved' 或 'rejected'
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: '状态值无效' });
    }

    // 先查 seller 对应的 user_id
    const sellerRes = await pool.query('SELECT user_id FROM sellers WHERE id = $1', [sellerId]);
    if (sellerRes.rows.length === 0) {
      return res.status(404).json({ message: '商家未找到' });
    }
    const userId = sellerRes.rows[0].user_id;

    // 更新用户状态
    await pool.query('UPDATE users SET status = $1 WHERE id = $2', [status === 'approved' ? 'active' : 'rejected', userId]);

    // 更新商家状态
    await pool.query('UPDATE sellers SET status = $1 WHERE id = $2', [status, sellerId]);

    res.json({ message: `商家已${status === 'approved' ? '审核通过' : '拒绝'}` });
  } catch (error) {
    console.error('审核商家失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};
