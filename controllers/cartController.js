// import pool from '../config/db.js';

// export const addToCart = async (req, res) => {
//   try {
//     const { user_id, product_id, sku_id, quantity } = req.body;
//     await pool.query(
//       'INSERT INTO cart (user_id, product_id, sku_id, quantity) VALUES ($1, $2, $3, $4)',
//       [user_id, product_id, sku_id, quantity]
//     );
//     res.json({ message: 'Added to cart' });
//   } catch (error) {
//     console.error('Error adding to cart:', error);
//     res.status(500).json({ error: 'Failed to add to cart' });
//   }
// };

// export const getCart = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const result = await pool.query('SELECT * FROM cart WHERE user_id = $1', [userId]);
//     res.json(result.rows);
//   } catch (error) {
//     console.error('Error getting cart:', error);
//     res.status(500).json({ error: 'Failed to get cart' });
//   }
// };

// export const removeFromCart = async (req, res) => {
//   try {
//     const { userId, productId } = req.params;
//     await pool.query('DELETE FROM cart WHERE user_id = $1 AND product_id = $2', [userId, productId]);
//     res.json({ message: 'Removed from cart' });
//   } catch (error) {
//     console.error('Error removing from cart:', error);
//     res.status(500).json({ error: 'Failed to remove from cart' });
//   }
// };
import { query } from '../config/db.js';

// 添加商品到购物车
export const addToCart = async (req, res) => {
  const { userId, productId, quantity } = req.body;
  try {
    // 查询是否已存在购物车项
    const existingResult = await query(
      'SELECT * FROM cart WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );

    if (existingResult.rows.length > 0) {
      // 更新数量
      await query(
        'UPDATE cart SET quantity = quantity + $1 WHERE user_id = $2 AND product_id = $3',
        [quantity, userId, productId]
      );
    } else {
      // 新增记录
      await query(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3)',
        [userId, productId, quantity]
      );
    }

    res.json({ message: '添加购物车成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 获取用户购物车
export const getCartByUser = async (req, res) => {
  const userId = req.params.userId;
  try {
    const result = await query(
      `SELECT c.*, p.title, p.price FROM cart c 
       JOIN products p ON c.product_id = p.id 
       WHERE c.user_id = $1`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 删除购物车某商品
export const removeFromCart = async (req, res) => {
  const { userId, productId } = req.params;
  try {
    await query(
      'DELETE FROM cart WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

