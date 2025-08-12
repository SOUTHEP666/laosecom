import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'yoursecretkey';

// 验证 token 是否有效，解析后挂载用户信息到 req.user 和 req.userId
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: '未提供授权token' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: '未提供token' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: '无效或过期的token' });
  }
};

// 根据角色数组判断用户是否有权限访问
// roles为空时表示不限制角色，默认放行
export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (roles.length === 0) {
      // 不限制角色，放行
      return next();
    }
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: '权限不足，拒绝访问' });
    }
    next();
  };
};
