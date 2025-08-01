import { createPayment, getPaymentByOrderId } from '../models/Payment.js';

export const handlePayment = async (req, res) => {
  const { user_id, order_id, amount, payment_method } = req.body;

  if (!user_id || !order_id || !amount || !payment_method) {
    return res.status(400).json({ error: '缺少必要字段' });
  }

  const mockTransactionId = `TXN_${Date.now()}`;

  try {
    const payment = await createPayment({
      user_id,
      order_id,
      amount,
      payment_method,
      status: 'pending',
      transaction_id: mockTransactionId,
    });

    res.json({
      message: '支付请求已创建',
      payment,
    });
  } catch (err) {
    console.error('创建支付失败:', err);
    res.status(500).json({ error: '支付创建失败' });
  }
};

export const getPaymentStatus = async (req, res) => {
  const { orderId } = req.params;

  if (!orderId) {
    return res.status(400).json({ error: '缺少订单 ID' });
  }

  try {
    const records = await getPaymentByOrderId(orderId);
    res.json(records);
  } catch (err) {
    console.error('获取支付状态失败:', err);
    res.status(500).json({ error: '查询失败' });
  }
};
