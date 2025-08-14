// routes/merchants.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import { query } from '../config/db.js';

const router = express.Router();

// 状态常量
const STATUS = {
  APPROVED: 'approved',
  PENDING: 'pending',
  REJECTED: 'rejected',
  NO_APPLY: 'no_apply'
};

// 管理员级别
const ADMIN_LEVEL = {
  LEVEL1: 'level1',
  LEVEL2: 'level2'
};

/**
 * 确保用户是已审核通过的商家（中间件）
 */
const mustApprovedMerchant = async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT status FROM merchants WHERE user_id=$1', 
      [req.user.id]
    );
    
    if (rows.length === 0) {
      return res.status(403).json({ message: '您还未成为商家，请先申请' });
    }
    if (rows[0].status !== STATUS.APPROVED) {
      return res.status(403).json({ message: '您的商家申请尚未通过审核' });
    }
    next();
  } catch (e) {
    console.error('校验商家审核状态失败:', e);
    res.status(500).json({ message: '服务器错误' });
  }
};

/**
 * 确保merchants表存在对应记录（工具函数）
 */
async function ensureMerchantExists(userId, storeName) {
  const exist = await query('SELECT 1 FROM merchants WHERE user_id=$1', [userId]);
  if (exist.rows.length === 0) {
    await query(
      `INSERT INTO merchants 
       (user_id, store_name, status, created_at, updated_at)
       VALUES ($1,$2,$3,NOW(),NOW())`,
      [userId, storeName, STATUS.APPROVED]
    );
  } else {
    await query(
      `UPDATE merchants SET 
       status=$1, store_name=$2, updated_at=NOW() 
       WHERE user_id=$3`,
      [STATUS.APPROVED, storeName, userId]
    );
  }
}

// -------------------- 商家申请 --------------------
const applyValidation = [
  body('store_name').trim().isLength({ min: 2, max: 50 }),
  body('contact_name').trim().isLength({ min: 2, max: 20 }),
  body('phone').isMobilePhone('zh-CN'),
  body('email').isEmail(),
  body('address').isLength({ min: 5, max: 100 }),
  body('business_license').isString()
];

router.post(
  '/apply', 
  authenticate, 
  authorize(['merchant']),
  applyValidation,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      store_name, 
      contact_name, 
      phone, 
      email, 
      address, 
      business_license, 
      notes 
    } = req.body;

    try {
      // 检查已有申请或商家
      const [pending, merchant] = await Promise.all([
        query(
          'SELECT 1 FROM merchant_applications WHERE user_id=$1 AND status=$2',
          [req.user.id, STATUS.PENDING]
        ),
        query(
          'SELECT 1 FROM merchants WHERE user_id=$1 AND status=$2',
          [req.user.id, STATUS.APPROVED]
        )
      ]);

      if (pending.rows.length > 0) {
        return res.status(409).json({ message: '已有未处理的申请' });
      }
      if (merchant.rows.length > 0) {
        return res.status(409).json({ message: '您已是正式商家，无法再次申请' });
      }

      // 创建申请
      const result = await query(
        `INSERT INTO merchant_applications
         (user_id, store_name, contact_name, phone, email, address, 
          business_license, notes, status, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
         RETURNING *`,
        [
          req.user.id, store_name, contact_name, phone, email, 
          address, business_license, notes || null, STATUS.PENDING
        ]
      );

      res.status(201).json({ application: result.rows[0] });
    } catch (err) {
      console.error('商家申请失败:', err);
      res.status(500).json({ error: '申请失败' });
    }
  }
);

// -------------------- 申请状态查询 --------------------
router.get('/status', authenticate, authorize(['merchant']), async (req, res) => {
  try {
    // 并行查询商家和申请状态
    const [merchantResult, appResult] = await Promise.all([
      query('SELECT * FROM merchants WHERE user_id=$1', [req.user.id]),
      query(
        `SELECT status FROM merchant_applications 
         WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1`,
        [req.user.id]
      )
    ]);

    // 优先检查商家状态
    if (merchantResult.rows.length > 0) {
      const status = merchantResult.rows[0].status || STATUS.APPROVED;
      if (status === STATUS.APPROVED) {
        return res.json({ 
          status: STATUS.APPROVED, 
          merchant: merchantResult.rows[0] 
        });
      }
      return res.json({ status });
    }

    // 检查申请状态
    if (appResult.rows.length === 0) {
      return res.json({ status: STATUS.NO_APPLY });
    }
    if (appResult.rows[0].status === STATUS.APPROVED) {
      return res.json({ status: STATUS.NO_APPLY }); // 数据不一致时降级处理
    }

    res.json({ status: appResult.rows[0].status });
  } catch (err) {
    console.error('获取审核状态失败:', err);
    res.status(500).json({ error: '获取审核状态失败' });
  }
});

// -------------------- 管理员操作 --------------------
router.patch(
  '/apply/:id/status',
  authenticate,
  authorize(['admin', 'superadmin']),
  body('status').isIn(['approved', 'rejected', 'pending']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const id = parseInt(req.params.id, 10);
    const { status } = req.body;
    const adminId = req.user.id;
    const adminLevel = req.user.role === 'superadmin' 
      ? ADMIN_LEVEL.LEVEL2 
      : ADMIN_LEVEL.LEVEL1;

    try {
      await query('BEGIN');

      // 更新申请状态
      const result = await query(
        `UPDATE merchant_applications SET 
         status=$1, admin_id=$2, admin_level=$3, updated_at=NOW()
         WHERE application_id=$4 RETURNING *`,
        [status, adminId, adminLevel, id]
      );

      if (result.rowCount === 0) {
        await query('ROLLBACK');
        return res.status(404).json({ message: '申请不存在' });
      }

      // 如果是批准状态，同步到merchants表
      if (status === STATUS.APPROVED) {
        const app = result.rows[0];
        await ensureMerchantExists(app.user_id, app.store_name);
      }

      await query('COMMIT');
      res.json({ 
        message: '状态修改成功', 
        application: result.rows[0] 
      });
    } catch (err) {
      await query('ROLLBACK');
      console.error('修改状态失败:', err);
      res.status(500).json({ error: '修改状态失败' });
    }
  }
);

// -------------------- 商家仪表盘 --------------------
router.get(
  '/dashboard',
  authenticate,
  authorize(['merchant']),
  mustApprovedMerchant,
  async (req, res) => {
    try {
      const userId = req.user.id;
      
      // 并行查询商品和订单统计
      const [products, orders] = await Promise.all([
        query(
          `SELECT COUNT(*) AS total FROM products WHERE user_id=$1`,
          [userId]
        ).catch(e => {
          console.error('统计商品失败:', e);
          return { rows: [{ total: 0 }] };
        }),
        query(
          `SELECT 
             COUNT(*) AS total,
             COUNT(*) FILTER (WHERE status='pending') AS pending,
             COUNT(*) FILTER (WHERE status='completed') AS completed
           FROM orders WHERE merchant_user_id=$1`,
          [userId]
        ).catch(e => {
          console.error('统计订单失败:', e);
          return { rows: [{ total: 0, pending: 0, completed: 0 }] };
        })
      ]);

      res.json({
        totalProducts: parseInt(products.rows[0].total, 10),
        totalOrders: parseInt(orders.rows[0].total, 10),
        pendingOrders: parseInt(orders.rows[0].pending, 10),
        completedOrders: parseInt(orders.rows[0].completed, 10)
      });
    } catch (err) {
      console.error('获取统计失败:', err);
      res.status(500).json({ error: '获取统计失败' });
    }
  }
);

export default router;