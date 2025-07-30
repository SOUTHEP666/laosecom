import db from "../config/db.js";

export function rbac(requiredPermission) {
  return async (req, res, next) => {
    const userId = req.user.id;
    try {
      // 查询用户所有角色拥有的权限
      const sql = `
        SELECT p.name FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        JOIN roles r ON rp.role_id = r.id
        JOIN user_roles ur ON r.id = ur.role_id
        WHERE ur.user_id = $1
      `;
      const result = await db.query(sql, [userId]);
      const userPermissions = result.rows.map((row) => row.name);
      if (!userPermissions.includes(requiredPermission)) {
        return res.status(403).json({ message: "权限不足" });
      }
      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "服务器内部错误" });
    }
  };
}
