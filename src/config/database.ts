import { Sequelize } from 'sequelize';
import * as cls from 'cls-hooked';
import 'dotenv/config';

// Tạo CLS namespace để tự động truyền transaction vào tất cả queries
const namespace = cls.createNamespace('sequelize-transaction-namespace');

// Enable CLS cho Sequelize - PHẢI gọi TRƯỚC khi tạo Sequelize instance
Sequelize.useCLS(namespace);

const DB_NAME = process.env['DB_NAME'] ?? 'todo_list';
const DB_USER = process.env['DB_USER'] ?? 'root';
const DB_PASS = process.env['DB_PASS'] ?? '';
const DB_HOST = process.env['DB_HOST'] ?? 'localhost';
const DB_PORT = Number.parseInt(process.env['DB_PORT'] ?? '3306', 10);
const DB_LOG_SQL = process.env['DB_LOG_SQL'] === 'true';

// Log để debug xem DB_LOG_SQL có được set chưa
console.log('[Database Config] DB_LOG_SQL:', DB_LOG_SQL);
console.log('[Database Config] CLS enabled for automatic transaction passing');

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'mysql',
  // Chỉ log SQL khi DB_LOG_SQL=true
  logging: DB_LOG_SQL
    ? (sql: string) => {
        console.log('\n                   SQL QUERY EXECUTION                     ');
        console.log('══════════════════════════════════════════════════════════════');
        console.log('', sql);
        console.log('══════════════════════════════════════════════════════════════\n');
      }
    : false,
  define: {
    timestamps: false,
    underscored: true,
  },
});

// Export namespace để có thể dùng ở nơi khác nếu cần
export { namespace };
