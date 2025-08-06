import express from "express";
import { createReview, getReviewsByProduct } from "../controllers/reviewController.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = express.Router();

router.post("/", authMiddleware, createReview);
router.get("/:productId", getReviewsByProduct);

export default router;
