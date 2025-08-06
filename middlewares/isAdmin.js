export function isAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "仅限管理员访问" });
  }
  next();
}
