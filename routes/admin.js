// backend/routes/admin.js
import express from "express";
import { authMiddleware, authorizeRoles } from "../middleware/auth.js";
import {
  getAllUsers,
  deleteUser,
  updateUserRole,
} from "../controllers/adminController.js";

const router = express.Router();

// 仅一级管理员可访问
router.use(authMiddleware, authorizeRoles(3));

router.get("/users", getAllUsers);
router.delete("/user/:id", deleteUser);
router.put("/user/:id", updateUserRole);

export default router;
