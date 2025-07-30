// models/Order.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import User from './User.js';


const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  orderNo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  totalAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'shipped', 'completed', 'cancelled'),
    defaultValue: 'pending',
  },
  paymentMethod: {
    type: DataTypes.STRING,
  },
}, {
  tableName: 'orders',
  timestamps: true,
});

Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default Order;
