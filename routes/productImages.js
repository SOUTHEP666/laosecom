import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, authorize } from '../middleware/auth.js';
import { query } from '../config/db.js';

const router = express.Router();

// 设置图片上传目录
const uploadDir = path.join(process.cwd(), 'uploads', 'product_images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + ext);
  }
});

const upload = multer({ storage });

// 获取某商品的图片
router.get('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const result = await query(
      'SELECT * FROM product_images WHERE product_id = $1 ORDER BY sort_order, image_id',
      [productId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取商品图片失败' });
  }
});

// 上传多张商品图片
router.post(
  '/:productId',
  authenticate,
  authorize(['merchant']),
  upload.array('images', 10), // 前端 form-data 里的字段名必须是 images
  async (req, res) => {
    try {
      const { productId } = req.params;
      const { alt_text = '', is_primary = false, sort_order = 0 } = req.body;

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: '未上传文件' });
      }

      const insertedImages = [];

      for (const file of req.files) {
        const imageUrl = `/uploads/product_images/${file.filename}`;
        const result = await query(
          'INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [productId, imageUrl, alt_text, is_primary, sort_order]
        );
        insertedImages.push(result.rows[0]);
      }

      res.status(201).json(insertedImages);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: '上传商品图片失败' });
    }
  }
);

// 删除图片
router.delete('/:imageId', authenticate, authorize(['merchant']), async (req, res) => {
  try {
    const { imageId } = req.params;

    const imgRes = await query('SELECT * FROM product_images WHERE image_id = $1', [imageId]);
    if (imgRes.rowCount === 0) {
      return res.status(404).json({ error: '图片不存在' });
    }

    const imagePath = path.join(process.cwd(), imgRes.rows[0].image_url);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await query('DELETE FROM product_images WHERE image_id = $1', [imageId]);

    res.json({ message: '图片删除成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '删除商品图片失败' });
  }
});

export default router;
