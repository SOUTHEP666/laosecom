// routes/merchants.js
import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { query } from '../config/db.js';

const router = express.Router();

// -------------------- 商家申请开店 --------------------
router.post('/apply', authenticate, authorize(['merchant']), async (req, res) => {
  const { store_name, contact_name, phone, email, address, business_license, notes } = req.body;
  try {
    // 查询是否已有未完成申请（pending）
    const existingPending = await query(
      'SELECT * FROM merchant_applications WHERE user_id = $1 AND status = $2',
      [req.user.id, 'pending']
    );
    if (existingPending.rows.length > 0) {
      return res.status(400).json({ message: '已有未处理的申请' });
    }

    // 查询是否已经是正式商家
    const existingMerchant = await query(
      'SELECT * FROM merchants WHERE user_id = $1',
      [req.user.id]
    );
    if (existingMerchant.rows.length > 0) {
      return res.status(400).json({ message: '您已成为正式商家，无法再次申请' });
    }

    // 插入新的申请
    const result = await query(
      `INSERT INTO merchant_applications 
      (user_id, store_name, contact_name, phone, email, address, business_license, notes, status, admin_level, admin_id, created_at, updated_at) 
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending','none', NULL, NOW(), NOW()) 
      RETURNING *`,
      [req.user.id, store_name, contact_name, phone, email, address, business_license, notes]
    );

    res.status(201).json({ application: result.rows[0] });
  } catch (err) {
    console.error('商家申请失败:', err);
    res.status(500).json({ error: '申请失败' });
  }
});

// -------------------- 商家查看自己申请状态 --------------------
router.get('/apply/me', authenticate, authorize(['merchant']), async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM merchant_applications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: '无申请记录' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('获取申请信息失败:', err);
    res.status(500).json({ error: '获取申请信息失败' });
  }
});

// -------------------- 商家获取审核状态 --------------------
router.get('/status', authenticate, authorize(['merchant']), async (req, res) => {
  try {
    const result = await query('SELECT * FROM merchants WHERE user_id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.json({ status: 'no_apply' });
    }
    return res.json({ status: 'approved', merchant: result.rows[0] });
  } catch (err) {
    console.error('获取审核状态失败:', err);
    res.status(500).json({ error: '获取审核状态失败' });
  }
});

// -------------------- 管理员获取待审核商家 --------------------
router.get('/apply/pending', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT ma.application_id, ma.store_name, ma.status, u.username, u.email
       FROM merchant_applications ma
       JOIN users u ON ma.user_id = u.id
       WHERE ma.status = 'pending'
       ORDER BY ma.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM merchant_applications WHERE status = 'pending'`
    );
    const total = parseInt(countResult.rows[0].count, 10);

    res.json({ total, page, limit, data: result.rows });
  } catch (err) {
    console.error('获取待审核申请失败:', err);
    res.status(500).json({ error: '获取待审核申请失败' });
  }
});

// -------------------- 管理员审核通过 --------------------
router.patch('/apply/:id/approve', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  const applicationId = parseInt(req.params.id, 10);
  try {
    const adminId = req.user.id;
    const adminLevel = req.user.role === 'superadmin' ? 'level2' : 'level1';

    // 更新申请状态
    const result = await query(
      `UPDATE merchant_applications 
       SET status = 'approved', admin_level = $1, admin_id = $2, updated_at = NOW() 
       WHERE application_id = $3 
       RETURNING *`,
      [adminLevel, adminId, applicationId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: '申请不存在' });
    }

    const application = result.rows[0];

    // 创建正式商家（若不存在）
    const exist = await query(
      `SELECT * FROM merchants WHERE user_id = $1`,
      [application.user_id]
    );
    if (exist.rows.length === 0) {
      await query(
        `INSERT INTO merchants (user_id, store_name, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())`,
        [application.user_id, application.store_name]
      );
    }

    res.json({ message: '审核通过，商家已激活', application });
  } catch (err) {
    console.error('审核通过失败:', err);
    res.status(500).json({ error: '审核失败' });
  }
});

// -------------------- 管理员审核拒绝 --------------------
router.patch('/apply/:id/reject', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  const applicationId = parseInt(req.params.id, 10);
  try {
    const adminId = req.user.id;
    const adminLevel = req.user.role === 'superadmin' ? 'level2' : 'level1';

    const result = await query(
      `UPDATE merchant_applications 
       SET status = 'rejected', admin_level = $1, admin_id = $2, updated_at = NOW() 
       WHERE application_id = $3 RETURNING *`,
      [adminLevel, adminId, applicationId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: '申请不存在' });
    }

    res.json({ message: '审核拒绝', application: result.rows[0] });
  } catch (err) {
    console.error('审核拒绝失败:', err);
    res.status(500).json({ error: '审核失败' });
  }
});

export default router;
