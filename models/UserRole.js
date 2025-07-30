// models/UserRole.js (中间表，关联用户和角色)
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import User from './User.js';
import Role from './Role.js';

const UserRole = sequelize.define('UserRole', {
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id',
    },
    primaryKey: true,
  },
  roleId: {
    type: DataTypes.INTEGER,
    references: {
      model: Role,
      key: 'id',
    },
    primaryKey: true,
  },
}, {
  tableName: 'user_roles',
  timestamps: false,
});

User.belongsToMany(Role, { through: UserRole, as: 'roles', foreignKey: 'userId' });
Role.belongsToMany(User, { through: UserRole, as: 'users', foreignKey: 'roleId' });

export default UserRole;
