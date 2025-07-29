import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cloudinary from 'cloudinary';
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
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// multer + Cloudinary 存储
const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: 'uploads',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  },
});
const upload = multer({ storage });

// 路由挂载
app.use('/api/auth', authRoutes);

// 图片上传接口（需要登录）
app.post('/api/upload', authMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '上传失败' });
  res.json({ imageUrl: req.file.path });
});

// 测试接口
app.get('/api/ping', (req, res) => res.json({ message: 'pong' }));

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
