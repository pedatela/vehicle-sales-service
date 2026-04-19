import { VehicleInventory, VehicleStatus } from '../../../domain/inventory/entities/vehicle-inventory';
import { VehicleInventoryRepository } from '../../../domain/inventory/repositories/vehicle-inventory.repository';

export class InMemoryVehicleInventoryRepository implements VehicleInventoryRepository {
  private readonly items = new Map<string, VehicleInventory>();

  async listByStatus(status: VehicleStatus): Promise<VehicleInventory[]> {
    return Array.from(this.items.values())
      .filter((vehicle) => vehicle.status === status)
      .sort((a, b) => a.price - b.price);
  }

  async findByVehicleId(vehicleId: string): Promise<VehicleInventory | null> {
    return this.items.get(vehicleId) ?? null;
  }

  async save(vehicle: VehicleInventory): Promise<void> {
    this.items.set(vehicle.vehicleId, vehicle);
  }

  async deleteByVehicleId(vehicleId: string): Promise<void> {
    this.items.delete(vehicleId);
  }
}
