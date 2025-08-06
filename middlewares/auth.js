import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key_here";

// 通用认证中间件：认证所有登录用户
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "未授权访问" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({ message: "Token 无效或过期" });
    }
    req.user = decoded; // 结构示例: { id: 123, role: 'admin' }
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token 无效或过期" });
  }
}

// 角色权限控制中间件：传入允许的角色列表（支持多个）
export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "未授权访问" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "权限不足" });
    }
    next();
  };
}

// 仅管理员访问：用于需要管理员权限的路由
export function adminMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "未授权访问" });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "仅管理员可访问" });
  }
  next();
}
