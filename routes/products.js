import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { authenticate, authorize } from "../middleware/auth.js";
import { query } from "../config/db.js";

const router = express.Router();

// Cloudinary 配置（确保环境变量已配置）
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 设置 multer-storage-cloudinary 存储
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "products",
    allowed_formats: ["jpg", "jpeg", "png", "gif"],
  },
});

const upload = multer({ storage });

// 多文件上传，字段名必须和前端一致
router.post(
  "/upload",
  authenticate,
  authorize(["merchant"]),
  upload.array("images", 5),  // 注意这里的字段名 "images"
  (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No image files uploaded" });
      }
      const imageUrls = req.files.map((file) => file.path);
      res.json({ imageUrls });  // 返回图片地址数组
    } catch (err) {
      console.error("上传图片出错:", err);
      res.status(500).json({ error: "Image upload failed" });
    }
  }
);




// 获取商家商品列表，支持分页、搜索、分类
router.get("/", authenticate, authorize(["merchant"]), async (req, res) => {
  const { page = 1, limit = 10, keyword = "", category = "" } = req.query;
  const offset = (page - 1) * limit;

  try {
    let whereClauses = ["merchant_id = $1"];
    let values = [req.user.id];
    let idx = 2;

    if (keyword) {
      whereClauses.push(`name ILIKE $${idx++}`);
      values.push(`%${keyword}%`);
    }
    if (category) {
      whereClauses.push(`category = $${idx++}`);
      values.push(category);
    }

    const whereSQL =
      whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";

    const totalRes = await query(`SELECT COUNT(*) FROM products ${whereSQL}`, values);
    const total = parseInt(totalRes.rows[0].count);

    const sql = `
      SELECT id, name, description, price, stock, images, category, created_at, updated_at
      FROM products
      ${whereSQL}
      ORDER BY created_at DESC
      LIMIT $${idx++} OFFSET $${idx}
    `;

    values.push(limit);
    values.push(offset);

    const result = await query(sql, values);

    const products = result.rows.map((p) => ({
      ...p,
      images: p.images ? JSON.parse(p.images) : [],
    }));

    res.json({ total, data: products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// 获取商品详情
router.get("/:id", authenticate, authorize(["merchant"]), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(
      "SELECT * FROM products WHERE id = $1 AND merchant_id = $2",
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    const product = result.rows[0];
    product.images = product.images ? JSON.parse(product.images) : [];
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get product" });
  }
});

// 新增商品
router.post("/", authenticate, authorize(["merchant"]), async (req, res) => {
  const { name, description, price, stock, images, category } = req.body;
  try {
    const imagesStr = images && Array.isArray(images) ? JSON.stringify(images) : JSON.stringify([]);
    const result = await query(
      `
      INSERT INTO products (merchant_id, name, description, price, stock, images, category, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `,
      [req.user.id, name, description, price, stock, imagesStr, category]
    );
    const product = result.rows[0];
    product.images = images;
    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add product" });
  }
});

// 更新商品
router.put("/:id", authenticate, authorize(["merchant"]), async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, images, category } = req.body;
  try {
    const check = await query("SELECT * FROM products WHERE id = $1 AND merchant_id = $2", [
      id,
      req.user.id,
    ]);
    if (check.rows.length === 0) {
      return res.status(403).json({ error: "No permission to update this product" });
    }
    const imagesStr = images && Array.isArray(images) ? JSON.stringify(images) : JSON.stringify([]);
    await query(
      `
      UPDATE products SET name=$1, description=$2, price=$3, stock=$4, images=$5, category=$6, updated_at=NOW()
      WHERE id=$7
    `,
      [name, description, price, stock, imagesStr, category, id]
    );
    res.json({ message: "Product updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// 删除商品
router.delete("/:id", authenticate, authorize(["merchant"]), async (req, res) => {
  const { id } = req.params;
  try {
    const check = await query("SELECT * FROM products WHERE id = $1 AND merchant_id = $2", [
      id,
      req.user.id,
    ]);
    if (check.rows.length === 0) {
      return res.status(403).json({ error: "No permission to delete this product" });
    }
    await query("DELETE FROM products WHERE id = $1", [id]);
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// 获取所有商品（买家可访问）支持分页、搜索、分类
router.get("/all", async (req, res) => {
  const { page = 1, limit = 12, keyword = "", category = "" } = req.query;
  const offset = (page - 1) * limit;

  try {
    let whereClauses = [];
    let values = [];
    let idx = 1;

    if (keyword) {
      whereClauses.push(`name ILIKE $${idx++}`);
      values.push(`%${keyword}%`);
    }
    if (category) {
      whereClauses.push(`category = $${idx++}`);
      values.push(category);
    }

    const whereSQL = whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";

    // 联表查询卖家名称
    const countSQL = `SELECT COUNT(*) FROM products ${whereSQL}`;
    const totalRes = await query(countSQL, values);
    const total = parseInt(totalRes.rows[0].count);

    const sql = `
      SELECT p.id, p.name, p.description, p.price, p.stock, p.images, p.category, p.created_at,
             m.name AS seller_name
      FROM products p
      JOIN merchants m ON p.merchant_id = m.id
      ${whereSQL}
      ORDER BY p.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    values.push(limit, offset);

    const result = await query(sql, values);

    const products = result.rows.map((p) => ({
      ...p,
      images: p.images ? JSON.parse(p.images) : [],
    }));

    // 获取所有分类（买家首页需要）
    const categoriesRes = await query(`SELECT DISTINCT category FROM products`);
    const categories = categoriesRes.rows.map((r) => r.category).filter(Boolean);

    res.json({ total, data: products, categories });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});




export default router;
