import { query } from '../config/db.js';

// 添加新商品（POST /api/products）
export const createProduct = async (req, res) => {
  try {
    let { title, description, price, category_id, stock, image_url, status } = req.body;

    if (!title || !price || !category_id) {
      return res.status(400).json({ message: '缺少必要字段' });
    }

    // 如果 image_url 是数组，转成JSON字符串
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

    let product = result.rows[0];
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

// 获取所有商品（GET /api/products）
export const getAllProducts = async (req, res) => {
  try {
    const { category_id, status, keyword } = req.query;
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

    const result = await query(sql, params);

    const products = result.rows.map((item) => {
      try {
        item.image_url = JSON.parse(item.image_url);
      } catch {
        item.image_url = [];
      }
      return item;
    });

    res.json(products);
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

    let product = result.rows[0];
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

// 修改商品信息（PUT /api/products/:id）
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

    let product = result.rows[0];
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

// 添加商品评论（POST /api/products/:id/review）
export const reviewProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const { user, rating, comment } = req.body;

    if (!user || !rating || !comment) {
      return res.status(400).json({ message: '缺少评论必要字段' });
    }

    // 简单示例：往 reviews 表里插入评论，假设有 reviews 表，字段 product_id, user, rating, comment
    const result = await query(
      `INSERT INTO reviews (product_id, "user", rating, comment) VALUES ($1, $2, $3, $4) RETURNING *`,
      [productId, user, rating, comment]
    );

    res.status(201).json({ message: '评论添加成功', review: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: '添加评论失败', error: error.message });
  }
};
