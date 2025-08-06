import { query } from "../config/db.js";

// 获取所有分类
export const getCategories = async (req, res) => {
  try {
    const result = await query("SELECT * FROM categories ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    console.error("获取分类失败:", err);
    res.status(500).json({ message: "服务器错误" });
  }
};

// 添加分类
export const createCategory = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "分类名不能为空" });

  try {
    const result = await query("INSERT INTO categories (name) VALUES ($1) RETURNING *", [name]);
    res.status(201).json({ message: "分类创建成功", category: result.rows[0] });
  } catch (err) {
    console.error("创建分类失败:", err);
    res.status(500).json({ message: "服务器错误" });
  }
};

// 编辑分类
export const updateCategory = async (req, res) => {
  const id = req.params.id;
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "分类名不能为空" });

  try {
    const result = await query("UPDATE categories SET name = $1 WHERE id = $2 RETURNING *", [name, id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "分类不存在" });
    res.json({ message: "分类更新成功", category: result.rows[0] });
  } catch (err) {
    console.error("更新分类失败:", err);
    res.status(500).json({ message: "服务器错误" });
  }
};

// 删除分类
export const deleteCategory = async (req, res) => {
  const id = req.params.id;

  try {
    const result = await query("DELETE FROM categories WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "分类不存在" });
    res.json({ message: "分类删除成功" });
  } catch (err) {
    console.error("删除分类失败:", err);
    res.status(500).json({ message: "服务器错误" });
  }
};
