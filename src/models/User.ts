import { DataTypes, Model, type Optional } from 'sequelize';
import { sequelize } from '../config/database';

// Enum cho gender
export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export interface UserAttributes {
  id: number;
  firstName: string;
  lastName: string; 
  birthDate: Date | null;
  gender: Gender | null;
  createdAt: Date;
  createdBy: number | null;
  updatedAt: Date;
  updatedBy: number | null;
  isDeleted: boolean;
  deletedAt: Date | null;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'firstName' | 'lastName' | 'birthDate' | 'gender' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy' | 'isDeleted'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: number;
  declare firstName: string; 
  declare lastName: string; 
  declare birthDate: Date | null;
  declare gender: Gender | null;
  declare readonly createdAt: Date;
  declare createdBy: number | null;
  declare readonly updatedAt: Date;
  declare updatedBy: number | null;
  declare isDeleted: boolean;
  declare deletedAt: Date | null;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false, // NOT NULL in database
      field: 'first_name',
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false, // NOT NULL in database
      field: 'last_name',
    },
    birthDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'birth_date',
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at',
      // Sequelize tự động set giá trị khi timestamps: true
    },
    createdBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'created_by',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at',
      // Sequelize tự động set giá trị khi timestamps: true
    },
    updatedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'updated_by',
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_deleted',
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at',
      // Sequelize tự động quản lý khi paranoid: true
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    underscored: true,
    paranoid: true,
  }
);

export default User;

