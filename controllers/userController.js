import {
  createUser,
  getUserByEmail,
  verifyPassword,
  getUserById,
  updateUserPassword,
  updateUserProfile,
  getUserProfile,
  getUserRoles,
} from "../models/User.js";
import { generateToken } from "../utils/jwt.js";

export async function register(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "邮箱和密码为必填项" });
    }
    const exists = await getUserByEmail(email);
    if (exists) {
      return res.status(409).json({ message: "邮箱已注册" });
    }
    const user = await createUser(email, password);
    res.status(201).json({ message: "注册成功", user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "服务器错误" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "邮箱和密码为必填项" });
    }
    const user = await verifyPassword(email, password);
    if (!user) {
      return res.status(401).json({ message: "邮箱或密码错误" });
    }
    const roles = await getUserRoles(user.id);
    const token = generateToken({ id: user.id, email: user.email, roles });
    res.json({ message: "登录成功", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "服务器错误" });
  }
}

export async function getProfile(req, res) {
  try {
    const userId = req.user.id;
    const profile = await getUserProfile(userId);
    res.json({ profile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "服务器错误" });
  }
}

export async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const profileData = req.body;
    await updateUserProfile(userId, profileData);
    res.json({ message: "更新成功" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "服务器错误" });
  }
}

export async function changePassword(req, res) {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "旧密码和新密码为必填项" });
    }
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "用户不存在" });
    }
    // 验证旧密码
    const verified = await verifyPassword(user.email, oldPassword);
    if (!verified) {
      return res.status(400).json({ message: "旧密码错误" });
    }
    await updateUserPassword(userId, newPassword);
    res.json({ message: "密码修改成功" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "服务器错误" });
  }
}
