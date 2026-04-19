import { Router } from 'express';
import vehiclesRouter from './vehicles';
import salesRouter from './sales';
import internalRouter from './internal';

const routes = Router();

routes.use('/vehicles', vehiclesRouter);
routes.use('/sales', salesRouter);
routes.use('/internal', internalRouter);

export default routes;
