// controllers/sellerAdminController.js
import { pool } from "../config/db.js";

// 获取所有商家（含审核状态、启用状态）
export const getAllSellers = async (req, res) => {
  try {
    const result = await pool.query("SELECT id, username, shop_name, contact_info, is_active, audit_status FROM sellers");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "获取商家失败", error: err.message });
  }
};

// 修改商家启用状态
export const updateSellerStatus = async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;
  try {
    await pool.query("UPDATE sellers SET is_active = $1 WHERE id = $2", [is_active, id]);
    res.json({ message: "商家启用状态更新成功" });
  } catch (err) {
    res.status(500).json({ message: "更新失败", error: err.message });
  }
};

// 修改商家审核状态
export const updateAuditStatus = async (req, res) => {
  const { id } = req.params;
  const { audit_status } = req.body; // "pending", "approved", "rejected"
  try {
    await pool.query("UPDATE sellers SET audit_status = $1 WHERE id = $2", [audit_status, id]);
    res.json({ message: "审核状态更新成功" });
  } catch (err) {
    res.status(500).json({ message: "更新失败", error: err.message });
  }
};
