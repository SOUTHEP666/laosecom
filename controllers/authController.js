import bcrypt from "bcrypt";
import { query } from "../config/db.js";
import { generateToken } from "../utils/jwt.js";

// 注册接口
export const register = async (req, res) => {
  const { username, email, phone, password, role } = req.body;

  if (!username || !email || !phone || !password || !role) {
    return res.status(400).json({ message: "请填写完整的注册信息" });
  }

  try {
    // 用户名查重
    const userCheck = await query("SELECT * FROM users WHERE username = $1", [username]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ message: "用户名已存在" });
    }

    // 邮箱查重
    const emailCheck = await query("SELECT * FROM users WHERE email = $1", [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ message: "邮箱已被使用" });
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 插入数据
    const result = await query(
      `INSERT INTO users (username, email, phone, password, role) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, phone, role`,
      [username, email, phone, hashedPassword, role]
    );

    res.status(201).json({ message: "注册成功", user: result.rows[0] });
  } catch (err) {
    console.error("注册失败", err);
    res.status(500).json({ message: "服务器错误" });
  }
};

// 登录接口 (支持用户名或邮箱登录)
export const login = async (req, res) => {
  const { account, password } = req.body;

  if (!account || !password) {
    return res.status(400).json({ message: "账号和密码不能为空" });
  }

  try {
    const isEmail = account.includes("@");
    const queryText = isEmail
      ? "SELECT * FROM users WHERE email = $1"
      : "SELECT * FROM users WHERE username = $1";

    const result = await query(queryText, [account]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "用户不存在" });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "密码错误" });
    }

    const token = generateToken({ id: user.id, username: user.username, role: user.role });

    res.json({
      message: "登录成功",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("登录失败", err);
    res.status(500).json({ message: "服务器错误" });
  }
};
