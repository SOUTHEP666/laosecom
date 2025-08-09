import express from "express";
import multer from "multer";
import cloudinary from "../utils/cloudinary.js";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { authenticate, authorize } from "../middleware/auth.js";
import { query } from "../config/db.js";

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "products",
    allowed_formats: ["jpg", "jpeg", "png", "gif"],
  },
});

const upload = multer({ storage });

// 上传图片接口（支持多张）
router.post(
  "/upload",
  authenticate,
  authorize(["merchant"]),
  upload.array("images", 5),  // 改成支持多张，字段名 images，最大5张
  (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No image files uploaded" });
      }
      const imageUrls = req.files.map(file => file.path);
      res.json({ imageUrls });
    } catch (err) {
      console.error(err);
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

export default router;
