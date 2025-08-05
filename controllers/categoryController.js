// controllers/categoryController.js
import { pool } from '../config/db.js';

export const getCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY "sortOrder" ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createCategory = async (req, res) => {
  const { name, parentId = null, sortOrder = 0, isShow = true } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO categories (name, "parentId", "sortOrder", "isShow") VALUES ($1, $2, $3, $4) RETURNING *',
      [name, parentId, sortOrder, isShow]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateCategory = async (req, res) => {
  const id = req.params.id;
  const { name, parentId = null, sortOrder = 0, isShow = true } = req.body;
  try {
    const result = await pool.query(
      `UPDATE categories SET name=$1, "parentId"=$2, "sortOrder"=$3, "isShow"=$4 WHERE id=$5 RETURNING *`,
      [name, parentId, sortOrder, isShow, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteCategory = async (req, res) => {
  const id = req.params.id;
  try {
    await pool.query('DELETE FROM categories WHERE id=$1', [id]);
    res.json({ message: '分类删除成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
