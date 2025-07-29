// routes/auth.js
import express from 'express';
import { login, register } from '../controllers/authController.js';

const router = express.Router();

// 注册
router.post('/register', register);

// 登录
router.post('/login', login);

export default router;
