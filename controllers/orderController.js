import { query } from '../config/db.js'; // 假设你有这个数据库操作工具

// 获取某个商家的所有订单
export async function getOrdersByMerchant(req, res) {
  try {
    const merchantId = req.params.merchantId;
    const result = await query(
      `SELECT o.*, u.name AS buyer_name, p.name AS product_name
       FROM orders o
       JOIN users u ON o.user_id = u.id
       JOIN products p ON o.product_id = p.id
       WHERE o.merchant_id = $1
       ORDER BY o.created_at DESC`,
      [merchantId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("获取商家订单出错:", error);
    res.status(500).json({ error: "服务器错误" });
  }
}

// 获取所有订单（管理员用）
export async function getAllOrders(req, res) {
  try {
    const result = await query(
      `SELECT o.*, u.name AS buyer_name, p.name AS product_name, m.name AS merchant_name
       FROM orders o
       JOIN users u ON o.user_id = u.id
       JOIN products p ON o.product_id = p.id
       JOIN merchants m ON o.merchant_id = m.id
       ORDER BY o.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("获取全部订单出错:", error);
    res.status(500).json({ error: "服务器错误" });
  }
}

// 创建新订单
export async function createOrder(req, res) {
  try {
    const { user_id, product_id, merchant_id, quantity, total_price, status } = req.body;
    const result = await query(
      `INSERT INTO orders (user_id, product_id, merchant_id, quantity, total_price, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [user_id, product_id, merchant_id, quantity, total_price, status || 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("创建订单出错:", error);
    res.status(500).json({ error: "服务器错误" });
  }
}

// 更新订单状态
export async function updateOrderStatus(req, res) {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const result = await query(
      `UPDATE orders SET status = $1 WHERE id = $2 RETURNING *`,
      [status, orderId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "订单未找到" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("更新订单状态出错:", error);
    res.status(500).json({ error: "服务器错误" });
  }
}

// 删除订单
export async function deleteOrder(req, res) {
  try {
    const { orderId } = req.params;
    const result = await query(
      `DELETE FROM orders WHERE id = $1 RETURNING *`,
      [orderId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "订单未找到" });
    }
    res.json({ message: "订单删除成功", order: result.rows[0] });
  } catch (error) {
    console.error("删除订单出错:", error);
    res.status(500).json({ error: "服务器错误" });
  }
}
