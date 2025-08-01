import pool from '../config/db.js';

export const createPayment = async (payment) => {
  const {
    user_id, order_id, amount,
    payment_method, status, transaction_id,
  } = payment;

  const result = await pool.query(
    `INSERT INTO payments 
     (user_id, order_id, amount, payment_method, status, transaction_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [user_id, order_id, amount, payment_method, status, transaction_id]
  );
  return result.rows[0];
};

export const getPaymentByOrderId = async (order_id) => {
  const result = await pool.query(
    `SELECT * FROM payments WHERE order_id = $1`,
    [order_id]
  );
  return result.rows;
};
