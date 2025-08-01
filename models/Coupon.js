import { query } from '../config/db.js';

export const createCoupon = async (coupon) => {
  const {
    code, description, discount_type, discount_value,
    min_order_amount, total_quantity, start_time, end_time
  } = coupon;

  const result = await query(
    `INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, total_quantity, start_time, end_time)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [code, description, discount_type, discount_value, min_order_amount, total_quantity, start_time, end_time]
  );
  return result.rows[0];
};

export const getCouponByCode = async (code) => {
  const result = await query(
    `SELECT * FROM coupons WHERE code = $1 AND status = 'active'`,
    [code]
  );
  return result.rows[0];
};

export const updateCouponUsage = async (coupon_id) => {
  const result = await query(
    `UPDATE coupons SET used_quantity = used_quantity + 1 WHERE id = $1 RETURNING *`,
    [coupon_id]
  );
  return result.rows[0];
};
