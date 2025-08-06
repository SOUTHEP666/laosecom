import jwt from "jsonwebtoken";
import { verifyToken } from "../utils/jwt.js";

export function adminOnly(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "未授权访问" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = verifyToken(token);
    if (decoded.role !== 0) {
      return res.status(403).json({ message: "无权限访问" });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token 无效", error: err.message });
  }
}
