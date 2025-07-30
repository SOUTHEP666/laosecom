import {
  addUserPoints,
  getUserPoints,
  getPointHistory,
  getMembershipLevel,
} from "../models/pointModel.js";

export async function getPoints(req, res) {
  try {
    const userId = req.user.id;
    const total = await getUserPoints(userId);
    const level = await getMembershipLevel(userId);
    res.json({ total_points: total, membership_level: level });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "服务器错误" });
  }
}

export async function getHistory(req, res) {
  try {
    const userId = req.user.id;
    const history = await getPointHistory(userId);
    res.json({ history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "服务器错误" });
  }
}

export async function addPointsManually(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    const { points, reason } = req.body;
    if (!points || isNaN(points)) {
      return res.status(400).json({ message: "积分必须为数字" });
    }
    await addUserPoints(userId, points, reason);
    res.json({ message: "积分添加成功" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "服务器错误" });
  }
}
