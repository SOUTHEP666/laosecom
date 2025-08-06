export function isSeller(req, res, next) {
  if (req.user.role !== "seller") {
    return res.status(403).json({ message: "仅限商家访问" });
  }
  next();
}
