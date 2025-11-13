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
    indexes: [
      // Index 1: Price index - QUAN TRỌNG NHẤT
      // Dùng cho: WHERE price >= X AND price <= Y (range queries)
      // Range queries rất hiệu quả với B-tree index trên numeric column
      // Cải thiện performance đáng kể khi filter theo giá
      {
        name: 'idx_products_price',
        fields: ['price'],
      },
      
      // Index 2: Name index
      // Dùng cho: WHERE name LIKE '%...%' và filter by name
      // Mặc dù LIKE với wildcard ở đầu không dùng index tốt nhất,
      // nhưng vẫn hữu ích cho exact match và một số trường hợp prefix search
      {
        name: 'idx_products_name',
        fields: ['name'],
      },
      
      // Index 3: Composite index (price, deleted_at) - TỐI ƯU NHẤT
      // Dùng cho: WHERE price >= X AND deleted_at IS NULL
      // Composite index này cover cả 2 điều kiện trong 1 index
      // Rất hiệu quả vì thường query price kèm paranoid check
      // MySQL có thể dùng index này để filter cả price và deleted_at cùng lúc
      {
        name: 'idx_products_price_deleted',
        fields: ['price', 'deleted_at'],
      },
      
      // Index 4: Composite index (name, deleted_at)
      // Dùng cho: WHERE name LIKE '%...%' AND deleted_at IS NULL
      // Tương tự index 3, nhưng cho name filter
      // Hữu ích khi search/filter name kèm paranoid check
      {
        name: 'idx_products_name_deleted',
        fields: ['name', 'deleted_at'],
      },
      
      // Index 5: FULLTEXT index cho search
      // Dùng cho: MATCH(name, description) AGAINST('search term')
      // Tối ưu cho full-text search trong name và description
      // Lưu ý: Chỉ hoạt động với InnoDB (MySQL 5.6.4+) hoặc MyISAM
      // Nếu MySQL version < 5.6.4, index này sẽ bị bỏ qua khi sync
      {
        name: 'idx_products_fulltext',
        type: 'FULLTEXT',
        fields: ['name', 'description'],
      },
    ],
  }
);

export default Product;

