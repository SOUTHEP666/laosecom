// models/userModel.js
import { query } from "../config/db.js";

export const findUserByUsername = async (username) => {
  const res = await query("SELECT * FROM users WHERE username = $1", [username]);
  return res.rows[0];
};

export const createUser = async ({ username, password, role }) => {
  const res = await query(
    "INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING *",
    [username, password, role]
  );
  return res.rows[0];
};
