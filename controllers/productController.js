// controllers/productController.js
import { pool } from "../config/db.js";

// 添加商品（仅商家）
export const createProduct = async (req, res) => {
  const { role, id: seller_id } = req.user;
  if (role !== 1) return res.status(403).json({ message: "无权限" });

  const { title, description, price, image_url, stock } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO products (title, description, price, image_url, stock, seller_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [title, description, price, image_url, stock, seller_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "添加商品失败", error: err.message });
  }
};

// 获取商家自己的商品
export const getSellerProducts = async (req, res) => {
  const { role, id: seller_id } = req.user;
  if (role !== 1) return res.status(403).json({ message: "无权限" });

  try {
    const result = await pool.query(
      "SELECT * FROM products WHERE seller_id = $1 ORDER BY created_at DESC",
      [seller_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "获取商品失败", error: err.message });
  }
};

// 更新商品
export const updateProduct = async (req, res) => {
  const { id: user_id, role } = req.user;
  const productId = req.params.id;
  const { title, description, price, image_url, stock } = req.body;

  try {
    // 验证是否为该商家的商品
    const check = await pool.query(
      "SELECT * FROM products WHERE id = $1 AND seller_id = $2",
      [productId, user_id]
    );
    if (check.rows.length === 0)
      return res.status(403).json({ message: "无权限修改" });

    const result = await pool.query(
      "UPDATE products SET title=$1, description=$2, price=$3, image_url=$4, stock=$5 WHERE id=$6 RETURNING *",
      [title, description, price, image_url, stock, productId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "更新失败", error: err.message });
  }
};

// 删除商品
export const deleteProduct = async (req, res) => {
  const { id: user_id, role } = req.user;
  const productId = req.params.id;

  try {
    const check = await pool.query(
      "SELECT * FROM products WHERE id = $1 AND seller_id = $2",
      [productId, user_id]
    );
    if (check.rows.length === 0)
      return res.status(403).json({ message: "无权限删除" });

    await pool.query("DELETE FROM products WHERE id = $1", [productId]);
    res.json({ message: "商品删除成功" });
  } catch (err) {
    res.status(500).json({ message: "删除失败", error: err.message });
  }
};
