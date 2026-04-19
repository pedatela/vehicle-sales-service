import { Request, Response, NextFunction } from 'express';
import { internalConfig } from '../../../config/internal';

export const requireInternalToken = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers['x-internal-token'];
  const token = typeof header === 'string' ? header : Array.isArray(header) ? header[0] : undefined;

  if (!internalConfig.token) {
    return res.status(500).json({
      message: 'Token interno não configurado'
    });
  }

  if (!token || token !== internalConfig.token) {
    return res.status(401).json({
      message: 'Token interno inválido'
    });
  }

  return next();
};
