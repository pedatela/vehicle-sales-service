import { VehicleInventory, VehicleStatus } from '../entities/vehicle-inventory';

export interface VehicleInventoryRepository {
  listByStatus(status: VehicleStatus): Promise<VehicleInventory[]>;
  findByVehicleId(vehicleId: string): Promise<VehicleInventory | null>;
  save(vehicle: VehicleInventory): Promise<void>;
  deleteByVehicleId(vehicleId: string): Promise<void>;
}
