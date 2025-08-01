import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// 引入路由
import userRoutes from "./routes/user.js";
import pointRoutes from "./routes/point.js";
import roleRoutes from "./routes/role.js";
import merchantRoutes from "./routes/merchant.js";
import productRoutes from "./routes/products.js";
import cartRoutes from "./routes/cart.js";  // 你发过的 cart 路由

// 引入数据库与模型
import sequelize from './config/db.js';
import * as Cart from './models/cartModel.js';  // 用 * as 方式导入
import Order from './models/Order.js';           // 假设是 Sequelize 模型
import OrderItem from './models/OrderItem.js';   // 同上

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
app.use("/api/cart", cartRoutes);  // 新加购物车路由

// 测试服务器是否正常
app.get('/', (req, res) => {
  res.send('Server is running');
});

// 同步数据库模型
sequelize.sync({ alter: true }).then(() => {
  console.log('✅ 数据库模型同步完成');
}).catch((err) => {
  console.error('❌ 数据库同步失败:', err);
});

// 启动服务
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
