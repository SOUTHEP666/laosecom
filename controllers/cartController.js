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
import pool from '../config/db.js';

// 添加商品到购物车
export const addToCart = async (req, res) => {
  const { userId, productId, quantity } = req.body;
  try {
    // 先查有没有这商品的购物车项
    const [existing] = await pool.query(
      'SELECT * FROM cart WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );

    if (existing.length > 0) {
      // 已有则更新数量
      await pool.query(
        'UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?',
        [quantity, userId, productId]
      );
    } else {
      // 新增一条
      await pool.query(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
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
    const [rows] = await pool.query(
      `SELECT c.*, p.title, p.price FROM cart c 
       JOIN products p ON c.product_id = p.id 
       WHERE c.user_id = ?`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 删除购物车某商品
export const removeFromCart = async (req, res) => {
  const { userId, productId } = req.params;
  try {
    await pool.query(
      'DELETE FROM cart WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
