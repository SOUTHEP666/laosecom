// models/Order.js
import db from '../config/db.js';

export async function createOrder(userId, orderNo, totalAmount, paymentMethod) {
  const sql = `
    INSERT INTO orders (user_id, order_no, total_amount, payment_method)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const result = await db.query(sql, [userId, orderNo, totalAmount, paymentMethod]);
  return result.rows[0];
}

export async function getOrderById(orderId) {
  const sql = `
    SELECT o.*, u.email AS user_email
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.id = $1
  `;
  const result = await db.query(sql, [orderId]);
  return result.rows[0];
}
