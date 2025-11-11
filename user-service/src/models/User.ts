import { DataTypes, Model, type Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface UserAttributes {
  id: number;
  first_name: string | null;
  last_name: string | null;
  birth_date: Date | null;
  gender: string | null;
  created_at: Date;
  created_by: number | null;
  updated_at: Date;
  updated_by: number | null;
  is_deleted: boolean;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'first_name' | 'last_name' | 'birth_date' | 'gender' | 'created_at' | 'created_by' | 'updated_at' | 'updated_by' | 'is_deleted'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: number;
  declare first_name: string | null;
  declare last_name: string | null;
  declare birth_date: Date | null;
  declare gender: string | null;
  declare readonly created_at: Date;
  declare created_by: number | null;
  declare readonly updated_at: Date;
  declare updated_by: number | null;
  declare is_deleted: boolean;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    birth_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    gender: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    created_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false, // 0 = chưa xóa, 1 = đã xóa
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: false,
    underscored: true,
  }
);

export default User;

