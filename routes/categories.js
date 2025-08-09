import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { query } from '../config/db.js';

const router = express.Router();

// 获取所有分类，返回树形结构
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM categories ORDER BY category_name');
    const categories = result.rows;

    // 简单构造树形结构
    const map = {};
    const roots = [];
    categories.forEach(cat => {
      cat.children = [];
      map[cat.category_id] = cat;
    });
    categories.forEach(cat => {
      if (cat.parent_id) {
        map[cat.parent_id]?.children.push(cat);
      } else {
        roots.push(cat);
      }
    });

    res.json(roots);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取分类失败' });
  }
});

// 新增分类
router.post('/', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  const { category_name, parent_id = null, description = '', image_url = '' } = req.body;
  try {
    const result = await query(
      'INSERT INTO categories (category_name, parent_id, description, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [category_name, parent_id, description, image_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '新增分类失败' });
  }
});

// 编辑分类
router.put('/:id', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  const { id } = req.params;
  const { category_name, parent_id = null, description = '', image_url = '' } = req.body;
  try {
    const result = await query(
      'UPDATE categories SET category_name=$1, parent_id=$2, description=$3, image_url=$4 WHERE category_id=$5 RETURNING *',
      [category_name, parent_id, description, image_url, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: '分类不存在' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '更新分类失败' });
  }
});

// 删除分类
router.delete('/:id', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM categories WHERE category_id=$1', [id]);
    res.json({ message: '删除成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '删除分类失败' });
  }
});

// 获取某商品的分类
router.get('/product/:productId', async (req, res) => {
  const { productId } = req.params;
  try {
    const result = await query(
      `SELECT c.* FROM categories c
       JOIN product_category pc ON c.category_id = pc.category_id
       WHERE pc.product_id = $1`,
      [productId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取商品分类失败' });
  }
});

// 设置某商品的分类列表（覆盖）
router.post('/product/:productId', authenticate, authorize(['merchant']), async (req, res) => {
  const { productId } = req.params;
  const { category_ids } = req.body; // 传数组，比如 [1,3,5]
  try {
    // 先删除原有关联
    await query('DELETE FROM product_category WHERE product_id = $1', [productId]);

    // 再插入新关联
    for (const catId of category_ids) {
      await query('INSERT INTO product_category (product_id, category_id) VALUES ($1, $2)', [productId, catId]);
    }
    res.json({ message: '商品分类更新成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '更新商品分类失败' });
  }
});

export default router;
