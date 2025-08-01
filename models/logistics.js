import { query } from '../config/db.js';

export const getAllLogisticsCompanies = async () => {
  const result = await query(`SELECT * FROM logistics_companies`);
  return result.rows;
};

export const addLogisticsCompany = async ({ name, code, contact_phone }) => {
  const result = await query(
    `INSERT INTO logistics_companies (name, code, contact_phone)
     VALUES ($1, $2, $3) RETURNING *`,
    [name, code, contact_phone]
  );
  return result.rows[0];
};
