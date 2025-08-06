import { pool } from "../config/db.js";

// 获取所有商家，支持分页和搜索
export const getAllSellers = async (req, res) => {
  const { page = 1, pageSize = 10, keyword = "" } = req.query;
  const offset = (page - 1) * pageSize;

  try {
    const query = `
      SELECT * FROM sellers
      WHERE username ILIKE $1 OR shop_name ILIKE $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const values = [`%${keyword}%`, pageSize, offset];
    const result = await pool.query(query, values);

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM sellers WHERE username ILIKE $1 OR shop_name ILIKE $1`,
      [`%${keyword}%`]
    );

    res.json({
      data: result.rows,
      total: parseInt(countRes.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ message: "获取商家失败", error: err.message });
  }
};

// 更新启用/禁用状态
export const updateSellerStatus = async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  try {
    await pool.query(`UPDATE sellers SET is_active = $1 WHERE id = $2`, [
      is_active,
      id,
    ]);
    res.json({ message: "状态更新成功" });
  } catch (err) {
    res.status(500).json({ message: "更新失败", error: err.message });
  }
};

// 更新审核状态
export const updateAuditStatus = async (req, res) => {
  const { id } = req.params;
  const { audit_status } = req.body;

  try {
    await pool.query(`UPDATE sellers SET audit_status = $1 WHERE id = $2`, [
      audit_status,
      id,
    ]);
    res.json({ message: "审核状态更新成功" });
  } catch (err) {
    res.status(500).json({ message: "审核更新失败", error: err.message });
  }
};
