import db from "../config/db.js";

export async function addUserPoints(userId, points, reason = null) {
  const sql = `
    INSERT INTO user_points (user_id, points, reason)
    VALUES ($1, $2, $3)
  `;
  await db.query(sql, [userId, points, reason]);
}

export async function getUserPoints(userId) {
  const sql = `
    SELECT SUM(points) as total_points FROM user_points
    WHERE user_id = $1
  `;
  const result = await db.query(sql, [userId]);
  return result.rows[0]?.total_points || 0;
}

export async function getPointHistory(userId) {
  const sql = `
    SELECT id, points, reason, created_at
    FROM user_points
    WHERE user_id = $1
    ORDER BY created_at DESC
  `;
  const result = await db.query(sql, [userId]);
  return result.rows;
}

export async function getMembershipLevel(userId) {
  const sql = `
    SELECT l.level_name, l.description FROM membership_levels l
    JOIN (
      SELECT SUM(points) as total_points FROM user_points WHERE user_id = $1
    ) up ON up.total_points >= l.min_points
    ORDER BY l.min_points DESC
    LIMIT 1
  `;
  const result = await db.query(sql, [userId]);
  return result.rows[0] || { level_name: "普通会员", description: "" };
}
