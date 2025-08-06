// routes/category.js
import express from "express";
import {
  addCategory,
  editCategory,
  removeCategory,
  listAllCategories,
  listPaginatedCategories,
} from "../controllers/categoryController.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = express.Router();

router.post("/", authMiddleware, addCategory);
router.put("/:id", authMiddleware, editCategory);
router.delete("/:id", authMiddleware, removeCategory);

router.get("/all", listAllCategories); // 前台展示
router.get("/", authMiddleware, listPaginatedCategories); // 后台分页

export default router;
