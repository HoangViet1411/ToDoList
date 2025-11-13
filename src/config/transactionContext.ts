import type { Transaction } from 'sequelize';
import { namespace } from './database';

/**
 * Lấy transaction hiện tại từ CLS namespace
 * Với CLS enabled, Sequelize tự động lưu transaction vào namespace khi gọi sequelize.transaction()
 * 
 * @returns Transaction hiện tại hoặc undefined nếu không có transaction
 * 
 * @example
 * // Trong sequelize.transaction() callback:
 * sequelize.transaction(async (t) => {
 *   const transactionInNamespace = getTransaction();
 *   console.log(transactionInNamespace === t); // true
 * });
 */
export function getTransaction(): Transaction | undefined {
  return namespace.get('transaction') as Transaction | undefined;
}

/**
 * Thực thi code với transaction đã có sẵn (từ bên ngoài)
 * Set transaction vào CLS namespace để tất cả queries tự động dùng transaction này
 * 
 * @param transaction - Transaction đã có sẵn
 * @param fn - Function nhận transaction và trả về Promise
 * @returns Promise với kết quả từ fn
 */
export async function withExistingTransaction<T>(
  transaction: Transaction,
  fn: (t: Transaction) => Promise<T>
): Promise<T> {
  // Set transaction vào CLS namespace để tất cả queries tự động dùng transaction này
  return namespace.runPromise(async () => {
    namespace.set('transaction', transaction);
    return fn(transaction);
  });
}

