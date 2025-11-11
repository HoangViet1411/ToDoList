import dotenv from 'dotenv';
import app from './app';
import { sequelize } from './config/database';

// Load environment variables
dotenv.config();

const PORT = Number.parseInt(process.env['PORT'] ?? '3000', 10);

// Test database connection and start server
async function startServer(): Promise<void> {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log(' Database connection established successfully.');

    // Sync database (in production, use migrations instead)
    // await sequelize.sync({ alter: true });
    // console.log(' Database synced successfully.');

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

