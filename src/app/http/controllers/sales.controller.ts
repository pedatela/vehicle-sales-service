import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { createSalesService } from '../../factories/sales.factory';
import { VehicleNotFoundError, VehicleUnavailableError } from '../../services/sales.service';
import { SaleResponse, VehicleResponse } from '../interfaces';
import { Sale } from '../../../domain/sales/entities/sale';
import { VehicleInventory } from '../../../domain/inventory/entities/vehicle-inventory';
import { createSaleSchema, paymentWebhookSchema } from '../validation/sales.schema';

const salesService = createSalesService();

const toSaleResponse = (sale: Sale): SaleResponse => sale.toJSON() as SaleResponse;
const toVehicleResponse = (vehicle: VehicleInventory): VehicleResponse =>
  vehicle.toJSON() as VehicleResponse;

export const createSale = async (req: Request, res: Response) => {
  try {
    const payload = createSaleSchema.parse(req.body ?? {});
    const { sale, inventory } = await salesService.createSale(payload);

    return res.status(201).json({
      sale: toSaleResponse(sale),
      inventory: toVehicleResponse(inventory)
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Payload inválido', details: error.flatten() });
    }

    if (error instanceof VehicleNotFoundError) {
      return res.status(404).json({ message: error.message });
    }

    if (error instanceof VehicleUnavailableError) {
      return res.status(409).json({ message: error.message });
    }

    throw error;
  }
};

export const handlePaymentWebhook = async (req: Request, res: Response) => {
  try {
    const payload = paymentWebhookSchema.parse(req.body ?? {});
    const result = await salesService.handlePaymentWebhook(payload);

    return res.json({
      sale: result.sale ? toSaleResponse(result.sale) : null,
      inventory: result.inventory ? toVehicleResponse(result.inventory) : null
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Payload inválido', details: error.flatten() });
    }

    throw error;
  }
};
