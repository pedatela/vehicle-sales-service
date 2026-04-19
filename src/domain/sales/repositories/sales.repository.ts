import { Sale } from '../entities/sale';

export interface SalesRepository {
  create(sale: Sale): Promise<void>;
  findByPaymentCode(paymentCode: string): Promise<Sale | null>;
  findByVehicleId(vehicleId: string): Promise<Sale | null>;
  update(sale: Sale): Promise<void>;
  list(): Promise<Sale[]>;
}
