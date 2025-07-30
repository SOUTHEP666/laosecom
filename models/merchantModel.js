import db from '../config/db.js';

const createMerchant = async (merchant) => {
  const {
    user_id,
    store_name,
    qualification_docs,
    contact,
    description,
  } = merchant;
  const result = await db.query(
    `INSERT INTO merchants (user_id, store_name, qualification_docs, contact, description, status)
     VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
    [user_id, store_name, qualification_docs, contact, description]
  );
  return result.rows[0];
};

const updateMerchant = async (id, updates) => {
  const {
    store_name,
    contact,
    description,
    qualification_docs,
  } = updates;
  const result = await db.query(
    `UPDATE merchants SET store_name=$1, contact=$2, description=$3, qualification_docs=$4
     WHERE id=$5 RETURNING *`,
    [store_name, contact, description, qualification_docs, id]
  );
  return result.rows[0];
};

const getMerchant = async (id) => {
  const result = await db.query(`SELECT * FROM merchants WHERE id=$1`, [id]);
  return result.rows[0];
};

const getAllMerchants = async () => {
  const result = await db.query(`SELECT * FROM merchants ORDER BY created_at DESC`);
  return result.rows;
};

const approveMerchantById = async (id) => {
  await db.query(`UPDATE merchants SET status='approved' WHERE id=$1`, [id]);
};

const setMerchantGradeCommission = async (id, grade, commission) => {
  await db.query(
    `UPDATE merchants SET grade=$1, commission_rate=$2 WHERE id=$3`,
    [grade, commission, id]
  );
};

// ✅ 统一默认导出
export default {
  createMerchant,
  updateMerchant,
  getMerchant,
  getAllMerchants,
  approveMerchantById,
  setMerchantGradeCommission,
};
