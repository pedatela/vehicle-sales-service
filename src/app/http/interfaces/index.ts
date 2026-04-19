import { VehicleInventory } from '../../../domain/inventory/entities/vehicle-inventory';
import { Sale } from '../../../domain/sales/entities/sale';

export type VehicleResponse = ReturnType<VehicleInventory['toJSON']>;
export type SaleResponse = ReturnType<Sale['toJSON']>;
