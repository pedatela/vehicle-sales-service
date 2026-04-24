import { Router } from 'express';
import { createSale, handlePaymentWebhook } from '../controllers/sales.controller';
import { authenticate } from '../middlewares/auth';

const salesRouter = Router();

salesRouter.post('/', authenticate, createSale);
salesRouter.post('/payments/webhook', handlePaymentWebhook);

export default salesRouter;
