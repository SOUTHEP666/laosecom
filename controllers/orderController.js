// import pool from '../config/db.js';
// import { v4 as uuidv4 } from 'uuid';

// export const createOrder = async (req, res) => {
//   const { user_id, items } = req.body; // items: [{ product_id, sku_id, price, quantity }]
//   const client = await pool.connect();

//   try {
//     await client.query('BEGIN');

//     const orderNo = uuidv4();
//     let totalPrice = 0;

//     for (const item of items) {
//       totalPrice += item.price * item.quantity;
//     }

//     const orderResult = await client.query(
//       'INSERT INTO orders (order_no, user_id, total_price) VALUES ($1, $2, $3) RETURNING id',
//       [orderNo, user_id, totalPrice]
//     );

//     const orderId = orderResult.rows[0].id;

//     for (const item of items) {
//       await client.query(
//         'INSERT INTO order_items (order_id, product_id, sku_id, price, quantity) VALUES ($1, $2, $3, $4, $5)',
//         [orderId, item.product_id, item.sku_id, item.price, item.quantity]
//       );
//     }

//     await client.query('COMMIT');
//     res.json({ message: 'Order created', orderNo });
//   } catch (err) {
//     await client.query('ROLLBACK');
//     res.status(500).json({ error: 'Order creation failed' });
//   } finally {
//     client.release();
//   }
// };

// export const getUserOrders = async (req, res) => {
//   const { userId } = req.params;
//   const result = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
//   res.json(result.rows);
// };

// export const updateOrderStatus = async (req, res) => {
//   const { orderId } = req.params;
//   const { status } = req.body;

//   await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, orderId]);
//   res.json({ message: 'Status updated' });
// };
import pool from '../config/db.js';

// 创建订单（简单示例，事务管理用Promise链或mysql事务）
export const createOrder = async (req, res) => {
  const { userId, items } = req.body; // items: [{productId, quantity, price}]
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 计算总金额
    let totalAmount = 0;
    items.forEach(item => totalAmount += item.price * item.quantity);

    // 插入订单
    const [orderResult] = await conn.query(
      'INSERT INTO orders (user_id, total_amount, status, created_at) VALUES (?, ?, "pending", NOW())',
      [userId, totalAmount]
    );
    const orderId = orderResult.insertId;

    // 插入订单明细
    for (const item of items) {
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.productId, item.quantity, item.price]
      );
    }

    await conn.commit();
    res.json({ message: '订单创建成功', orderId });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};

// 查询用户订单
export const getUserOrders = async (req, res) => {
  const userId = req.params.userId;
  try {
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 更新订单状态
export const updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  try {
    await pool.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, orderId]
    );
    res.json({ message: '订单状态更新成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
