import express, { type Express } from 'express';
import morgan from 'morgan';
import userRoutes from './routes/userRoutes';
import roleRoutes from './routes/roleRoutes';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';

const app: Express = express();

// Middleware
app.use(morgan('dev')); // Log HTTP requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK', message: 'User service is running' });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

export default app;

