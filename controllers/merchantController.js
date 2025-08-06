import bcrypt from "bcrypt";
import pool from "../config/db.js";

// 商家入驻申请接口
export const applyMerchant = async (req, res) => {
  const {
    company_name,
    contact_name,
    contact_phone,
    username,
    password,
    email,
    business_license,
    tax_registration,
    id_card,
    extra_certification,
  } = req.body;

  // 字段完整性检查
  if (
    !company_name ||
    !contact_name ||
    !contact_phone ||
    !username ||
    !password ||
    !email ||
    !business_license ||
    !tax_registration ||
    !id_card
  ) {
    return res.status(400).json({ message: "请填写完整的申请信息" });
  }

  try {
    const emailNormalized = email.toLowerCase();

    // 检查用户名是否存在（用户表）
    const userCheck = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ message: "用户名已存在" });
    }

    // 检查用户名是否已申请过（商家表）
    const merchantCheck = await pool.query("SELECT * FROM merchants WHERE username = $1", [username]);
    if (merchantCheck.rows.length > 0) {
      return res.status(409).json({ message: "该商家用户名已提交申请" });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 插入申请信息
    const result = await pool.query(
      `INSERT INTO merchants
        (company_name, contact_name, contact_phone, username, password, email,
         business_license, tax_registration, id_card, extra_certification, status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending', NOW())
       RETURNING id`,
      [
        company_name,
        contact_name,
        contact_phone,
        username,
        hashedPassword,
        emailNormalized,
        business_license,
        tax_registration,
        id_card,
        extra_certification || "",
      ]
    );

    res.status(201).json({ message: "申请提交成功", id: result.rows[0].id });
  } catch (err) {
    console.error("商家申请失败", err);
    res.status(500).json({ message: "服务器错误", error: err.message });
  }
};
