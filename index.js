import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

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

const allowedOrigins = [
  "https://laostrade.onrender.com",
  "http://localhost:5173",
  "https://laostrade.netlify.app",
  "https://laostrade-admin.netlify.app",
];

// CORS 配置 - 一定要放在所有路由前面
app.use(cors({
  origin: function (origin, callback) {
    // 允许无 origin（非浏览器请求）或者白名单内的 origin 访问
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // 允许携带 cookie
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// 显式处理预检请求，避免 OPTIONS 请求被阻断
app.options("*", cors({
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

// 解析请求体
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// 路由挂载
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

// 错误处理中间件（可选）
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || "服务器内部错误" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
