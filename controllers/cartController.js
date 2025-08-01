import pool from '../config/db.js';

export const addToCart = async (req, res) => {
  try {
    const { user_id, product_id, sku_id, quantity } = req.body;
    await pool.query(
      'INSERT INTO cart (user_id, product_id, sku_id, quantity) VALUES ($1, $2, $3, $4)',
      [user_id, product_id, sku_id, quantity]
    );
    res.json({ message: 'Added to cart' });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
};

export const getCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query('SELECT * FROM cart WHERE user_id = $1', [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting cart:', error);
    res.status(500).json({ error: 'Failed to get cart' });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const { userId, productId } = req.params;
    await pool.query('DELETE FROM cart WHERE user_id = $1 AND product_id = $2', [userId, productId]);
    res.json({ message: 'Removed from cart' });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ error: 'Failed to remove from cart' });
  }
};
