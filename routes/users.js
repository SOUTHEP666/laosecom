// ✅ 示例路由 routes/users.js：超级管理员获取所有用户
import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { query } from '../config/db.js';
const router = express.Router();

// 获取所有用户（仅超级管理员）
router.get('/', authenticate, authorize(['superadmin']), async (req, res) => {
  try {
    const result = await query('SELECT id, name, email, role, created_at FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// 删除一个用户（超级管理员）
router.delete('/:id', authenticate, authorize(['superadmin']), async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;