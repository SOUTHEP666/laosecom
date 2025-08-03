import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// 导入路由
import userRoutes from "./routes/user.js";
import pointRoutes from "./routes/point.js";
import roleRoutes from "./routes/role.js";
import merchantRoutes from "./routes/merchant.js";
import productRoutes from "./routes/products.js";
import cartRoutes from "./routes/cart.js";
import paymentRoutes from "./routes/payment.js";
import shippingRoutes from "./routes/shipping.js";
import couponRoutes from "./routes/coupon.js";

// 初始化数据库（连接池）
import { pool } from './config/db.js';
import * as Cart from './models/Cart.js';
import * as Order from './models/Order.js';
import * as OrderItem from './models/OrderItem.js';

dotenv.config();
const app = express();

// ✅ 跨域配置（前后端分离）
const allowedOrigins = [
  "https://laostrade.onrender.com", // 前端上线地址
  "http://localhost:5173",           // 本地开发地址
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.options("*", cors()); // 预检请求处理

app.use(express.json()); // 解析 JSON 请求体

// 路由挂载
app.use("/api/user", userRoutes);
app.use("/api/points", pointRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/merchants", merchantRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/coupons", couponRoutes);

// 根路径返回接口状态
app.get("/", (req, res) => {
  res.send("✅ API 服务运行中！");
});

// 启动服务
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
