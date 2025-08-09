import express from 'express';
import multer from 'multer';
import cloudinary from '../utils/cloudinary.js';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { authenticate, authorize } from '../middleware/auth.js';
import { query } from '../config/db.js';

const router = express.Router();

// multer-cloudinary存储配置
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
  },
});

const upload = multer({ storage });

// 图片上传接口（单张）
router.post('/upload', authenticate, authorize(['merchant']), upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }
    res.json({ imageUrl: req.file.path });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Image upload failed' });
  }
});

// 获取商家所有商品列表
router.get('/products', authenticate, authorize(['merchant']), async (req, res) => {
  try {
    const result = await query('SELECT id, name, description, price, stock, images, created_at, updated_at FROM products WHERE merchant_id = $1 ORDER BY created_at DESC', [req.user.id]);
    // 解析 images JSON 字符串为数组
    const products = result.rows.map(p => ({
      ...p,
      images: p.images ? JSON.parse(p.images) : [],
    }));
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// 获取商品详情
router.get('/products/:id', authenticate, authorize(['merchant']), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('SELECT * FROM products WHERE id = $1 AND merchant_id = $2', [id, req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const product = result.rows[0];
    product.images = product.images ? JSON.parse(product.images) : [];
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get product' });
  }
});

// 新增商品
router.post('/products', authenticate, authorize(['merchant']), async (req, res) => {
  const { name, description, price, stock, images } = req.body; // images 是数组
  try {
    const imagesStr = images && Array.isArray(images) ? JSON.stringify(images) : JSON.stringify([]);
    const result = await query(
      `INSERT INTO products (merchant_id, name, description, price, stock, images, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *`,
      [req.user.id, name, description, price, stock, imagesStr]
    );
    const product = result.rows[0];
    product.images = images;
    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

// 更新商品
router.put('/products/:id', authenticate, authorize(['merchant']), async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, images } = req.body;
  try {
    // 检查商品归属
    const check = await query('SELECT * FROM products WHERE id = $1 AND merchant_id = $2', [id, req.user.id]);
    if (check.rows.length === 0) {
      return res.status(403).json({ error: 'No permission to update this product' });
    }
    const imagesStr = images && Array.isArray(images) ? JSON.stringify(images) : JSON.stringify([]);
    await query(
      `UPDATE products SET name=$1, description=$2, price=$3, stock=$4, images=$5, updated_at=NOW() WHERE id=$6`,
      [name, description, price, stock, imagesStr, id]
    );
    res.json({ message: 'Product updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// 删除商品
router.delete('/products/:id', authenticate, authorize(['merchant']), async (req, res) => {
  const { id } = req.params;
  try {
    // 检查归属
    const check = await query('SELECT * FROM products WHERE id = $1 AND merchant_id = $2', [id, req.user.id]);
    if (check.rows.length === 0) {
      return res.status(403).json({ error: 'No permission to delete this product' });
    }
    await query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
