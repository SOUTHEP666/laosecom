import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { query } from '../config/db.js';

const router = express.Router();

/**
 * 获取所有属性
 */
router.get('/attributes', async (req, res) => {
  try {
    const result = await query('SELECT * FROM product_attributes ORDER BY attribute_id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: '获取属性失败' });
  }
});

/**
 * 添加属性（仅管理员可添加全局属性）
 */
router.post('/attributes', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { attribute_name } = req.body;
    const result = await query(
      'INSERT INTO product_attributes (attribute_name) VALUES ($1) RETURNING *',
      [attribute_name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: '添加属性失败' });
  }
});

/**
 * 获取某属性的所有值
 */
router.get('/attributes/:attributeId/values', async (req, res) => {
  try {
    const { attributeId } = req.params;
    const result = await query(
      'SELECT * FROM attribute_values WHERE attribute_id = $1 ORDER BY value_id',
      [attributeId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: '获取属性值失败' });
  }
});

/**
 * 添加属性值（仅管理员可添加）
 */
router.post('/attributes/:attributeId/values', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { attributeId } = req.params;
    const { value } = req.body;
    const result = await query(
      'INSERT INTO attribute_values (attribute_id, value) VALUES ($1, $2) RETURNING *',
      [attributeId, value]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: '添加属性值失败' });
  }
});

/**
 * 为商品绑定属性值（商家可操作）
 */
router.post('/product/:productId/attributes', authenticate, authorize(['merchant']), async (req, res) => {
  try {
    const { productId } = req.params;
    const { attribute_id, value_id } = req.body;

    const result = await query(
      'INSERT INTO product_attribute_mapping (product_id, attribute_id, value_id) VALUES ($1, $2, $3) RETURNING *',
      [productId, attribute_id, value_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: '绑定属性失败' });
  }
});

/**
 * 获取商品的属性列表
 */
router.get('/product/:productId/attributes', async (req, res) => {
  try {
    const { productId } = req.params;
    const result = await query(`
      SELECT pa.attribute_id, pa.attribute_name, av.value_id, av.value
      FROM product_attribute_mapping pam
      JOIN product_attributes pa ON pam.attribute_id = pa.attribute_id
      JOIN attribute_values av ON pam.value_id = av.value_id
      WHERE pam.product_id = $1
      ORDER BY pa.attribute_id
    `, [productId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: '获取商品属性失败' });
  }
});

export default router;
