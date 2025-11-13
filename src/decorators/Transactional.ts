import { sequelize } from '../config/database';
import type { Transaction, TransactionOptions } from 'sequelize';
import { Transaction as SequelizeTransaction } from 'sequelize';

/**
 * Decorator để tự động wrap method với transaction
 * 
 * Sử dụng: @Transactional()
 * 
 * Với CLS enabled, sequelize.transaction() tự động set transaction vào namespace
 * Tất cả queries sẽ tự động dùng transaction từ namespace
 * Không cần truyền { transaction: t } vào từng query nữa!
 * 
 * @example
 * class UserService {
 *   @Transactional()
 *   async createUser(data: CreateUserDto) {
 *     // Transaction tự động được truyền vào User.create()
 *     const user = await User.create({...});
 *     // Transaction tự động được truyền vào Role.findAll()
 *     const roles = await Role.findAll({...});
 *   }
 * }
 */
export function Transactional(options?: TransactionOptions) {
  return function (
    _target: any, // Decorator target (class instance)
    _propertyKey: string, // Method name
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    // Kiểm tra xem method có phải là async function không
    if (typeof originalMethod !== 'function') {
      return descriptor;
    }

    // Wrap method với sequelize.transaction() - giống như trong Sequelize docs
    // Với CLS enabled, transaction tự động được set vào namespace
    descriptor.value = async function (...args: any[]) {
      // Lưu context và args để đảm bảo không bị mất khi vào transaction callback
      const self = this;
      const methodArgs = args;
      
      const transactionOptions: TransactionOptions = options || {
        isolationLevel: SequelizeTransaction.ISOLATION_LEVELS.READ_COMMITTED
      };
      
      // Dùng promise-based transaction để đảm bảo args được truyền đúng
      return await sequelize.transaction(transactionOptions, async (_t: Transaction) => {
        // Transaction được tự động set vào CLS namespace bởi Sequelize
        // Tất cả queries trong method sẽ tự động dùng transaction này
        return await originalMethod.apply(self, methodArgs);
      });
    };

    return descriptor;
  };
}

