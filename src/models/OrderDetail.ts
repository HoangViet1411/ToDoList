import { DataTypes, Model, type Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface OrderDetailAttributes {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number | null;
  createdAt: Date;
  updatedAt: Date;
}

interface OrderDetailCreationAttributes extends Optional<OrderDetailAttributes, 'id' | 'lineTotal' | 'createdAt' | 'updatedAt'> {}

class OrderDetail extends Model<OrderDetailAttributes, OrderDetailCreationAttributes> implements OrderDetailAttributes {
  declare id: number;
  declare orderId: number;
  declare productId: number;
  declare quantity: number;
  declare unitPrice: number;
  declare lineTotal: number | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

OrderDetail.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'order_id',
      references: {
        model: 'orders',
        key: 'id',
      },
    },
    productId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'product_id',
      references: {
        model: 'products',
        key: 'id',
      },
    },
    quantity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    unitPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'unit_price',
      validate: {
        min: 0,
      },
    },
    lineTotal: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true,
      field: 'line_total',
      validate: {
        min: 0,
      },
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
  },
  {
    sequelize,
    tableName: 'order_details',
    timestamps: true,
    underscored: true,
    paranoid: false,
  }
);

export default OrderDetail;

