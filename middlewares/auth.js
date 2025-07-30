import jwt from "jsonwebtoken";
import { verifyToken } from "../utils/jwt.js"; // 如果你自己实现了 verifyToken，可以用它，否则用 jwt.verify

// 认证中间件，验证 token 并把解码用户信息放到 req.user
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "未授权访问" });
  }

  const token = authHeader.split(" ")[1];
  try {
    // 这里用你自己的 verifyToken 函数，或者 jwt.verify 替代
    // const decoded = verifyToken(token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({ message: "Token 无效或过期" });
    }
    req.user = decoded; // 例如 { id, email, roles: [...] }
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token 无效或过期" });
  }
}

// 管理员权限中间件，必须先通过 authMiddleware
export function adminMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "未授权访问" });
  }

  // 假设角色字段是 roles 数组，判断是否包含 admin
  const roles = req.user.roles || [];
  if (roles.includes("admin")) {
    return next();
  } else {
    return res.status(403).json({ message: "管理员权限不足" });
  }
}
