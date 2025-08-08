// routes/orders.js
import express from "express";
import { query } from "../config/db.js";
import { auth } from "../middleware/auth.js";

import {
  createOrder,
  getOrdersByMerchant,
  getAllOrders,
} from "../controllers/orderController.js";



const router = express.Router();

// 1. 买家下单
router.post("/", auth(["customer"]), async (req, res) => {
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

// 2. 商家查看订单
router.get("/seller", auth(["seller"]), async (req, res) => {
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

// 3. 管理员查看所有订单
router.get("/admin", auth(["super_admin", "admin"]), async (req, res) => {
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

// PATCH /api/orders/:id/status 更新订单状态（商家使用）
router.patch('/:id/status', auth.verifyMerchant, async (req, res) => {
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

// GET /api/orders/my
router.get('/my', authMiddleware, async (req, res) => {
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


// PUT /api/admin/orders/:id/status
router.put('/admin/:id/status', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权限' });
  }

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
    res.status(500).json({ error: '管理员更新订单失败' });
  }
});

// 客户下单
router.post("/", createOrder);

// 商家查看订单
router.get("/merchant/:merchantId", getOrdersByMerchant);

// 管理员查看所有订单
router.get("/admin/all", getAllOrders);

// PUT /api/orders/:id/status
router.put('/:id/status', async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;

  const validStatuses = ['pending', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const result = await db.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 更新订单状态
router.patch("/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ["待处理", "已发货", "已完成", "已取消"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "无效的订单状态" });
  }

  try {
    const result = await pool.query(
      "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "订单不存在" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("更新订单状态失败", err);
    res.status(500).json({ error: "服务器错误" });
  }
});

// 更新订单物流信息和状态
router.patch('/:id/shipping', async (req, res) => {
  const { id } = req.params;
  const { tracking_number, status } = req.body;

  if (!tracking_number || !status) {
    return res.status(400).json({ error: '物流单号和状态必填' });
  }

  try {
    const result = await pool.query(
      'UPDATE orders SET tracking_number = $1, status = $2 WHERE id = $3 RETURNING *',
      [tracking_number, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '订单未找到' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('更新物流信息失败', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 买家确认收货接口
router.patch('/:id/confirm', authenticate, authorize(['customer']), async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // 确认订单属于当前买家
    const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1 AND user_id = $2', [id, userId]);
    if (orderResult.rows.length === 0) {
      return res.status(403).json({ error: '无权操作此订单' });
    }

    // 更新订单状态为已完成
    const updateResult = await pool.query('UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', ['已完成', id]);
    res.json(updateResult.rows[0]);
  } catch (err) {
    console.error('确认收货失败', err);
    res.status(500).json({ error: '服务器错误' });
  }
});



export default router;
