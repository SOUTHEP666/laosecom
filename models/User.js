// models/User.js
import db from '../config/db.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function createUser(email, password) {
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const sql = `
    INSERT INTO users (email, password)
    VALUES ($1, $2)
    RETURNING id, email;
  `;
  const result = await db.query(sql, [email, hashedPassword]);
  return result.rows[0];
}

export async function getUserByEmail(email) {
  const sql = `SELECT * FROM users WHERE email = $1;`;
  const result = await db.query(sql, [email]);
  return result.rows[0];
}

export async function verifyPassword(email, plainPassword) {
  const user = await getUserByEmail(email);
  if (!user) return null;

  const match = await bcrypt.compare(plainPassword, user.password);
  if (!match) return null;

  return { id: user.id, email: user.email };
}

export async function getUserById(id) {
  const sql = `SELECT id, email FROM users WHERE id = $1;`;
  const result = await db.query(sql, [id]);
  return result.rows[0];
}

export async function getUserProfile(userId) {
  const sql = `SELECT id, email FROM users WHERE id = $1;`;
  const result = await db.query(sql, [userId]);
  return result.rows[0];
}

export async function updateUserProfile(userId, data) {
  // 当前只有 email 可更新（示例）
  const { email } = data;
  const sql = `UPDATE users SET email = $1 WHERE id = $2`;
  await db.query(sql, [email, userId]);
}

export async function updateUserPassword(userId, newPassword) {
  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
  const sql = `UPDATE users SET password = $1 WHERE id = $2`;
  await db.query(sql, [hashed, userId]);
}

// 如无角色系统，可返回空数组或写死默认值
export async function getUserRoles(userId) {
  return []; // or ['user']
}
