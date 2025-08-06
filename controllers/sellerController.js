// controllers/sellerController.js
import { pool } from '../config/db.js';
import bcrypt from 'bcrypt';

// 注册商家
export const registerSeller = async (req, res) => {
  try {
    const { username, password, shop_name, contact_info, description } = req.body;

    if (!username || !password || !shop_name || !contact_info) {
      return res.status(400).json({ message: "缺少必要字段" });
    }

    // 检查用户名是否已存在
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "用户名已存在" });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 插入用户数据
    const userResult = await pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id',
      [username, hashedPassword, 'seller']
    );

    const user_id = userResult.rows[0].id;

    // 插入商家数据
    const sellerResult = await pool.query(
      'INSERT INTO sellers (user_id, shop_name, contact_info, description) VALUES ($1, $2, $3, $4) RETURNING id',
      [user_id, shop_name, contact_info, description || '']
    );

    res.status(201).json({
      message: "商家注册成功",
      userId: user_id,
      sellerId: sellerResult.rows[0].id
    });
  } catch (error) {
    console.error('注册商家出错:', error);
    res.status(500).json({ message: "服务器错误" });
  }
};

// 获取商家列表
export const getSellers = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sellers ORDER BY id DESC');
    res.json({ sellers: result.rows });
  } catch (error) {
    console.error('获取商家列表出错:', error);
    res.status(500).json({ message: "服务器错误" });
  }
};
