// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

// ✅ 数据库连接
import db from "./config/db.js"; // 确保你有这个文件并正确配置连接 PG

// ✅ 路由导入
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import sellerRoutes from "./routes/seller.js";
import productRoutes from "./routes/product.js";
import categoryRoutes from "./routes/category.js";
import orderRoutes from "./routes/order.js";
import uploadRoutes from "./routes/upload.js";
import paymentRoutes from "./routes/payment.js";
import reviewRoutes from "./routes/review.js";
import sellerAdminRoutes from "./routes/sellerAdmin.js";
import productAuditRoutes from "./routes/productAudit.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ 允许跨域的来源
const allowedOrigins = [
  "https://laostrade.onrender.com",
  "http://localhost:5173",
  "https://laostrade.netlify.app",
  "https://laostrade-admin.netlify.app",
];

// ✅ 日志中间件
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ✅ 跨域设置
app.use(
  cors({
    origin: function (origin, callback) {
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

app.options("*", cors()); // 处理预检请求

// ✅ 通用中间件
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ 路由挂载
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api", uploadRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin/sellers", sellerAdminRoutes);
app.use("/api/admin/products", productAuditRoutes);

// ✅ 健康检查接口
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ✅ 404 处理
app.use((req, res, next) => {
  res.status(404).json({ message: "接口不存在" });
});

// ✅ 错误处理中间件
app.use((err, req, res, next) => {
  console.error("❌ 错误信息：", err.stack);
  res.status(500).json({ message: err.message || "服务器内部错误" });
});

// ✅ 启动服务
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
