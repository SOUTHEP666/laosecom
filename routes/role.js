import express from "express";
import {
  assignRole,
  assignPermission,
  listRoles,
  listPermissions,
} from "../controllers/roleController.js";
import { authMiddleware } from "../middlewares/auth.js";
import { rbac } from "../middlewares/rbac.js";

const router = express.Router();

router.post("/assign-role", authMiddleware, rbac("角色管理"), assignRole);
router.post("/assign-permission", authMiddleware, rbac("权限管理"), assignPermission);
router.get("/roles", authMiddleware, listRoles);
router.get("/permissions", authMiddleware, listPermissions);

export default router;
