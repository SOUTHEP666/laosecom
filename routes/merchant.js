// 获取所有商家申请（管理员）
router.get("/admin/all", authMiddleware, async (req, res) => {
  if (req.user.role !== 0) {
    return res.status(403).json({ message: "无权限" });
  }
  try {
    const result = await pool.query("SELECT * FROM merchants ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "获取商家失败", error: err.message });
  }
});

// 审核申请（通过/拒绝）
router.put("/admin/review/:id", authMiddleware, async (req, res) => {
  if (req.user.role !== 0) {
    return res.status(403).json({ message: "无权限" });
  }
  const { id } = req.params;
  const { status } = req.body; // 'approved' 或 'rejected'
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "无效审核状态" });
  }
  try {
    await pool.query("UPDATE merchants SET status=$1 WHERE id=$2", [status, id]);
    res.json({ message: `审核成功，状态更新为 ${status}` });
  } catch (err) {
    res.status(500).json({ message: "审核失败", error: err.message });
  }
});
