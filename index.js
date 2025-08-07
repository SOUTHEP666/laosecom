import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

import { query, pool } from "./config/db.js";

import authRoutes from "./routes/auth.js";
import protectedRoutes from "./routes/protected.js";
import adminRoutes from "./routes/admin.js";
import merchantRoutes from "./routes/merchantRoutes.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import settlementRoutes from "./routes/settlement.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  "https://laostrade.onrender.com",
  "http://localhost:5173",
  "https://laostrade.netlify.app",
  "https://laostrade-admin.netlify.app",
  "https://laosecom.onrender.com", // 新增，必须允许你的后端地址
];

// 日志中间件
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// 跨域配置
app.use(
  cors({
    origin: function (origin, callback) {
      console.log("CORS origin:", origin);
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`不允许的来源：${origin}`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors()); // 预检请求处理

// 通用中间件
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// 路由挂载
app.use("/api/auth", authRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/merchant", merchantRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/settlement", settlementRoutes);

// 健康检查
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// 404 处理
app.use((req, res, next) => {
  res.status(404).json({ message: "接口不存在" });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error("❌ 错误信息：", err.stack);
  res.status(500).json({ message: err.message || "服务器内部错误" });
});

// 启动服务
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
