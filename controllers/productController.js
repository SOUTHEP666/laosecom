// controllers/productController.js
import db from '../config/db.js';

// 获取所有商品（可带分类或审核状态筛选）
export const getAllProducts = async (req, res) => {
  try {
    const { category_id, status } = req.query;
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (category_id) {
      query += ' AND category_id = ?';
      params.push(category_id);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: '获取商品失败', error });
  }
};

// 获取单个商品详情
export const getProductById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: '商品不存在' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: '获取商品失败', error });
  }
};

// 添加新商品
export const addProduct = async (req, res) => {
  try {
    const { title, description, price, category_id, stock, image_url, status } = req.body;

    if (!title || !price || !category_id) {
      return res.status(400).json({ message: '缺少必要字段' });
    }

    await db.query(
      `INSERT INTO products (title, description, price, category_id, stock, image_url, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, description, price, category_id, stock || 0, image_url || '', status || 'pending']
    );

    res.json({ message: '商品添加成功' });
  } catch (error) {
    res.status(500).json({ message: '添加商品失败', error });
  }
};

// 修改商品
export const updateProduct = async (req, res) => {
  try {
    const { title, description, price, category_id, stock, image_url, status } = req.body;
    const { id } = req.params;

    await db.query(
      `UPDATE products SET title=?, description=?, price=?, category_id=?, stock=?, image_url=?, status=? 
       WHERE id=?`,
      [title, description, price, category_id, stock, image_url, status, id]
    );

    res.json({ message: '商品更新成功' });
  } catch (error) {
    res.status(500).json({ message: '更新商品失败', error });
  }
};

// 删除商品
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM products WHERE id = ?', [id]);
    res.json({ message: '商品删除成功' });
  } catch (error) {
    res.status(500).json({ message: '删除商品失败', error });
  }
};

// 修改库存（可用于下单时扣减）
export const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { change } = req.body; // 正数加库存，负数减库存

    const [result] = await db.query('UPDATE products SET stock = stock + ? WHERE id = ?', [change, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '商品不存在' });
    }

    res.json({ message: '库存更新成功' });
  } catch (error) {
    res.status(500).json({ message: '库存更新失败', error });
  }
};


// 示例：controllers/productController.js

export const approveProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, {
      status: 'approved'
    }, { new: true });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
