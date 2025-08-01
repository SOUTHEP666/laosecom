import { query } from '../config/db.js';

// 创建发货记录
export const createShippingOrder = async (req, res) => {
  const { order_id, company_id } = req.body;
  const tracking_number = `TRK${Date.now()}`; // 模拟生成电子面单号

  try {
    const result = await query(
      `INSERT INTO shipments (order_id, company_id, tracking_number, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [order_id, company_id, tracking_number]
    );
    res.json({ message: '发货成功', shipment: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 添加轨迹记录
export const addTracking = async (req, res) => {
  const { shipment_id, status_note, location } = req.body;

  try {
    const result = await query(
      `INSERT INTO tracking (shipment_id, status_note, location)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [shipment_id, status_note, location]
    );
    res.json({ message: '轨迹添加成功', tracking: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 查询发货信息及轨迹
export const getShipmentInfo = async (req, res) => {
  const { order_id } = req.params;

  try {
    const shipmentResult = await query(
      `SELECT * FROM shipments WHERE order_id = $1`,
      [order_id]
    );

    if (shipmentResult.rows.length === 0) {
      return res.status(404).json({ message: '无发货信息' });
    }

    const shipment = shipmentResult.rows[0];

    const trackingResult = await query(
      `SELECT * FROM tracking WHERE shipment_id = $1 ORDER BY created_at ASC`,
      [shipment.id]
    );

    res.json({ shipment, tracking: trackingResult.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 签收确认
export const confirmDelivery = async (req, res) => {
  const { tracking_number } = req.body;

  try {
    const result = await query(
      `UPDATE shipments SET status = 'signed'
       WHERE tracking_number = $1
       RETURNING *`,
      [tracking_number]
    );

    res.json({ message: '已签收确认', updated: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
