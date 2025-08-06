import { query } from "../config/db.js";

// 商家仪表盘：订单数 + 商品数
export const getDashboard = async (req, res) => {
  const sellerId = req.user.id;
  try {
    const productResult = await query("SELECT COUNT(*) FROM products WHERE seller_id = $1", [sellerId]);
    const orderResult = await query("SELECT COUNT(*) FROM orders WHERE seller_id = $1", [sellerId]);

    res.json({
      product_count: parseInt(productResult.rows[0].count),
      order_count: parseInt(orderResult.rows[0].count),
    });
  } catch (err) {
    console.error("获取商家仪表盘失败:", err);
    res.status(500).json({ message: "服务器错误" });
  }
};

// 获取商家商品列表
export const getSellerProducts = async (req, res) => {
  const sellerId = req.user.id;
  try {
    const result = await query("SELECT * FROM products WHERE seller_id = $1", [sellerId]);
    res.json(result.rows);
  } catch (err) {
    console.error("获取商家商品失败:", err);
    res.status(500).json({ message: "服务器错误" });
  }
};

// 商家发布商品
export const createProduct = async (req, res) => {
  const { title, description, price, stock, category_id, image_url } = req.body;
  const sellerId = req.user.id;

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

// 商家更新商品
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

// 商家删除商品
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
