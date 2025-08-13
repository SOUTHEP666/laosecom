// routes/merchants.js
import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { query } from '../config/db.js';

const router = express.Router();

/**
 * 统一判断：用户是否是“已审核通过”的商家
 * 仅当 merchants 表存在该 user_id 且 status='approved' 才放行
 */
const mustApprovedMerchant = async (req, res, next) => {
  try {
    const r = await query('SELECT status FROM merchants WHERE user_id=$1', [req.user.id]);
    if (r.rows.length === 0) {
      return res.status(403).json({ message: '您还未成为商家，请先申请' });
    }
    if (r.rows[0].status !== 'approved') {
      return res.status(403).json({ message: '您的商家申请尚未通过审核' });
    }
    next();
  } catch (e) {
    console.error('校验商家审核状态失败:', e);
    res.status(500).json({ message: '服务器错误' });
  }
};

// -------------------- 创建商家申请 --------------------
router.post('/apply', authenticate, authorize(['merchant']), async (req, res) => {
  const { store_name, contact_name, phone, email, address, business_license, notes } = req.body;
  try {
    // 已有 pending 申请
    const existingPending = await query(
      'SELECT 1 FROM merchant_applications WHERE user_id=$1 AND status=$2',
      [req.user.id, 'pending']
    );
    if (existingPending.rows.length > 0) {
      return res.status(400).json({ message: '已有未处理的申请' });
    }

    // 已是正式商家
    const existingMerchant = await query(
      'SELECT 1 FROM merchants WHERE user_id=$1 AND status=$2',
      [req.user.id, 'approved']
    );
    if (existingMerchant.rows.length > 0) {
      return res.status(400).json({ message: '您已是正式商家，无法再次申请' });
    }

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

// -------------------- 获取自己最新申请记录（可选） --------------------
router.get('/apply/me', authenticate, authorize(['merchant']), async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM merchant_applications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: '无申请记录' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('获取申请信息失败:', err);
    res.status(500).json({ error: '获取申请信息失败' });
  }
});

// -------------------- 获取审核状态（前端路由守卫依赖此接口） --------------------
router.get('/status', authenticate, authorize(['merchant']), async (req, res) => {
  try {
    // 1) 先看是否是“已通过”的正式商家
    const merchantResult = await query('SELECT * FROM merchants WHERE user_id=$1', [req.user.id]);
    if (merchantResult.rows.length > 0) {
      const status = merchantResult.rows[0].status || 'approved';
      if (status === 'approved') {
        return res.json({ status: 'approved', merchant: merchantResult.rows[0] });
      }
      // merchants 有记录但不是 approved（很少见），按照记录返回
      return res.json({ status });
    }

    // 2) 看最新申请记录
    const appResult = await query(
      'SELECT status FROM merchant_applications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );
    if (appResult.rows.length === 0) {
      return res.json({ status: 'no_apply' });
    }

    // 如果申请是 approved 但 merchants 没有记录（可能被管理员删除了正式商家）
    // 则视为未申请，避免前端误判为已通过
    if (appResult.rows[0].status === 'approved') {
      return res.json({ status: 'no_apply' });
    }

    return res.json({ status: appResult.rows[0].status });
  } catch (err) {
    console.error('获取审核状态失败:', err);
    res.status(500).json({ error: '获取审核状态失败' });
  }
});

// -------------------- 后台管理：申请列表（分页/搜索/状态筛选） --------------------
router.get('/apply/all', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status || '';
    const keyword = req.query.keyword || '';

    let whereClause = '1=1';
    const params = [];
    let idx = 1;

    if (status) {
      whereClause += ` AND ma.status=$${idx++}`;
      params.push(status);
    }

    if (keyword) {
      whereClause += ` AND (ma.store_name ILIKE $${idx} OR u.username ILIKE $${idx})`;
      params.push(`%${keyword}%`);
      idx++;
    }

    const result = await query(
      `SELECT ma.application_id, ma.store_name, ma.status, u.username, u.email
       FROM merchant_applications ma
       JOIN users u ON ma.user_id=u.id
       WHERE ${whereClause}
       ORDER BY ma.created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      [...params, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM merchant_applications ma
       JOIN users u ON ma.user_id=u.id
       WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    res.json({ total, page, limit, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取商家列表失败' });
  }
});

// -------------------- 管理员编辑申请 --------------------
router.put('/apply/:id', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { store_name, contact_name, phone, email, address, business_license, notes, status } = req.body;
  try {
    const result = await query(
      `UPDATE merchant_applications SET
       store_name=$1, contact_name=$2, phone=$3, email=$4, address=$5, business_license=$6, notes=$7, status=$8, updated_at=NOW()
       WHERE application_id=$9 RETURNING *`,
      [store_name, contact_name, phone, email, address, business_license, notes, status, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: '申请不存在' });

    // 如果改成 approved，确保 merchants 表有正式商家记录
    if (status === 'approved') {
      const application = result.rows[0];
      const exist = await query('SELECT 1 FROM merchants WHERE user_id=$1', [application.user_id]);
      if (exist.rows.length === 0) {
        await query(
          `INSERT INTO merchants (user_id, store_name, status, created_at, updated_at)
           VALUES ($1,$2,'approved',NOW(),NOW())`,
          [application.user_id, application.store_name]
        );
      } else {
        await query(
          `UPDATE merchants SET status='approved', store_name=$1, updated_at=NOW() WHERE user_id=$2`,
          [application.store_name, application.user_id]
        );
      }
    }

    res.json({ message: '修改成功', application: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '修改失败' });
  }
});

// -------------------- 管理员删除申请 --------------------
router.delete('/apply/:id', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const result = await query('DELETE FROM merchant_applications WHERE application_id=$1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: '申请不存在' });
    res.json({ message: '删除成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '删除失败' });
  }
});

// -------------------- 管理员修改申请状态（通过/拒绝） --------------------
router.patch('/apply/:id/status', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { status } = req.body;
  try {
    const adminId = req.user.id;
    const adminLevel = req.user.role === 'superadmin' ? 'level2' : 'level1';

    const result = await query(
      `UPDATE merchant_applications SET status=$1, admin_id=$2, admin_level=$3, updated_at=NOW()
       WHERE application_id=$4 RETURNING *`,
      [status, adminId, adminLevel, id]
    );

    if (result.rowCount === 0) return res.status(404).json({ message: '申请不存在' });

    if (status === 'approved') {
      const application = result.rows[0];
      const exist = await query('SELECT 1 FROM merchants WHERE user_id=$1', [application.user_id]);
      if (exist.rows.length === 0) {
        await query(
          `INSERT INTO merchants (user_id, store_name, status, created_at, updated_at)
           VALUES ($1,$2,'approved',NOW(),NOW())`,
          [application.user_id, application.store_name]
        );
      } else {
        await query(
          `UPDATE merchants SET status='approved', store_name=$1, updated_at=NOW() WHERE user_id=$2`,
          [application.store_name, application.user_id]
        );
      }
    }

    res.json({ message: '状态修改成功', application: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '修改状态失败' });
  }
});

// -------------------- 商家后台统计（用 products 表；orders 以 merchant_user_id 统计） --------------------
router.get('/dashboard', authenticate, authorize(['merchant']), mustApprovedMerchant, async (req, res) => {
  try {
    const userId = req.user.id;

    // 商品统计（你的表名是 products）
    let totalProducts = 0;
    try {
      const productResult = await query(
        `SELECT COUNT(*) AS total_products FROM products WHERE user_id=$1`,
        [userId]
      );
      totalProducts = parseInt(productResult.rows[0].total_products || '0', 10);
    } catch (e) {
      console.error('统计商品失败（products 表）:', e);
    }

    // 订单统计（假定 orders 表里以 merchant_user_id 关联到商家用户）
    let totalOrders = 0, pending = 0, completed = 0;
    try {
      const orderResult = await query(
        `SELECT 
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE status='pending') AS pending,
           COUNT(*) FILTER (WHERE status='completed') AS completed
         FROM orders
         WHERE merchant_user_id=$1`,
        [userId]
      );
      totalOrders = parseInt(orderResult.rows[0].total || '0', 10);
      pending = parseInt(orderResult.rows[0].pending || '0', 10);
      completed = parseInt(orderResult.rows[0].completed || '0', 10);
    } catch (e) {
      console.error('统计订单失败（orders 表）:', e);
    }

    res.json({ totalOrders, pending, completed, totalProducts });
  } catch (err) {
    console.error('获取商家后台统计失败:', err);
    res.status(500).json({ error: '获取商家后台统计失败' });
  }
});

export default router;
