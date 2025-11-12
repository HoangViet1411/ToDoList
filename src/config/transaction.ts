import { sequelize } from './database';
import type { Transaction, TransactionOptions } from 'sequelize';
import { Transaction as SequelizeTransaction } from 'sequelize';

/**
 * Utility function để thực thi code trong transaction
 * Tự động commit khi thành công, rollback khi có lỗi
 * 
 * @param fn - Function nhận transaction và trả về Promise
 * @param options - Transaction options (isolation level, etc.)
 * @returns Promise với kết quả từ fn
 */
export async function withTransaction<T>(
  fn: (t: Transaction) => Promise<T>,
  options: TransactionOptions = { isolationLevel: SequelizeTransaction.ISOLATION_LEVELS.READ_COMMITTED }
): Promise<T> {
  return sequelize.transaction(options, fn);
}

