import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { healthRouter } from './routes/health';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : 'http://localhost:8080',
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use('/api/v1/health', healthRouter);

// Middlewares
app.use(errorHandler);

export default app;
