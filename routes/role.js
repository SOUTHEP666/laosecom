import express from "express";
import {
  assignRole,
  assignPermission,
  listRoles,
  listPermissions,
} from "../controllers/roleController.js";
import { authMiddleware, adminMiddleware } from "../middlewares/auth.js";

const router = express.Router();

// 查询所有角色
router.get("/", authMiddleware, adminMiddleware, listRoles);

// 查询所有权限
router.get("/permissions", authMiddleware, adminMiddleware, listPermissions);

// 给用户分配角色
router.post("/assign-role", authMiddleware, adminMiddleware, assignRole);

// 给角色分配权限
router.post("/assign-permission", authMiddleware, adminMiddleware, assignPermission);

export default router;
