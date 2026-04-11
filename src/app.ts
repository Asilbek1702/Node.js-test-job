import express from 'express';
import userRoutes from './routes/user.routes';
import { notFound, errorHandler } from './middlewares/error.middleware';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/users', userRoutes);

// 404 & global error handler
app.use(notFound);
app.use(errorHandler);

export default app;
