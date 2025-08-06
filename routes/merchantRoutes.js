import express from "express"; import { applyMerchant } from "../controllers/merchantController.js"; const router = express.Router(); 
 router.post("/apply", applyMerchant); export default router;