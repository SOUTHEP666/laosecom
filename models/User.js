// models/userModel.js
import db from '../config/db.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function createUser(email, password) {
  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const sql = `INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, created_at`;
  const result = await db.query(sql, [email, hashed]);
  return result.rows[0];
}

export async function getUserByEmail(email) {
  const sql = `SELECT * FROM users WHERE email = $1`;
  const result = await db.query(sql, [email]);
  return result.rows[0];
}

export async function getUserById(id) {
  const sql = `SELECT id, email, created_at FROM users WHERE id = $1`;
  const result = await db.query(sql, [id]);
  return result.rows[0];
}

export async function verifyPassword(email, password) {
  const user = await getUserByEmail(email);
  if (!user) return null;
  const match = await bcrypt.compare(password, user.password);
  return match ? user : null;
}

export async function updateUserPassword(id, newPassword) {
  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await db.query(
    `UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
    [hashed, id]
  );
}

export async function updateUserProfile(userId, profile) {
  const result = await db.query(`SELECT 1 FROM user_profiles WHERE user_id = $1`, [userId]);
  if (result.rows.length === 0) {
    const insertSql = `
      INSERT INTO user_profiles (user_id, nickname, avatar_url, phone, gender, birthday)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    await db.query(insertSql, [
      userId,
      profile.nickname || null,
      profile.avatar_url || null,
      profile.phone || null,
      profile.gender || null,
      profile.birthday || null,
    ]);
  } else {
    const updateSql = `
      UPDATE user_profiles SET nickname=$1, avatar_url=$2, phone=$3, gender=$4, birthday=$5, updated_at=NOW()
      WHERE user_id = $6
    `;
    await db.query(updateSql, [
      profile.nickname || null,
      profile.avatar_url || null,
      profile.phone || null,
      profile.gender || null,
      profile.birthday || null,
      userId,
    ]);
  }
}

export async function getUserProfile(userId) {
  const sql = `
    SELECT u.id, u.email, p.nickname, p.avatar_url, p.phone, p.gender, p.birthday
    FROM users u
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE u.id = $1
  `;
  const result = await db.query(sql, [userId]);
  return result.rows[0];
}

export async function getUserRoles(userId) {
  const sql = `
    SELECT r.name FROM roles r
    JOIN user_roles ur ON r.id = ur.role_id
    WHERE ur.user_id = $1
  `;
  const result = await db.query(sql, [userId]);
  return result.rows.map((r) => r.name);
}
