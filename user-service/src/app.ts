import express, { type Express } from 'express';
import userRoutes from './routes/userRoutes';

const app: Express = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK', message: 'User service is running' });
});

// Routes
app.use('/api/users', userRoutes);

export default app;

