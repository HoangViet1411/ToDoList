import { DataTypes, Model, type Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface UserRoleAttributes {
  id: number;
  userId: number;
  roleId: number;
  createdAt: Date;
  updatedAt: Date;
}

interface UserRoleCreationAttributes extends Optional<UserRoleAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class UserRole extends Model<UserRoleAttributes, UserRoleCreationAttributes> implements UserRoleAttributes {
  declare id: number;
  declare userId: number;
  declare roleId: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

UserRole.init(
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
    roleId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'role_id',
      references: {
        model: 'roles',
        key: 'id',
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
    tableName: 'user_roles',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'role_id'], // Composite unique index để tránh duplicate
      },
    ],
  }
);

export default UserRole;

