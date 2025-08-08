import express from "express";
import { query } from "../config/db.js";

const router = express.Router();

// 获取商家的所有订单
router.get("/merchant/:merchantId", async (req, res) => {
  const { merchantId } = req.params;
  try {
    const ordersRes = await query(
      `SELECT * FROM orders WHERE merchant_id = $1 ORDER BY created_at DESC`,
      [merchantId]
    );

    const orders = ordersRes.rows;

    // 查询每个订单的商品项
    for (const order of orders) {
      const itemsRes = await query(
        `SELECT * FROM order_items WHERE order_id = $1`,
        [order.id]
      );
      order.items = itemsRes.rows;
    }

    res.json(orders);
  } catch (err) {
    console.error("查询订单失败", err);
    res.status(500).json({ message: "查询订单失败" });
  }
});

// 修改订单状态（发货、完成等）
router.put("/:orderId/status", async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  try {
    const result = await query(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, orderId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "订单不存在" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("更新订单状态失败", err);
    res.status(500).json({ message: "更新订单失败" });
  }
});

export default router;
