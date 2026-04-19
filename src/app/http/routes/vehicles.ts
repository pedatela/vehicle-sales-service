import { Router } from 'express';
import { listAvailableVehicles, listSoldVehicles } from '../controllers/vehicles.controller';

const vehiclesRouter = Router();

vehiclesRouter.get('/available', listAvailableVehicles);
vehiclesRouter.get('/sold', listSoldVehicles);

export default vehiclesRouter;
