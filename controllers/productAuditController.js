import { pool } from "../config/db.js";

// 管理员获取待审核商品（分页搜索）
export const getPendingProducts = async (req, res) => {
  const { page = 1, pageSize = 10, keyword = "" } = req.query;
  const offset = (page - 1) * pageSize;

  try {
    const queryText = `
      SELECT p.*, s.shop_name FROM products p
      JOIN sellers s ON p.seller_id = s.id
      WHERE p.audit_status = 'pending' AND (p.title ILIKE $1 OR s.shop_name ILIKE $1)
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const values = [`%${keyword}%`, pageSize, offset];
    const result = await pool.query(queryText, values);

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM products p JOIN sellers s ON p.seller_id = s.id WHERE p.audit_status = 'pending' AND (p.title ILIKE $1 OR s.shop_name ILIKE $1)`,
      [`%${keyword}%`]
    );

    res.json({
      data: result.rows,
      total: parseInt(countRes.rows[0].count, 10),
    });
  } catch (error) {
    res.status(500).json({ message: "获取待审核商品失败", error: error.message });
  }
};

// 审核商品（通过/拒绝）
export const auditProduct = async (req, res) => {
  const productId = req.params.id;
  const { audit_status } = req.body;

  if (!["approved", "rejected"].includes(audit_status)) {
    return res.status(400).json({ message: "无效审核状态" });
  }

  const isActive = audit_status === "approved";

  try {
    await pool.query(
      `UPDATE products SET audit_status = $1, is_active = $2 WHERE id = $3`,
      [audit_status, isActive, productId]
    );
    res.json({ message: "商品审核状态更新成功" });
  } catch (error) {
    res.status(500).json({ message: "审核更新失败", error: error.message });
  }
};
