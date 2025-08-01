import { createPayment, getPaymentByOrderId } from '../models/Payment.js';

export const handlePayment = async (req, res) => {
  const { user_id, order_id, amount, payment_method } = req.body;

  // 模拟创建支付请求（真实场景应调用微信/支付宝 SDK）
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
    res.status(500).json({ error: err.message });
  }
};

export const getPaymentStatus = async (req, res) => {
  const { orderId } = req.params;

  try {
    const records = await getPaymentByOrderId(orderId);
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
