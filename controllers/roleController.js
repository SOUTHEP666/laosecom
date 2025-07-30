import db from "../config/db.js";

// 分配角色
export async function assignRole(req, res) {
  const { userId, roleId } = req.body;
  try {
    await db.query(
      "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [userId, roleId]
    );
    res.json({ message: "角色分配成功" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "服务器错误" });
  }
}

// 分配权限
export async function assignPermission(req, res) {
  const { roleId, permissionId } = req.body;
  try {
    await db.query(
      "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [roleId, permissionId]
    );
    res.json({ message: "权限分配成功" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "服务器错误" });
  }
}

// 获取角色列表
export async function listRoles(req, res) {
  try {
    const result = await db.query("SELECT * FROM roles ORDER BY id");
    res.json({ roles: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "服务器错误" });
  }
}

// 获取权限列表
export async function listPermissions(req, res) {
  try {
    const result = await db.query("SELECT * FROM permissions ORDER BY id");
    res.json({ permissions: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "服务器错误" });
  }
}
