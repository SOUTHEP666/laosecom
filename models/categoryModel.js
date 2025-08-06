// models/categoryModel.js
import { pool } from "../config/db.js";

// 创建分类
export const createCategory = async (name, description) => {
  const result = await pool.query(
    "INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *",
    [name, description]
  );
  return result.rows[0];
};

// 更新分类
export const updateCategory = async (id, name, description) => {
  const result = await pool.query(
    "UPDATE categories SET name=$1, description=$2 WHERE id=$3 RETURNING *",
    [name, description, id]
  );
  return result.rows[0];
};

// 删除分类
export const deleteCategory = async (id) => {
  await pool.query("DELETE FROM categories WHERE id = $1", [id]);
};

// 获取全部分类（用于前台）
export const getAllCategories = async () => {
  const result = await pool.query("SELECT * FROM categories ORDER BY id DESC");
  return result.rows;
};

// 获取分页分类（用于后台）
export const getPaginatedCategories = async (page, limit, keyword) => {
  const offset = (page - 1) * limit;
  const result = await pool.query(
    `SELECT * FROM categories 
     WHERE name ILIKE $1
     ORDER BY id DESC
     LIMIT $2 OFFSET $3`,
    [`%${keyword}%`, limit, offset]
  );
  return result.rows;
};

// 获取总数量（分页用）
export const getTotalCategoryCount = async (keyword) => {
  const result = await pool.query(
    `SELECT COUNT(*) FROM categories WHERE name ILIKE $1`,
    [`%${keyword}%`]
  );
  return parseInt(result.rows[0].count, 10);
};
