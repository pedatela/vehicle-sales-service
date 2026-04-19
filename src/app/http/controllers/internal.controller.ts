import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { createSalesService } from '../../factories/sales.factory';
import { vehicleSyncSchema } from '../validation/sales.schema';
import { VehicleResponse } from '../interfaces';
import { VehicleInventory } from '../../../domain/inventory/entities/vehicle-inventory';

const salesService = createSalesService();

const toVehicleResponse = (vehicle: VehicleInventory): VehicleResponse =>
  vehicle.toJSON() as VehicleResponse;

export const upsertVehicle = async (req: Request, res: Response) => {
  try {
    const payload = vehicleSyncSchema.parse(req.body ?? {});
    const vehicle = await salesService.upsertVehicle(payload);

    return res.status(201).json({
      message: 'Veículo sincronizado',
      vehicle: toVehicleResponse(vehicle)
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Payload inválido', details: error.flatten() });
    }

    throw error;
  }
};

export const updateVehicle = async (req: Request, res: Response) => {
  try {
    const { vehicleId } = req.params as { vehicleId: string };
    const payload = vehicleSyncSchema.parse({ ...(req.body ?? {}), vehicleId });
    const vehicle = await salesService.upsertVehicle(payload);

    return res.json({
      message: 'Veículo atualizado',
      vehicle: toVehicleResponse(vehicle)
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Payload inválido', details: error.flatten() });
    }

    throw error;
  }
};

export const deleteVehicle = async (req: Request, res: Response) => {
  const { vehicleId } = req.params as { vehicleId: string };
  await salesService.removeVehicle(vehicleId);

  return res.json({ message: 'Veículo removido do inventário' });
};
