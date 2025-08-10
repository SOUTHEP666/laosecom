import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { query } from '../config/db.js';

const router = express.Router();

// 获取某商品所有变体
router.get('/product/:productId/variants', async (req, res) => {
  const { productId } = req.params;
  try {
    const result = await query(`
      SELECT pv.*, pi.image_url
      FROM product_variants pv
      LEFT JOIN product_images pi ON pv.image_id = pi.image_id
      WHERE pv.product_id = $1
      ORDER BY pv.variant_id
    `, [productId]);
    res.json(result.rows);
  } catch (err) {
    console.error('获取变体失败', err);
    res.status(500).json({ error: '获取变体失败' });
  }
});

// 新增商品变体（商家权限）
router.post('/product/:productId/variants', authenticate, authorize(['merchant']), async (req, res) => {
  const { productId } = req.params;
  const { variant_sku, price_adjustment = 0, stock_quantity = 0, image_id = null } = req.body;
  try {
    // 可先校验商品是否属于当前商家（这里示例简单，实际可加判断）
    const insertRes = await query(`
      INSERT INTO product_variants 
      (product_id, variant_sku, price_adjustment, stock_quantity, image_id, date_created, date_modified)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `, [productId, variant_sku, price_adjustment, stock_quantity, image_id]);
    res.status(201).json(insertRes.rows[0]);
  } catch (err) {
    console.error('新增变体失败', err);
    res.status(500).json({ error: '新增变体失败' });
  }
});

// 修改变体
router.put('/variants/:variantId', authenticate, authorize(['merchant']), async (req, res) => {
  const { variantId } = req.params;
  const { variant_sku, price_adjustment, stock_quantity, image_id } = req.body;
  try {
    const updateRes = await query(`
      UPDATE product_variants SET
        variant_sku=$1,
        price_adjustment=$2,
        stock_quantity=$3,
        image_id=$4,
        date_modified=NOW()
      WHERE variant_id=$5
      RETURNING *
    `, [variant_sku, price_adjustment, stock_quantity, image_id, variantId]);
    if (updateRes.rowCount === 0) {
      return res.status(404).json({ error: '变体不存在' });
    }
    res.json(updateRes.rows[0]);
  } catch (err) {
    console.error('更新变体失败', err);
    res.status(500).json({ error: '更新变体失败' });
  }
});

// 删除变体
router.delete('/variants/:variantId', authenticate, authorize(['merchant']), async (req, res) => {
  const { variantId } = req.params;
  try {
    const delRes = await query('DELETE FROM product_variants WHERE variant_id = $1', [variantId]);
    if (delRes.rowCount === 0) {
      return res.status(404).json({ error: '变体不存在' });
    }
    res.json({ message: '变体删除成功' });
  } catch (err) {
    console.error('删除变体失败', err);
    res.status(500).json({ error: '删除变体失败' });
  }
});

export default router;
