import { query } from "../config/db.js";

// 提交商品评价
export const createReview = async (req, res) => {
  const userId = req.user.id;
  const { product_id, rating, comment } = req.body;

  if (!product_id || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "参数错误，商品ID和评分必填，评分范围1-5" });
  }

  try {
    // 可扩展：检查用户是否购买过该商品再允许评价
    const result = await query(
      `INSERT INTO reviews (product_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [product_id, userId, rating, comment]
    );
    res.status(201).json({ message: "评价提交成功", review: result.rows[0] });
  } catch (err) {
    console.error("提交评价失败:", err);
    res.status(500).json({ message: "服务器错误" });
  }
};

// 获取商品评价列表
export const getReviewsByProduct = async (req, res) => {
  const productId = req.params.productId;

  try {
    const result = await query(
      `SELECT r.*, u.username FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = $1 ORDER BY r.created_at DESC`,
      [productId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("获取评价失败:", err);
    res.status(500).json({ message: "服务器错误" });
  }
};
