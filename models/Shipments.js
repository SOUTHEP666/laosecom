import { query } from '../config/db.js';

export const createShipment = async ({ order_id, company_id, tracking_number }) => {
  const result = await query(
    `INSERT INTO shipments (order_id, company_id, tracking_number)
     VALUES ($1, $2, $3) RETURNING *`,
    [order_id, company_id, tracking_number]
  );
  return result.rows[0];
};

export const updateShipmentStatus = async (tracking_number, status) => {
  const result = await query(
    `UPDATE shipments SET status = $1 WHERE tracking_number = $2 RETURNING *`,
    [status, tracking_number]
  );
  return result.rows[0];
};

export const getShipmentByOrderId = async (order_id) => {
  const result = await query(
    `SELECT s.*, l.name as company_name, l.code as company_code
     FROM shipments s
     JOIN logistics_companies l ON s.company_id = l.id
     WHERE s.order_id = $1`,
    [order_id]
  );
  return result.rows[0];
};
