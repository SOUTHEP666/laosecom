// middlewares/role.js
export const requireRole = (minRole) => {
  return (req, res, next) => {
    if (req.user?.role > minRole) {
      return res.status(403).json({ message: "权限不足" });
    }
    next();
  };
};
