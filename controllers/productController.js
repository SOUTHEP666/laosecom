import { query } from '../config/db.js';

// 添加新商品
export const createProduct = async (req, res) => {
  try {
    let { title, description, price, category_id, stock, image_url, status } = req.body;

    if (!title || !price || !category_id) {
      return res.status(400).json({ message: '缺少必要字段' });
    }

    if (Array.isArray(image_url)) {
      image_url = JSON.stringify(image_url);
    } else if (typeof image_url !== 'string') {
      image_url = '[]';
    }

    const result = await query(
      `INSERT INTO products (title, description, price, category_id, stock, image_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, description, price, category_id, stock || 0, image_url, status || 'pending']
    );

    const product = result.rows[0];
    try {
      product.image_url = JSON.parse(product.image_url);
    } catch {
      product.image_url = [];
    }

    res.status(201).json({ message: '商品添加成功', product });
  } catch (error) {
    res.status(500).json({ message: '添加商品失败', error: error.message });
  }
};

// 获取所有商品（支持分页和筛选）
export const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, category_id, status, keyword } = req.query;

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

    if (keyword) {
      sql += ` AND title ILIKE $${idx++}`;
      params.push(`%${keyword}%`);
    }

    // 分页
    sql += ` ORDER BY id DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(Number(limit));
    params.push((Number(page) - 1) * Number(limit));

    const result = await query(sql, params);

    // 解析 image_url
    const products = result.rows.map(item => {
      try {
        item.image_url = JSON.parse(item.image_url);
      } catch {
        item.image_url = [];
      }
      return item;
    });

    res.json({ products, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ message: '获取商品失败', error: error.message });
  }
};

// 获取单个商品详情
export const getProductById = async (req, res) => {
  try {
    const result = await query('SELECT * FROM products WHERE id = $1', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '商品不存在' });
    }

    const product = result.rows[0];
    try {
      product.image_url = JSON.parse(product.image_url);
    } catch {
      product.image_url = [];
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: '获取商品失败', error: error.message });
  }
};

// 更新商品
export const updateProduct = async (req, res) => {
  try {
    let { title, description, price, category_id, stock, image_url, status } = req.body;
    const { id } = req.params;

    if (!id || !title || !price || !category_id) {
      return res.status(400).json({ message: '缺少必要字段' });
    }

    if (Array.isArray(image_url)) {
      image_url = JSON.stringify(image_url);
    } else if (typeof image_url !== 'string') {
      image_url = '[]';
    }

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

    const product = result.rows[0];
    try {
      product.image_url = JSON.parse(product.image_url);
    } catch {
      product.image_url = [];
    }

    res.json({ message: '商品更新成功', product });
  } catch (error) {
    res.status(500).json({ message: '更新商品失败', error: error.message });
  }
};

// 添加商品评论
export const reviewProduct = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ message: '评分必须是 1 到 5 的数字' });
    }

    await query(
      `INSERT INTO reviews (product_id, rating, comment, created_at) 
       VALUES ($1, $2, $3, NOW())`,
      [productId, rating, comment || '']
    );

    res.status(201).json({ message: '评论添加成功' });
  } catch (error) {
    res.status(500).json({ message: '添加评论失败', error: error.message });
  }
};
