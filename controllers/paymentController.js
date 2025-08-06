import stripe from "../utils/stripe.js";
import { query } from "../config/db.js";

// 创建 Stripe Checkout Session
export const createCheckoutSession = async (req, res) => {
  const { orderId } = req.body;
  const userId = req.user.id;

  try {
    // 查询订单信息
    const orderRes = await query("SELECT * FROM orders WHERE id = $1 AND buyer_id = $2", [
      orderId,
      userId,
    ]);
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ message: "订单不存在或无权限" });
    }
    const order = orderRes.rows[0];

    // 查询订单商品详情
    const itemsRes = await query(
      "SELECT oi.*, p.title FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1",
      [orderId]
    );

    const line_items = itemsRes.rows.map((item) => ({
      price_data: {
        currency: "usd", // 你可根据需要更改货币
        product_data: {
          name: item.title,
        },
        unit_amount: Math.round(item.price * 100), // 分为单位
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
      metadata: { order_id: orderId },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("创建支付会话失败:", err);
    res.status(500).json({ message: "服务器错误" });
  }
};

// Stripe webhook 接收支付回调
export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook 验证失败:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata.order_id;

    try {
      // 更新订单状态为已支付（或已完成，视业务而定）
      await query("UPDATE orders SET status = $1 WHERE id = $2", ["completed", orderId]);
      console.log(`订单 ${orderId} 支付成功`);
    } catch (err) {
      console.error("更新订单支付状态失败:", err);
    }
  }

  res.json({ received: true });
};
