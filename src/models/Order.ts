import { DataTypes, Model, type Optional } from 'sequelize';
import { sequelize } from '../config/database';

// Order model with associations to User and OrderDetail

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  COD = 'cod',
  CREDIT_CARD = 'credit_card',
  BANK_TRANSFER = 'bank_transfer',
  PAYPAL = 'paypal',
}

export interface OrderAttributes {
  id: number;
  userId: number;
  status: OrderStatus;
  totalAmount: number;
  note: string | null;
  shippingAddress: string | null;
  paymentMethod: PaymentMethod | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface OrderCreationAttributes extends Optional<OrderAttributes, 'id' | 'status' | 'totalAmount' | 'note' | 'shippingAddress' | 'paymentMethod' | 'createdAt' | 'updatedAt'> {}

class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  declare id: number;
  declare userId: number;
  declare status: OrderStatus;
  declare totalAmount: number;
  declare note: string | null;
  declare shippingAddress: string | null;
  declare paymentMethod: PaymentMethod | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare deletedAt: Date | null;
}

Order.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: OrderStatus.PENDING,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'total_amount',
      validate: {
        min: 0,
      },
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    shippingAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'shipping_address',
    },
    paymentMethod: {
      type: DataTypes.ENUM('cod', 'credit_card', 'bank_transfer', 'paypal'),
      allowNull: true,
      field: 'payment_method',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at',
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at',
    },
  },
  {
    sequelize,
    tableName: 'orders',
    timestamps: true,
    underscored: true,
    paranoid: true,
  }
);

export default Order;

