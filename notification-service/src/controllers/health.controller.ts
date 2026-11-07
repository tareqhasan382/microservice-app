import { Request, Response } from 'express';
import ApiResponse from '../utils/ApiResponse';

export const getHealth = (req: Request, res: Response) => {
  const data = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    status: 'ok',
  };
  res.json(new ApiResponse(true, 200, 'Server is healthy 🚀', data));
};
