import express from "express";
import { uploadImage } from "../controllers/uploadController.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = express.Router();

router.post("/upload", authMiddleware, uploadImage);

export default router;
