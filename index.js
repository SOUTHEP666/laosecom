import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import merchantRoutes from "./routes/merchants.js";
import productRoutes from "./routes/merchantProducts.js";
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

const allowedOrigins = [
  "https://laostrade.onrender.com",
  "http://localhost:5173",
  "https://laostrade.netlify.app",
  "https://laostrade-admin.netlify.app",
  "https://laosecom.onrender.com",
];

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use(cors({
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
}));

app.options("*", cors());

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// 路由挂载
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/merchants", merchantRoutes);
app.use("/api/orders", orderRoutes);
app.use("/notifications", notificationsRouter);
app.use("/api/admin", adminRoutes);
app.use("/api/products", publicProductRoutes);







app.use("/api/merchant/products", productRoutes);  // 注意这个前缀
app.use('/api/categories', categoriesRoutes);
app.use('/api/product-images', productImagesRoutes);
app.use('/api/product-attributes', productAttributesRoutes);
app.use('/api/product-variants', productVariantsRoutes);
app.use('/api/product-reviews', productReviewsRoutes);





app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// 404
app.use((req, res, next) => {
  res.status(404).json({ message: "接口不存在" });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error("❌ 错误信息：", err.stack);
  res.status(500).json({ message: err.message || "服务器内部错误" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
