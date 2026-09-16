import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import routes from './routes/index.js';
import { connectDatabase } from './config/db.js';
import { startExpiryJob } from './jobs/expiryJob.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('CORS origin not allowed'));
  },
  credentials: true
}));
app.use(express.json());
app.use(async (req, res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    next(error);
  }
});
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use('/api', routes);
app.use(errorHandler);

export const startServer = async () => {
  const port = process.env.PORT || 5000;
  await connectDatabase();
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      startExpiryJob();
      resolve(server);
    });
  });
};

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  startServer().catch(error => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });
}

export default app;