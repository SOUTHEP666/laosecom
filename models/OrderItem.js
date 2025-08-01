// models/OrderItem.js
import db from '../config/db.js';

// 创建订单项
export async function createOrderItem(orderId, productId, quantity, price) {
  const sql = `
    INSERT INTO order_items (order_id, product_id, quantity, price)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const result = await db.query(sql, [orderId, productId, quantity, price]);
  return result.rows[0];
}

// 获取某个订单的所有订单项
export async function getOrderItemsByOrderId(orderId) {
  const sql = `
    SELECT oi.*, p.title AS product_title, p.image_url
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = $1
  `;
  const result = await db.query(sql, [orderId]);
  return result.rows;
}
