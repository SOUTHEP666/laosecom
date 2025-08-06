import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../db'; // 你自己的数据库连接模块

const router = express.Router();

// 商家注册接口
router.post('/register', async (req, res) => {
  const { username, password, shop_name, contact_info, description } = req.body;

  try {
    // 1. 检查用户名是否已存在
    const existingUser = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    // 2. 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. 插入用户表（role = seller，status = pending）
    const newUser = await db.query(
      `INSERT INTO users (username, password, role, status) VALUES ($1, $2, 'seller', 'pending') RETURNING id`,
      [username, hashedPassword]
    );

    const user_id = newUser.rows[0].id;

    // 4. 插入 sellers 表
    await db.query(
      `INSERT INTO sellers (user_id, shop_name, contact_info, description, status) VALUES ($1, $2, $3, $4, 'pending')`,
      [user_id, shop_name, contact_info, description]
    );

    return res.status(201).json({ message: '商家注册成功，等待平台审核' });
  } catch (error) {
    console.error('商家注册失败：', error);
    return res.status(500).json({ message: '注册失败，请稍后再试' });
  }
});

export default router;
