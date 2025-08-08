// routes/orders.js
import express from "express";
import { query } from "../config/db.js";
import { authenticate, authorize } from "../middleware/auth.js";

import {
  createOrder,
  getOrdersByMerchant,
  getAllOrders,
} from "../controllers/orderController.js";

const router = express.Router();

// 1. 买家下单（客户身份验证和授权）
router.post("/", authenticate, authorize(["customer"]), async (req, res) => {
  const { product_id, quantity } = req.body;
  const buyer_id = req.user.id;

  try {
    // 查询商品信息
    const productResult = await query("SELECT * FROM products WHERE id = $1", [product_id]);
    if (productResult.rows.length === 0) return res.status(404).json({ error: "商品不存在" });

    const product = productResult.rows[0];
    const total_price = product.price * quantity;

    // 插入订单
    const result = await query(
      "INSERT INTO orders (buyer_id, seller_id, product_id, quantity, total_price) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [buyer_id, product.merchant_id, product_id, quantity, total_price]
    );

    res.status(201).json({ order: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "下单失败" });
  }
});

// 2. 商家查看订单（卖家身份验证和授权）
router.get("/seller", authenticate, authorize(["seller"]), async (req, res) => {
  try {
    const seller_id = req.user.id;
    const result = await query(
      `SELECT o.*, p.name AS product_name, u.username AS buyer_name
       FROM orders o
       JOIN products p ON o.product_id = p.id
       JOIN users u ON o.buyer_id = u.id
       WHERE o.seller_id = $1
       ORDER BY o.created_at DESC`,
      [seller_id]
    );

    res.json({ orders: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "无法获取订单" });
  }
});

// 3. 管理员查看所有订单（管理员身份验证和授权）
router.get("/admin", authenticate, authorize(["super_admin", "admin"]), async (req, res) => {
  try {
    const result = await query(
      `SELECT o.*, p.name AS product_name, u.username AS buyer_name, s.username AS seller_name
       FROM orders o
       JOIN products p ON o.product_id = p.id
       JOIN users u ON o.buyer_id = u.id
       JOIN users s ON o.seller_id = s.id
       ORDER BY o.created_at DESC`
    );

    res.json({ orders: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "无法获取订单" });
  }
});

// 4. 商家更新订单物流状态（商家身份验证和授权）
router.patch('/:id/status', authenticate, authorize(['seller']), async (req, res) => {
  const orderId = req.params.id;
  const { shipping_status, shipping_company, tracking_number } = req.body;

  try {
    const orderRes = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ message: '订单不存在' });
    }

    const order = orderRes.rows[0];
    // 验证商家是否是订单拥有者
    const productRes = await query('SELECT * FROM products WHERE id = $1', [order.product_id]);
    if (productRes.rows[0].merchant_id !== req.user.id) {
      return res.status(403).json({ message: '无权更新此订单' });
    }

    await query(
      `UPDATE orders 
       SET shipping_status = $1, shipping_company = $2, tracking_number = $3 
       WHERE id = $4`,
      [shipping_status, shipping_company, tracking_number, orderId]
    );

    res.json({ message: '订单物流状态已更新' });
  } catch (err) {
    console.error('更新物流状态失败', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 5. 买家查看自己的订单
router.get('/my', authenticate, authorize(['customer']), async (req, res) => {
  const buyerId = req.user.id;
  try {
    const { rows } = await query(
      'SELECT * FROM orders WHERE buyer_id = $1 ORDER BY created_at DESC',
      [buyerId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: '获取订单失败' });
  }
});

// 6. 管理员更新订单状态
router.put('/admin/:id/status', authenticate, authorize(['admin']), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const result = await query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: '订单不存在' });
    }

    // 添加日志记录
    await query(
      'INSERT INTO order_logs (order_id, status, changed_by, role) VALUES ($1, $2, $3, $4)',
      [id, status, req.user.id, 'admin']
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '管理员更新订单失败' });
  }
});

// 7. 买家确认收货
router.patch('/:id/confirm', authenticate, authorize(['customer']), async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // 确认订单属于当前买家
    const orderResult = await query('SELECT * FROM orders WHERE id = $1 AND buyer_id = $2', [id, userId]);
    if (orderResult.rows.length === 0) {
      return res.status(403).json({ error: '无权操作此订单' });
    }

    // 更新订单状态为已完成
    const updateResult = await query('UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', ['已完成', id]);
    res.json(updateResult.rows[0]);
  } catch (err) {
    console.error('确认收货失败', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取单个订单详情（管理员查看）
router.get('/:id', async (req, res) => {
  const orderId = req.params.id;

  try {
    const { rows } = await pool.query(`
      SELECT o.*, p.name as product_name, u.username as buyer_name, m.store_name as merchant_name
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN merchants m ON o.merchant_id = m.id
      WHERE o.id = $1
    `, [orderId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: '订单不存在' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('查询订单详情失败', err);
    res.status(500).json({ error: '查询订单失败' });
  }
});


export default router;
