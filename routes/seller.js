// src/routes/seller.js
import express from "express";
import { registerSeller, getSellers } from "../controllers/sellerController.js";

const router = express.Router();

router.post("/register", registerSeller); // POST /api/seller/register
router.get("/", getSellers);              // GET  /api/seller

export default router;
