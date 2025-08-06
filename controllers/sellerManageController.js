import { pool } from "../../config/db.js";

// 获取所有商家
export const getAllSellers = async (req, res) => {
  try {
    const result = await pool.query("SELECT id, username, shop_name, contact_info, is_active, review_status FROM sellers ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "获取商家列表失败" });
  }
};

// 更新启用状态
export const updateSellerStatus = async (req, res) => {
  const sellerId = req.params.id;
  const { is_active } = req.body;

  try {
    await pool.query("UPDATE sellers SET is_active = $1 WHERE id = $2", [is_active, sellerId]);
    res.json({ message: "商家状态已更新" });
  } catch (err) {
    res.status(500).json({ error: "更新失败" });
  }
};

// 审核状态修改
export const updateSellerReview = async (req, res) => {
  const sellerId = req.params.id;
  const { review_status } = req.body;

  if (!["pending", "approved", "rejected"].includes(review_status)) {
    return res.status(400).json({ error: "无效审核状态" });
  }

  try {
    await pool.query("UPDATE sellers SET review_status = $1 WHERE id = $2", [review_status, sellerId]);
    res.json({ message: "审核状态已更新" });
  } catch (err) {
    res.status(500).json({ error: "更新失败" });
  }
};
