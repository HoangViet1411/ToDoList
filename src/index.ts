import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST
// Luôn tải đúng .env dù chạy từ đâu
// Với CommonJS, __dirname sẽ có sẵn sau khi compile
// Hoặc dùng process.cwd() để lấy thư mục hiện tại
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import app from './app';
import { sequelize } from './config/database';
import './models';

const PORT = Number.parseInt(process.env['PORT'] ?? '3000', 10);

// Test database connection and start server
async function startServer(): Promise<void> {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log(' Database connection established successfully.');

    // Sync database - chỉ khi có flag SYNC_DB=true trong .env
    // Sau khi đã tạo xong bảng, set SYNC_DB=false hoặc xóa flag để tắt sync
    const shouldSync = process.env['SYNC_DB'] === 'true';
    
    if (shouldSync) {
      // Tạo bảng nếu chưa tồn tại, và alter schema nếu có thay đổi
      // force: false - không xóa bảng hiện có
      // alter: true - tự động thêm/sửa columns khi model thay đổi
      await sequelize.sync({ force: false, alter: true });
      console.log(' Database synced successfully. All tables are ready.');
      console.log(' 💡 Tip: Set SYNC_DB=false in .env to skip sync on next run');
    } else {
      // Không sync - bảng đã được tạo, chỉ kiểm tra connection
      console.log(' Skipping database sync (set SYNC_DB=false in .env to disable)');
    }

    // Start server
    app.listen(PORT, () => {
      console.log(` Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(' Unable to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await sequelize.close();
  process.exit(0);
});

