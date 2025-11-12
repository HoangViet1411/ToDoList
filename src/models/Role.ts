import { DataTypes, Model, type Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface RoleAttributes {
  id: number;
  roleName: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface RoleCreationAttributes extends Optional<RoleAttributes, 'id' | 'description' | 'createdAt' | 'updatedAt'> {}

class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
  declare id: number;
  declare roleName: string;
  declare description: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare deletedAt: Date | null;
}

Role.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    roleName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      field: 'role_name',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    tableName: 'roles',
    timestamps: true,
    underscored: true,
    paranoid: true,
  }
);

export default Role;

