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
