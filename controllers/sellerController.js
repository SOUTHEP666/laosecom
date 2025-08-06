// controllers/sellerController.js
import { pool } from '../config/db.js'; // 注意：不是 ../../config，而是 ../config

// 注册商家
export const registerSeller = async (req, res) => {
  try {
    const { user_id, shop_name, contact_info, description } = req.body;

    if (!user_id || !shop_name || !contact_info) {
      return res.status(400).json({ message: "缺少必要字段" });
    }

    const [result] = await pool.query(
      'INSERT INTO sellers (user_id, shop_name, contact_info, description) VALUES (?, ?, ?, ?)',
      [user_id, shop_name, contact_info, description || '']
    );

    res.status(201).json({ message: "商家注册成功", sellerId: result.insertId });
  } catch (error) {
    console.error('注册商家出错:', error);
    res.status(500).json({ message: "服务器错误" });
  }
};

// 获取所有商家列表
export const getSellers = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sellers ORDER BY id DESC');
    res.json({ sellers: rows });
  } catch (error) {
    console.error('获取商家列表出错:', error);
    res.status(500).json({ message: "服务器错误" });
  }
};
