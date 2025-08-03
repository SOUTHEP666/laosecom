import { query } from '../config/db.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function createUser(username, phone, email, password) {
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const sql = `
    INSERT INTO users (username, phone, email, password)
    VALUES ($1, $2, $3, $4)
    RETURNING id, username, phone, email;
  `;
  const result = await query(sql, [username, phone, email, hashedPassword]);
  return result.rows[0];
}

export async function getUserByEmail(email) {
  const sql = `SELECT * FROM users WHERE email = $1;`;
  const result = await query(sql, [email]);
  return result.rows[0];
}

export async function verifyPassword(identifier, plainPassword) {
  const sql = `SELECT * FROM users WHERE email = $1 OR username = $1;`;
  const result = await query(sql, [identifier]);
  const user = result.rows[0];
  if (!user) return null;

  const match = await bcrypt.compare(plainPassword, user.password);
  if (!match) return null;

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone,
  };
}

export async function getUserById(id) {
  const sql = `SELECT id, username, email, phone FROM users WHERE id = $1;`;
  const result = await query(sql, [id]);
  return result.rows[0];
}

export async function getUserProfile(userId) {
  const sql = `SELECT id, username, phone, email FROM users WHERE id = $1;`;
  const result = await query(sql, [userId]);
  return result.rows[0];
}

export async function updateUserProfile(userId, { username, phone, email }) {
  const sql = `
    UPDATE users SET username = $1, phone = $2, email = $3
    WHERE id = $4
  `;
  await query(sql, [username, phone, email, userId]);
}

export async function updateUserPassword(userId, newPassword) {
  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
  const sql = `UPDATE users SET password = $1 WHERE id = $2`;
  await query(sql, [hashed, userId]);
}

export async function getUserRoles(userId) {
  return ['user']; // 根据需要这里可扩展查询数据库
}
