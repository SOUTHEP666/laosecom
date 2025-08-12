import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import merchantRoutes from "./routes/merchants.js";
import merchantproductRoutes from "./routes/merchantProducts.js";
import orderRoutes from "./routes/orders.js";
import notificationsRouter from "./routes/notifications.js";
import adminRoutes from "./routes/admin.js";
import publicProductRoutes from "./routes/publicProducts.js";
import categoriesRoutes from './routes/categories.js';
import productImagesRoutes from './routes/productImages.js';
import productAttributesRoutes from './routes/productAttributes.js';
import productVariantsRoutes from './routes/productVariants.js';
import productReviewsRoutes from './routes/productReviews.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 允许的前端域名
const allowedOrigins = [
  "http://localhost:5173",
  "https://laostrade.netlify.app",
  "https://laostrade-admin.netlify.app"
];

// 日志中间件
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// CORS 配置
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`❌ 拦截不允许的来源: ${origin}`);
        callback(new Error("CORS not allowed"), false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 显式处理 OPTIONS 预检请求
app.options("*", cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// 解析请求体
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 路由挂载
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/merchants", merchantRoutes);
app.use("/api/orders", orderRoutes);
app.use("/notifications", notificationsRouter);
app.use("/api/admin", adminRoutes);
app.use("/api/products", publicProductRoutes);
app.use("/api/merchant/products", merchantproductRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/product-images", productImagesRoutes);
app.use("/api/product-attributes", productAttributesRoutes);
app.use("/api/product-variants", productVariantsRoutes);
app.use("/api/product-reviews", productReviewsRoutes);

// 健康检查接口
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({ message: "接口不存在" });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error("❌ 错误信息：", err.stack);
  res.status(500).json({ message: err.message || "服务器内部错误" });
});

// 启动服务
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
