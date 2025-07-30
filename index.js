import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/user.js";
import pointRoutes from "./routes/point.js";
import roleRoutes from "./routes/role.js";
import merchantRoutes from "./routes/merchant.js";
import productRoutes from './routes/products.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/user", userRoutes);
app.use("/api/points", pointRoutes);
app.use("/api/roles", roleRoutes);
app.use('/api/merchants', merchantRoutes);
app.use('/api/products', productRoutes);

// 新增一个根路由，方便测试服务器是否正常启动
app.get('/', (req, res) => {
  res.send('Server is running');
});

// 必须监听 process.env.PORT，并绑定 0.0.0.0，保证外部访问
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
