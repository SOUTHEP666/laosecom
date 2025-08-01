import { query } from '../config/db.js';

export const addUserCoupon = async (user_id, coupon_id) => {
  const result = await query(
    `INSERT INTO user_coupons (user_id, coupon_id) VALUES ($1, $2) RETURNING *`,
    [user_id, coupon_id]
  );
  return result.rows[0];
};

export const getUserCoupons = async (user_id) => {
  const result = await query(
    `SELECT uc.*, c.code, c.discount_type, c.discount_value 
     FROM user_coupons uc
     JOIN coupons c ON uc.coupon_id = c.id
     WHERE uc.user_id = $1 AND uc.status = 'unused'`,
    [user_id]
  );
  return result.rows;
};

export const markCouponUsed = async (user_coupon_id) => {
  const result = await query(
    `UPDATE user_coupons SET status = 'used', used_at = NOW() WHERE id = $1 RETURNING *`,
    [user_coupon_id]
  );
  return result.rows[0];
};
