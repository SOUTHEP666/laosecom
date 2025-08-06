import { query } from "../config/db.js";

// 获取商品列表，支持分页、搜索、分类、按商家筛选
export const getProducts = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "", category_id, seller_id } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const offset = (page - 1) * limit;

    let baseQuery = "SELECT * FROM products WHERE 1=1";
    const params = [];
    let idx = 1;

    if (search) {
      baseQuery += ` AND title ILIKE $${idx++}`;
      params.push(`%${search}%`);
    }

    if (category_id) {
      baseQuery += ` AND category_id = $${idx++}`;
      params.push(category_id);
    }

    if (seller_id) {
      baseQuery += ` AND seller_id = $${idx++}`;
      params.push(seller_id);
    }

    baseQuery += ` ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);

    const result = await query(baseQuery, params);
    res.json({ page, limit, products: result.rows });
  } catch (err) {
    console.error("获取商品列表失败:", err);
    res.status(500).json({ message: "服务器错误" });
  }
};

// 获取单个商品详情
export const getProductById = async (req, res) => {
  try {
    const productId = req.params.id;
    const result = await query("SELECT * FROM products WHERE id = $1", [productId]);

    if (result.rows.length === 0) return res.status(404).json({ message: "商品未找到" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("获取商品详情失败:", err);
    res.status(500).json({ message: "服务器错误" });
  }
};

// 新增商品（仅商家）
export const createProduct = async (req, res) => {
  const sellerId = req.user.id;
  const { title, description, price, stock, category_id, image_url } = req.body;

  try {
    const result = await query(
      `INSERT INTO products (title, description, price, stock, category_id, seller_id, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, description, price, stock, category_id, sellerId, image_url]
    );
    res.status(201).json({ message: "商品创建成功", product: result.rows[0] });
  } catch (err) {
    console.error("创建商品失败:", err);
    res.status(500).json({ message: "服务器错误" });
  }
};

// 编辑商品（仅商家）
export const updateProduct = async (req, res) => {
  const productId = req.params.id;
  const sellerId = req.user.id;
  const { title, description, price, stock, category_id, image_url } = req.body;

  try {
    const result = await query(
      `UPDATE products SET title = $1, description = $2, price = $3, stock = $4, category_id = $5, image_url = $6
       WHERE id = $7 AND seller_id = $8 RETURNING *`,
      [title, description, price, stock, category_id, image_url, productId, sellerId]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: "商品不存在或无权限" });

    res.json({ message: "商品更新成功", product: result.rows[0] });
  } catch (err) {
    console.error("更新商品失败:", err);
    res.status(500).json({ message: "服务器错误" });
  }
};

// 删除商品（仅商家）
export const deleteProduct = async (req, res) => {
  const productId = req.params.id;
  const sellerId = req.user.id;

  try {
    const result = await query("DELETE FROM products WHERE id = $1 AND seller_id = $2 RETURNING *", [
      productId,
      sellerId,
    ]);
    if (result.rows.length === 0) return res.status(404).json({ message: "商品不存在或无权限" });
    res.json({ message: "商品已删除" });
  } catch (err) {
    console.error("删除商品失败:", err);
    res.status(500).json({ message: "服务器错误" });
  }
};
