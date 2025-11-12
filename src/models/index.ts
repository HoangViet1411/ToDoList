import User from './User';
import Role from './Role';
import UserRole from './UserRole';
import Product from './Product';
import Order from './Order';
import OrderDetail from './OrderDetail';

// Setup associations

// Role - User (N-N) through user_roles
User.belongsToMany(Role, {
  through: UserRole,
  foreignKey: 'user_id',
  otherKey: 'role_id',
  as: 'roles',
});

Role.belongsToMany(User, {
  through: UserRole,
  foreignKey: 'role_id',
  otherKey: 'user_id',
  as: 'users',
});

// User - Order (1-N)
User.hasMany(Order, {
  foreignKey: 'user_id',
  as: 'orders',
});

Order.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// Order - OrderDetail (1-N)
Order.hasMany(OrderDetail, {
  foreignKey: 'order_id',
  as: 'orderDetails',
});

OrderDetail.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order',
});

// Product - OrderDetail (1-N)
Product.hasMany(OrderDetail, {
  foreignKey: 'product_id',
  as: 'orderDetails',
});

OrderDetail.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product',
});

export { User, Role, UserRole, Product, Order, OrderDetail };

