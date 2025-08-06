// controllers/categoryController.js
import {
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
  getPaginatedCategories,
  getTotalCategoryCount,
} from "../models/categoryModel.js";

// 创建分类
export const addCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = await createCategory(name, description);
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: "创建分类失败", error: err.message });
  }
};

// 编辑分类
export const editCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, description } = req.body;
    const category = await updateCategory(id, name, description);
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: "更新分类失败", error: err.message });
  }
};

// 删除分类
export const removeCategory = async (req, res) => {
  try {
    const id = req.params.id;
    await deleteCategory(id);
    res.json({ message: "分类删除成功" });
  } catch (err) {
    res.status(500).json({ message: "删除失败", error: err.message });
  }
};

// 获取全部分类（前台展示）
export const listAllCategories = async (req, res) => {
  try {
    const categories = await getAllCategories();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: "获取分类失败", error: err.message });
  }
};

// 获取分页分类（后台展示）
export const listPaginatedCategories = async (req, res) => {
  try {
    const { page = 1, limit = 10, keyword = "" } = req.query;
    const data = await getPaginatedCategories(Number(page), Number(limit), keyword);
    const total = await getTotalCategoryCount(keyword);
    res.json({ list: data, total });
  } catch (err) {
    res.status(500).json({ message: "获取失败", error: err.message });
  }
};
