import pool from "../config/db.js";

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

  try {
    const exists = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (exists.rows.length > 0) {
      return res.status(400).json({ message: "用户名已存在" });
    }

    const result = await pool.query(
      `INSERT INTO merchants
        (company_name, contact_name, contact_phone, username, password, email,
        business_license, tax_registration, id_card, extra_certification, status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, 'pending') RETURNING id`,
      [
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
      ]
    );
    res.json({ message: "申请提交成功", id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ message: "申请失败", error: err.message });
  }
};