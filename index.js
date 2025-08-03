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

import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 允许跨域的域名数组（加上你的前端域名）
const allowedOrigins = [
  "https://laostrade.onrender.com",
  "http://localhost:5173", // 本地开发地址
];

// cors 配置
app.use(cors({
  origin: function(origin, callback) {
    // 允许无origin（postman等工具请求）或者在允许列表中
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

// 解析json请求体
app.use(express.json());

// 路由注册
app.use("/api/user", userRoutes);
app.use("/api/points", pointRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/merchants", merchantRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/coupons', couponRoutes);

// 托管前端打包静态文件
app.use(express.static(path.join(__dirname, "dist")));

// 兜底路由：所有未匹配的请求返回前端 index.html，让 Vue Router 处理路由
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.get('/', (req, res) => {
  res.send('Server is running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
