import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { query } from '../config/db.js';

const router = express.Router();

// 获取当前登录用户通知列表
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('获取通知失败', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 标记通知为已读
router.patch('/:id/read', authenticate, async (req, res) => {
  const id = req.params.id;
  try {
    const result = await query(
      'UPDATE notifications SET is_read = true WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '通知不存在' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('标记通知已读失败', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
