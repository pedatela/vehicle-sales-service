import { Router } from 'express';
import { createSale, handlePaymentWebhook } from '../controllers/sales.controller';

const salesRouter = Router();

salesRouter.post('/', createSale);
salesRouter.post('/payments/webhook', handlePaymentWebhook);

export default salesRouter;
