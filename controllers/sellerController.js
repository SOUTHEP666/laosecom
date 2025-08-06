import { pool } from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key_here";

// 注册商家
export const registerSeller = async (req, res) => {
  try {
    const { username, password, shop_name, contact_info, description } = req.body;

    if (!username || !password || !shop_name || !contact_info) {
      return res.status(400).json({ message: "缺少必要字段" });
    }

    const existingUser = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "用户名已存在" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userResult = await pool.query(
      'INSERT INTO users (username, password, role, status) VALUES ($1, $2, $3, $4) RETURNING id',
      [username, hashedPassword, 'seller', 'pending']
    );

    const user_id = userResult.rows[0].id;

    await pool.query(
      'INSERT INTO sellers (user_id, shop_name, contact_info, description, status) VALUES ($1, $2, $3, $4, $5)',
      [user_id, shop_name, contact_info, description || '', 'pending']
    );

    res.status(201).json({ message: "注册成功，等待管理员审核" });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ message: "服务器错误" });
  }
};

// 登录商家
export const loginSeller = async (req, res) => {
  try {
    const { username, password } = req.body;

    const userResult = await pool.query('SELECT * FROM users WHERE username = $1 AND role = $2', [username, 'seller']);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const user = userResult.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: '账号未通过审核或已被禁用' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });

    res.json({ token, username: user.username, role: user.role });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取商家自己信息
export const getSellerProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const sellerRes = await pool.query(
      'SELECT s.id, s.shop_name, s.contact_info, s.description, s.status FROM sellers s WHERE s.user_id = $1',
      [userId]
    );

    if (sellerRes.rows.length === 0) {
      return res.status(404).json({ message: '商家信息未找到' });
    }

    res.json({ seller: sellerRes.rows[0] });
  } catch (error) {
    console.error('获取信息失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 商家商品列表
export const getMyProducts = async (req, res) => {
  try {
    const userId = req.user.id;
    const sellerRes = await pool.query('SELECT id FROM sellers WHERE user_id = $1', [userId]);
    if (sellerRes.rows.length === 0) {
      return res.status(404).json({ message: '商家信息未找到' });
    }

    const sellerId = sellerRes.rows[0].id;
    const productsRes = await pool.query('SELECT * FROM products WHERE seller_id = $1 ORDER BY id DESC', [sellerId]);

    res.json({ products: productsRes.rows });
  } catch (error) {
    console.error('获取商品失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 添加商品
export const addProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, price, description } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: '商品名称和价格不能为空' });
    }

    const sellerRes = await pool.query('SELECT id FROM sellers WHERE user_id = $1', [userId]);
    if (sellerRes.rows.length === 0) {
      return res.status(404).json({ message: '商家信息未找到' });
    }

    const sellerId = sellerRes.rows[0].id;

    await pool.query(
      'INSERT INTO products (seller_id, name, price, description) VALUES ($1, $2, $3, $4)',
      [sellerId, name, price, description || '']
    );

    res.status(201).json({ message: '商品添加成功' });
  } catch (error) {
    console.error('添加商品失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 更新商品
export const updateProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    const { name, price, description } = req.body;

    const sellerRes = await pool.query('SELECT id FROM sellers WHERE user_id = $1', [userId]);
    if (sellerRes.rows.length === 0) {
      return res.status(404).json({ message: '商家信息未找到' });
    }

    const sellerId = sellerRes.rows[0].id;

    const productRes = await pool.query('SELECT * FROM products WHERE id = $1 AND seller_id = $2', [productId, sellerId]);
    if (productRes.rows.length === 0) {
      return res.status(404).json({ message: '商品未找到或无权限' });
    }

    await pool.query(
      'UPDATE products SET name = $1, price = $2, description = $3 WHERE id = $4',
      [name || productRes.rows[0].name, price || productRes.rows[0].price, description || productRes.rows[0].description, productId]
    );

    res.json({ message: '商品更新成功' });
  } catch (error) {
    console.error('更新商品失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 删除商品
export const deleteProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const sellerRes = await pool.query('SELECT id FROM sellers WHERE user_id = $1', [userId]);
    if (sellerRes.rows.length === 0) {
      return res.status(404).json({ message: '商家信息未找到' });
    }

    const sellerId = sellerRes.rows[0].id;

    const productRes = await pool.query('SELECT * FROM products WHERE id = $1 AND seller_id = $2', [productId, sellerId]);
    if (productRes.rows.length === 0) {
      return res.status(404).json({ message: '商品未找到或无权限' });
    }

    await pool.query('DELETE FROM products WHERE id = $1', [productId]);

    res.json({ message: '商品删除成功' });
  } catch (error) {
    console.error('删除商品失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};
