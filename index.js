import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import userRoutes from "./routes/user.js";
import pointRoutes from "./routes/point.js";
import roleRoutes from "./routes/role.js";
import merchantRoutes from "./routes/merchant.js";
import productRoutes from "./routes/products.js";
import cartRoutes from "./routes/cart.js";
import paymentRoutes from './routes/payment.js';
import shippingRoutes from './routes/shipping.js';
import couponRoutes from './routes/coupon.js';

import { pool } from './config/db.js';

import * as Cart from './models/Cart.js';
import * as Order from './models/Order.js';
import * as OrderItem from './models/OrderItem.js';

dotenv.config();

const app = express();

// 允许跨域的域名数组（加上你的前端域名）
const allowedOrigins = [
  "https://laostrade.onrender.com",
  "http://localhost:5173", // 本地开发地址
];

// cors 配置
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// 处理预检请求
app.options("*", cors());

// 解析 JSON 请求体
app.use(express.json());

// 路由注册
app.use("/api/user", userRoutes);
app.use("/api/points", pointRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/merchants", merchantRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/coupons", couponRoutes);

// 根路径测试用
app.get('/', (req, res) => {
  res.send('Server is running');
});

// 启动服务
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
