import { query } from "../config/db.js";

// 创建订单（买家）
export const createOrder = async (req, res) => {
  const buyerId = req.user.id;
  const { items } = req.body; // items = [{ product_id, quantity }]

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "订单商品不能为空" });
  }

  try {
    // 计算总价及验证商品信息
    let totalAmount = 0;
    const sellerSet = new Set();

    for (const item of items) {
      const productRes = await query("SELECT price, seller_id, stock FROM products WHERE id = $1", [
        item.product_id,
      ]);
      if (productRes.rows.length === 0) {
        return res.status(400).json({ message: `商品ID ${item.product_id} 不存在` });
      }
      const product = productRes.rows[0];

      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `商品ID ${item.product_id} 库存不足` });
      }

      totalAmount += parseFloat(product.price) * item.quantity;
      sellerSet.add(product.seller_id);
    }

    if (sellerSet.size > 1) {
      return res
        .status(400)
        .json({ message: "当前订单暂不支持多个商家商品，请拆单下单" });
    }

    const sellerId = [...sellerSet][0];

    // 事务：创建订单和订单明细，更新库存
    await query("BEGIN");

    const orderRes = await query(
      "INSERT INTO orders (buyer_id, seller_id, total_amount) VALUES ($1, $2, $3) RETURNING *",
      [buyerId, sellerId, totalAmount]
    );
    const order = orderRes.rows[0];

    for (const item of items) {
      const productRes = await query("SELECT price FROM products WHERE id = $1", [item.product_id]);
      const price = productRes.rows[0].price;

      await query(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)",
        [order.id, item.product_id, item.quantity, price]
      );

      // 减少库存
      await query("UPDATE products SET stock = stock - $1 WHERE id = $2", [
        item.quantity,
        item.product_id,
      ]);
    }

    await query("COMMIT");
    res.status(201).json({ message: "订单创建成功", order });
  } catch (err) {
    await query("ROLLBACK");
    console.error("创建订单失败:", err);
    res.status(500).json({ message: "服务器错误" });
  }
};

// 获取订单详情
export const getOrderById = async (req, res) => {
  const orderId = req.params.id;
  const userId = req.user.id;

  try {
    // 只允许买家或卖家查看自己相关订单
    const orderRes = await query(
      "SELECT * FROM orders WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)",
      [orderId, userId]
    );
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ message: "订单不存在或无权限查看" });
    }
    const order = orderRes.rows[0];

    const itemsRes = await query(
      "SELECT oi.*, p.title FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1",
      [orderId]
    );

    res.json({ order, items: itemsRes.rows });
  } catch (err) {
    console.error("获取订单详情失败:", err);
    res.status(500).json({ message: "服务器错误" });
  }
};

// 获取当前用户订单列表（买家或商家）
export const getOrders = async (req, res) => {
  const userId = req.user.id;
  try {
    const ordersRes = await query(
      "SELECT * FROM orders WHERE buyer_id = $1 OR seller_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    res.json(ordersRes.rows);
  } catch (err) {
    console.error("获取订单列表失败:", err);
    res.status(500).json({ message: "服务器错误" });
  }
};

// 修改订单状态（发货、完成、取消）
export const updateOrderStatus = async (req, res) => {
  const orderId = req.params.id;
  const userId = req.user.id;
  const { status } = req.body;

  const allowedStatuses = ["pending", "shipped", "completed", "cancelled"];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "非法的订单状态" });
  }

  try {
    // 只有卖家可以修改订单状态
    const orderRes = await query("SELECT * FROM orders WHERE id = $1 AND seller_id = $2", [
      orderId,
      userId,
    ]);
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ message: "订单不存在或无权限操作" });
    }

    const result = await query("UPDATE orders SET status = $1 WHERE id = $2 RETURNING *", [
      status,
      orderId,
    ]);
    res.json({ message: "订单状态更新成功", order: result.rows[0] });
  } catch (err) {
    console.error("更新订单状态失败:", err);
    res.status(500).json({ message: "服务器错误" });
  }
};
