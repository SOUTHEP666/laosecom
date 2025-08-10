import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { query } from '../config/db.js';

const router = express.Router();

// 获取某商品已审核通过的评价
router.get('/product/:productId', async (req, res) => {
  const { productId } = req.params;
  try {
    const result = await query(`
      SELECT pr.*, u.username
      FROM product_reviews pr
      JOIN users u ON pr.user_id = u.id
      WHERE pr.product_id = $1 AND pr.is_approved = TRUE
      ORDER BY pr.date_created DESC
    `, [productId]);
    res.json(result.rows);
  } catch (err) {
    console.error('获取评价失败', err);
    res.status(500).json({ error: '获取评价失败' });
  }
});

// 用户新增评价（必须登录，买家身份）
router.post('/product/:productId', authenticate, authorize(['buyer']), async (req, res) => {
  const { productId } = req.params;
  const { rating, review_text } = req.body;
  try {
    // 可加：检查用户是否购买过该商品（此处略）

    const insertRes = await query(`
      INSERT INTO product_reviews (product_id, user_id, rating, review_text, date_created, is_approved)
      VALUES ($1, $2, $3, $4, NOW(), FALSE)
      RETURNING *
    `, [productId, req.user.id, rating, review_text]);
    res.status(201).json(insertRes.rows[0]);
  } catch (err) {
    console.error('新增评价失败', err);
    res.status(500).json({ error: '新增评价失败' });
  }
});

// 管理员获取所有未审核评价
router.get('/pending', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  try {
    const result = await query(`
      SELECT pr.*, u.username, p.product_name
      FROM product_reviews pr
      JOIN users u ON pr.user_id = u.id
      JOIN products p ON pr.product_id = p.product_id
      WHERE pr.is_approved = FALSE
      ORDER BY pr.date_created DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('获取待审核评价失败', err);
    res.status(500).json({ error: '获取待审核评价失败' });
  }
});

// 管理员审核通过评价
router.patch('/:reviewId/approve', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  const { reviewId } = req.params;
  try {
    const updateRes = await query(`
      UPDATE product_reviews SET is_approved = TRUE WHERE review_id = $1 RETURNING *
    `, [reviewId]);
    if (updateRes.rowCount === 0) {
      return res.status(404).json({ error: '评价不存在' });
    }
    res.json({ message: '评价审核通过' });
  } catch (err) {
    console.error('审核失败', err);
    res.status(500).json({ error: '审核失败' });
  }
});

// 管理员拒绝删除评价
router.delete('/:reviewId', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  const { reviewId } = req.params;
  try {
    const delRes = await query('DELETE FROM product_reviews WHERE review_id = $1', [reviewId]);
    if (delRes.rowCount === 0) {
      return res.status(404).json({ error: '评价不存在' });
    }
    res.json({ message: '评价删除成功' });
  } catch (err) {
    console.error('删除失败', err);
    res.status(500).json({ error: '删除失败' });
  }
});

export default router;
