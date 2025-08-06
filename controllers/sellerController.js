// controllers/sellerController.js
import { pool } from '../config/db.js'; // 保持这个路径，假设config/db.js在根目录

// 注册商家
export const registerSeller = async (req, res) => {
  try {
    const { user_id, shop_name, contact_info, description } = req.body;

    if (!user_id || !shop_name || !contact_info) {
      return res.status(400).json({ message: "缺少必要字段" });
    }

    const result = await pool.query(
      'INSERT INTO sellers (user_id, shop_name, contact_info, description) VALUES ($1, $2, $3, $4) RETURNING id',
      [user_id, shop_name, contact_info, description || '']
    );

    res.status(201).json({ message: "商家注册成功", sellerId: result.rows[0].id });
  } catch (error) {
    console.error('注册商家出错:', error);
    res.status(500).json({ message: "服务器错误" });
  }
};

// 获取所有商家列表
export const getSellers = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sellers ORDER BY id DESC');
    res.json({ sellers: result.rows });
  } catch (error) {
    console.error('获取商家列表出错:', error);
    res.status(500).json({ message: "服务器错误" });
  }
};
