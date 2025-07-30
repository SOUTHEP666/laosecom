// models/UserProfile.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import User from './User.js';

const UserProfile = sequelize.define('UserProfile', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  nickname: {
    type: DataTypes.STRING,
  },
  avatar_url: {
    type: DataTypes.STRING,
  },
  phone: {
    type: DataTypes.STRING,
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
  },
  birthday: {
    type: DataTypes.DATEONLY,
  },
}, {
  tableName: 'user_profiles',
  timestamps: true,
});

UserProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(UserProfile, { foreignKey: 'userId', as: 'profile' });

export default UserProfile;
