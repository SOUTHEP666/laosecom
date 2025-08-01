import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import userRoutes from "./routes/user.js";
import pointRoutes from "./routes/point.js";
import roleRoutes from "./routes/role.js";
import merchantRoutes from "./routes/merchant.js";
import productRoutes from "./routes/products.js";
import cartRoutes from "./routes/cart.js";

import { pool } from './config/db.js';  // 纯 pg 连接池，解构导入

import * as Cart from './models/Cart.js';
import * as Order from './models/Order.js';
import * as OrderItem from './models/OrderItem.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 路由注册
app.use("/api/user", userRoutes);
app.use("/api/points", pointRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/merchants", merchantRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);

app.get('/', (req, res) => {
  res.send('Server is running');
});

// 纯 pg 不需要 sequelize.sync()

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
