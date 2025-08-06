import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

// 鉴权中间件，校验 token 并挂载用户信息
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "未授权访问" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // 挂载用户信息到请求
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token 无效或已过期" });
  }
}

// 角色权限校验中间件
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
