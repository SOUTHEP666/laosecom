// index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import merchantRoutes from './routes/merchant.js';

dotenv.config();
const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 路由挂载
app.use('/api/merchants', merchantRoutes);

// 监听端口
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
