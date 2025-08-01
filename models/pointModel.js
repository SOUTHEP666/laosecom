import { query } from '../config/db.js';

// 查询用户积分总数
export async function getUserPoints(userId) {
  const result = await query(
    "SELECT COALESCE(SUM(points),0) as total FROM point_logs WHERE user_id=$1",
    [userId]
  );
  return result.rows[0].total;
}

// 查询用户积分历史记录
export async function getPointHistory(userId) {
  const result = await query(
    "SELECT * FROM point_logs WHERE user_id=$1 ORDER BY created_at DESC",
    [userId]
  );
  return result.rows;
}

// 查询用户会员等级，假设会员等级在 users 表或另表
export async function getMembershipLevel(userId) {
  const result = await query(
    "SELECT membership_level FROM users WHERE id=$1",
    [userId]
  );
  return result.rows[0]?.membership_level || "普通会员";
}

// 手动添加积分
export async function addUserPoints(userId, points, reason) {
  await query(
    `INSERT INTO point_logs (user_id, points, reason, type, created_at)
     VALUES ($1, $2, $3, 'manual', NOW())`,
    [userId, points, reason]
  );
}
