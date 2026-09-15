import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import routes from './routes/index.js';
import { connectDatabase } from './config/db.js';
import { startExpiryJob } from './jobs/expiryJob.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app = express();
app.use(cors());
app.use(express.json());
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use('/api', routes);
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  const port = process.env.PORT || 5000;
  connectDatabase()
    .then(() => app.listen(port, () => { console.log(`Server running on port ${port}`); startExpiryJob(); }))
    .catch(error => { console.error('Database connection failed:', error); process.exit(1); });
}