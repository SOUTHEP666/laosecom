// controllers/authController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByEmail, createUser } from '../models/userModel.js';

export const register = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: '邮箱和密码不能为空' });
  }

  try {
    const userExists = await findUserByEmail(email);
    if (userExists) return res.status(400).json({ message: '用户已存在' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await createUser(email, hashed);

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ message: '注册成功', user: { id: user.id, email: user.email }, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '注册失败', error: err.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: '邮箱和密码不能为空' });
  }

  try {
    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ message: '用户不存在' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: '密码错误' });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '登录失败', error: err.message });
  }
};
