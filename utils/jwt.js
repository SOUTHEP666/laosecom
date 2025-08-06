// utils/jwt.js
import jwt from "jsonwebtoken";
const SECRET = process.env.JWT_SECRET || "default_secret";

export const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    SECRET,
    { expiresIn: "7d" }
  );
};

export const verifyToken = (token) => {
  return jwt.verify(token, SECRET);
};
