import { Router } from 'express';
import { deleteVehicle, updateVehicle, upsertVehicle } from '../controllers/internal.controller';
import { requireInternalToken } from '../middlewares/internal-auth';

const internalRouter = Router();

internalRouter.use(requireInternalToken);
internalRouter.post('/vehicles', upsertVehicle);
internalRouter.put('/vehicles/:vehicleId', updateVehicle);
internalRouter.delete('/vehicles/:vehicleId', deleteVehicle);

export default internalRouter;
