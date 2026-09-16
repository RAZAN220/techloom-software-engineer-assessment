import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import routes from './routes/index.js';
import { connectDatabase } from './config/db.js';
import { startExpiryJob } from './jobs/expiryJob.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app = express();

const configuredFrontend = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : null;
const allowedOrigins = [configuredFrontend].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    if (process.env.NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      callback(null, true);
      return;
    }
    if (configuredFrontend?.includes('vercel.app') && origin.endsWith('.vercel.app')) {
      callback(null, true);
      return;
    }
    callback(null, false);
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
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use('/api', routes);
app.use('/', routes);
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