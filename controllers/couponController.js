import { createCoupon, getCouponByCode, updateCouponUsage } from '../models/Coupon.js';
import { addUserCoupon, getUserCoupons, markCouponUsed } from '../models/UserCoupon.js';

export const createNewCoupon = async (req, res) => {
  try {
    const coupon = await createCoupon(req.body);
    res.json({ message: '优惠券创建成功', coupon });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const userReceiveCoupon = async (req, res) => {
  const { user_id, code } = req.body;
  try {
    const coupon = await getCouponByCode(code);
    if (!coupon) return res.status(404).json({ message: '优惠券不存在或不可用' });
    if (coupon.used_quantity >= coupon.total_quantity) {
      return res.status(400).json({ message: '优惠券已领完' });
    }
    const userCoupon = await addUserCoupon(user_id, coupon.id);
    await updateCouponUsage(coupon.id);
    res.json({ message: '领取成功', userCoupon });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUserAvailableCoupons = async (req, res) => {
  const user_id = req.params.userId;
  try {
    const coupons = await getUserCoupons(user_id);
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const useCoupon = async (req, res) => {
  const { user_coupon_id } = req.body;
  try {
    const couponUsed = await markCouponUsed(user_coupon_id);
    res.json({ message: '优惠券使用成功', couponUsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
