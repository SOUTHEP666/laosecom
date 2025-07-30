import {
  createMerchant,
  updateMerchant,
  getMerchant,
  getAllMerchants,
  approveMerchantById,
  setMerchantGradeCommission,
} from '../models/merchantModel.js';

export const registerMerchant = async (req, res) => {
  const merchantData = req.body;
  try {
    const newMerchant = await createMerchant(merchantData);
    res.json({ message: '商家入驻申请已提交', merchant: newMerchant });
  } catch (err) {
    res.status(500).json({ error: '注册失败', detail: err.message });
  }
};

export const updateMerchantProfile = async (req, res) => {
  try {
    const updated = await updateMerchant(req.params.id, req.body);
    res.json({ message: '资料已更新', merchant: updated });
  } catch (err) {
    res.status(500).json({ error: '更新失败', detail: err.message });
  }
};

export const getMerchantById = async (req, res) => {
  try {
    const merchant = await getMerchant(req.params.id);
    res.json(merchant);
  } catch (err) {
    res.status(500).json({ error: '获取失败' });
  }
};

export const listMerchants = async (req, res) => {
  try {
    const merchants = await getAllMerchants();
    res.json(merchants);
  } catch (err) {
    res.status(500).json({ error: '查询失败' });
  }
};

export const approveMerchant = async (req, res) => {
  try {
    await approveMerchantById(req.params.id);
    res.json({ message: '已审核通过' });
  } catch (err) {
    res.status(500).json({ error: '审核失败' });
  }
};

export const updateMerchantGradeCommission = async (req, res) => {
  try {
    const { grade, commission } = req.body;
    await setMerchantGradeCommission(req.params.id, grade, commission);
    res.json({ message: '等级和佣金已更新' });
  } catch (err) {
    res.status(500).json({ error: '设置失败' });
  }
};
