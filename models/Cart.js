import { query } from '../config/db.js';

export async function addToCart(userId, productId, quantity = 1) {
  const sql = `
    INSERT INTO carts (user_id, product_id, quantity)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id, product_id) DO UPDATE
    SET quantity = carts.quantity + EXCLUDED.quantity
    RETURNING *
  `;
  const result = await query(sql, [userId, productId, quantity]);
  return result.rows[0];
}

export async function getCartItems(userId) {
  const sql = `
    SELECT c.*, p.title, p.price
    FROM carts c
    JOIN products p ON c.product_id = p.id
    WHERE c.user_id = $1
  `;
  const result = await query(sql, [userId]);
  return result.rows;
}

export async function removeCartItem(userId, productId) {
  const sql = `DELETE FROM carts WHERE user_id = $1 AND product_id = $2`;
  await query(sql, [userId, productId]);
}
