import { DataTypes, Model, type Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface ProductAttributes {
  id: number;
  name: string;
  price: number;
  description: string | null;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface ProductCreationAttributes extends Optional<ProductAttributes, 'id' | 'description' | 'quantity' | 'createdAt' | 'updatedAt'> {}

class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  declare id: number;
  declare name: string;
  declare price: number;
  declare description: string | null;
  declare quantity: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare deletedAt: Date | null;
}

Product.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    quantity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
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
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at',
    },
  },
  {
    sequelize,
    tableName: 'products',
    timestamps: true,
    underscored: true,
    paranoid: true,
  }
);

export default Product;

