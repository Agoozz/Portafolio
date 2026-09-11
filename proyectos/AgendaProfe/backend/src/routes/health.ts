import { Router, Request, Response } from 'express';
import { checkDbConnection } from '../config/database';

export const healthRouter = Router();

healthRouter.get('/', async (req: Request, res: Response) => {
  const isDbConnected = await checkDbConnection();
  
  if (isDbConnected) {
    res.status(200).json({ status: 'ok', db: 'connected' });
  } else {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});
