import { Request, Response } from 'express';
import { createSalesService } from '../../factories/sales.factory';
import { VehicleResponse } from '../interfaces';
import { VehicleInventory } from '../../../domain/inventory/entities/vehicle-inventory';

const salesService = createSalesService();

const formatVehicle = (vehicle: VehicleInventory): VehicleResponse =>
  vehicle.toJSON() as VehicleResponse;

export const listAvailableVehicles = async (_req: Request, res: Response) => {
  const vehicles = await salesService.listAvailableVehicles();

  return res.json({ total: vehicles.length, data: vehicles.map(formatVehicle) });
};

export const listSoldVehicles = async (_req: Request, res: Response) => {
  const vehicles = await salesService.listSoldVehicles();

  return res.json({ total: vehicles.length, data: vehicles.map(formatVehicle) });
};
