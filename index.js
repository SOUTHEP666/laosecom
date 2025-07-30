import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { authMiddleware } from './middlewares/auth.js';
import authRoutes from './routes/auth.js';
import pkg from 'pg';

dotenv.config();
const { Pool } = pkg;
const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// PostgreSQL 连接池
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Cloudinary 配置
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// multer + Cloudinary 多图存储配置
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
});
const upload = multer({ storage });

// 路由挂载
app.use('/api/auth', authRoutes);

// ✅ 多图上传接口（需登录）
app.post('/api/upload', authMiddleware, upload.array('images', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: '没有上传任何图片' });
  }

  const imageUrls = req.files.map(file => file.path);
  res.json({ message: '上传成功', images: imageUrls });
});

// 测试接口
app.get('/api/ping', (req, res) => res.json({ message: 'pong' }));

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
