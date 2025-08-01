import { query } from '../config/db.js';

export const addTrackingRecord = async ({ shipment_id, status_note, location }) => {
  const result = await query(
    `INSERT INTO shipment_tracking (shipment_id, status_note, location)
     VALUES ($1, $2, $3) RETURNING *`,
    [shipment_id, status_note, location]
  );
  return result.rows[0];
};

export const getTrackingByShipment = async (shipment_id) => {
  const result = await query(
    `SELECT * FROM shipment_tracking
     WHERE shipment_id = $1 ORDER BY timestamp DESC`,
    [shipment_id]
  );
  return result.rows;
};
