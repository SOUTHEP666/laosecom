// models/userModel.js
import User from './User.js';
import UserProfile from './UserProfile.js'; // 你需要创建对应的 UserProfile Sequelize 模型
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

// 创建用户
export async function createUser(email, password) {
  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ email, password: hashed });
  return user;
}

// 通过邮箱查找用户（包括密码字段）
export async function getUserByEmail(email) {
  return await User.findOne({ where: { email } });
}

// 通过ID查找用户（不包含密码）
export async function getUserById(id) {
  return await User.findByPk(id, {
    attributes: ['id', 'email', 'createdAt', 'updatedAt'],
  });
}

// 验证密码
export async function verifyPassword(email, password) {
  const user = await getUserByEmail(email);
  if (!user) return null;
  const match = await bcrypt.compare(password, user.password);
  if (!match) return null;
  return user;
}

// 更新密码
export async function updateUserPassword(id, newPassword) {
  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await User.update(
    { password: hashed },
    { where: { id } }
  );
}

// 更新或创建用户资料
export async function updateUserProfile(userId, profile) {
  // profile = { nickname, avatar_url, phone, gender, birthday }
  const existing = await UserProfile.findOne({ where: { userId } });
  if (existing) {
    await UserProfile.update(profile, { where: { userId } });
  } else {
    await UserProfile.create({ userId, ...profile });
  }
}

// 获取用户资料（含 profile）
export async function getUserProfile(userId) {
  return await User.findByPk(userId, {
    attributes: ['id', 'email', 'createdAt'],
    include: [{
      model: UserProfile,
      as: 'profile',
      attributes: ['nickname', 'avatar_url', 'phone', 'gender', 'birthday'],
    }],
  });
}

// 获取用户角色（假设你有Role模型和UserRole关联）
export async function getUserRoles(userId) {
  // 这里举例，具体根据你的模型关系调整
  const user = await User.findByPk(userId, {
    include: [{
      model: Role,
      as: 'roles',
      attributes: ['name'],
      through: { attributes: [] }, // 去除中间表字段
    }],
  });
  return user?.roles.map(r => r.name) || [];
}
