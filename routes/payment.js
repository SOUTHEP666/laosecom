import express from "express";
import { createCheckoutSession, stripeWebhook } from "../controllers/paymentController.js";
import { authMiddleware } from "../middlewares/auth.js";
import bodyParser from "body-parser";

const router = express.Router();

// Stripe webhook 需要原始请求体，单独处理
router.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  stripeWebhook
);

router.post("/checkout", authMiddleware, createCheckoutSession);

export default router;
