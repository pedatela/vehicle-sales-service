import { Sale } from '../../../domain/sales/entities/sale';
import { SalesRepository } from '../../../domain/sales/repositories/sales.repository';

export class InMemorySalesRepository implements SalesRepository {
  private readonly items = new Map<string, Sale>();
  private readonly paymentCodeIndex = new Map<string, string>();
  private readonly vehicleIndex = new Map<string, string>();

  async create(sale: Sale): Promise<void> {
    this.items.set(sale.id, sale);
    this.paymentCodeIndex.set(sale.paymentCode, sale.id);
    this.vehicleIndex.set(sale.vehicleId, sale.id);
  }

  async findByPaymentCode(paymentCode: string): Promise<Sale | null> {
    const saleId = this.paymentCodeIndex.get(paymentCode);
    return saleId ? this.items.get(saleId) ?? null : null;
  }

  async findByVehicleId(vehicleId: string): Promise<Sale | null> {
    const saleId = this.vehicleIndex.get(vehicleId);
    return saleId ? this.items.get(saleId) ?? null : null;
  }

  async update(sale: Sale): Promise<void> {
    if (!this.items.has(sale.id)) {
      this.paymentCodeIndex.set(sale.paymentCode, sale.id);
      this.vehicleIndex.set(sale.vehicleId, sale.id);
    }

    this.items.set(sale.id, sale);
  }

  async list(): Promise<Sale[]> {
    return Array.from(this.items.values());
  }
}
