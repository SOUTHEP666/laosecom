// 文件路径：index.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// 路由
import userRoutes from "./routes/user.js";
import pointRoutes from "./routes/point.js";
import roleRoutes from "./routes/role.js";
import merchantRoutes from "./routes/merchant.js";
import productRoutes from "./routes/products.js";
import cartRoutes from "./routes/cart.js";

// 数据库连接
import sequelize from './config/db.js';

// 导入所有原生SQL封装函数模块
import * as Cart from './models/Cart.js';
import * as Order from './models/Order.js';
import * as OrderItem from './models/OrderItem.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 路由挂载
app.use("/api/user", userRoutes);
app.use("/api/points", pointRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/merchants", merchantRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);

// 测试服务器
app.get('/', (req, res) => {
  res.send('Server is running');
});

// 仅当你有 Sequelize 模型时才需要同步，这里可以注释掉或保留
sequelize.sync({ alter: true })
  .then(() => console.log('✅ 数据库模型同步完成'))
  .catch(err => console.error('❌ 数据库同步失败:', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
