import { query } from '../config/db.js';

// 添加新商品（POST /api/products）
export const createProduct = async (req, res) => {
  try {
    const { title, description, price, category_id, stock, image_url, status } = req.body;

    if (!title || !price || !category_id) {
      return res.status(400).json({ message: '缺少必要字段' });
    }

    const result = await query(
      `INSERT INTO products (title, description, price, category_id, stock, image_url, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, description, price, category_id, stock || 0, image_url || '', status || 'pending']
    );

    res.status(201).json({ message: '商品添加成功', product: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: '添加商品失败', error: error.message });
  }
};

// 获取所有商品（GET /api/products?category_id=1&status=approved）
export const getAllProducts = async (req, res) => {
  try {
    const { category_id, status } = req.query;
    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    let idx = 1;

    if (category_id) {
      sql += ` AND category_id = $${idx++}`;
      params.push(category_id);
    }

    if (status) {
      sql += ` AND status = $${idx++}`;
      params.push(status);
    }

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: '获取商品失败', error: error.message });
  }
};

// 获取单个商品详情（GET /api/products/:id）
export const getProductById = async (req, res) => {
  try {
    const result = await query('SELECT * FROM products WHERE id = $1', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '商品不存在' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: '获取商品失败', error: error.message });
  }
};

// 修改商品信息（PUT /api/products/:id）
export const updateProduct = async (req, res) => {
  try {
    const { title, description, price, category_id, stock, image_url, status } = req.body;
    const { id } = req.params;

    const result = await query(
      `UPDATE products SET 
        title = $1, description = $2, price = $3, category_id = $4, 
        stock = $5, image_url = $6, status = $7 
       WHERE id = $8 RETURNING *`,
      [title, description, price, category_id, stock, image_url, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '商品不存在' });
    }

    res.json({ message: '商品更新成功', product: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: '更新商品失败', error: error.message });
  }
};

// 删除商品（DELETE /api/products/:id）
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '商品不存在' });
    }

    res.json({ message: '商品删除成功' });
  } catch (error) {
    res.status(500).json({ message: '删除商品失败', error: error.message });
  }
};

// 修改库存（PATCH /api/products/:id/stock）
export const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { change } = req.body;

    const result = await query(
      'UPDATE products SET stock = stock + $1 WHERE id = $2 RETURNING *',
      [change, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '商品不存在' });
    }

    res.json({ message: '库存更新成功', product: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: '库存更新失败', error: error.message });
  }
};

// 商品审核通过（POST /api/products/:id/review）
export const reviewProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'UPDATE products SET status = $1 WHERE id = $2 RETURNING *',
      ['approved', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '商品不存在或已审核' });
    }

    res.json({ message: '商品审核通过', product: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: '审核失败', error: error.message });
  }
};
