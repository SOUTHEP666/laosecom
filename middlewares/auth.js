import jwt from "jsonwebtoken";
import { verifyToken } from "../utils/jwt.js";

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "未授权访问" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({ message: "Token 无效或过期" });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token 无效或过期" });
  }
}

export function adminMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "未授权访问" });
  }
  const roles = req.user.roles || [];
  if (roles.includes("admin")) {
    next();
  } else {
    return res.status(403).json({ message: "管理员权限不足" });
  }
}
