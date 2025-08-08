import { query } from '../config/db.js';

export async function sendNotification(userId, type, content) {
  await query(
    'INSERT INTO notifications (user_id, type, content) VALUES ($1, $2, $3)',
    [userId, type, content]
  );
}
