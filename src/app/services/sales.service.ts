import { VehicleInventory } from '../../domain/inventory/entities/vehicle-inventory';
import { VehicleInventoryRepository } from '../../domain/inventory/repositories/vehicle-inventory.repository';
import { PaymentWebhookEvent } from '../../domain/payments/entities/payment-webhook-event';
import { PaymentWebhookEventsRepository } from '../../domain/payments/repositories/payment-webhook-events.repository';
import { Sale, PaymentStatus } from '../../domain/sales/entities/sale';
import { SalesRepository } from '../../domain/sales/repositories/sales.repository';
import { logger } from '../logger';
import { CoreSyncPort } from './interfaces/core-sync.interface';

export class VehicleNotFoundError extends Error {
  constructor() {
    super('Veículo não encontrado no inventário');
    this.name = 'VehicleNotFoundError';
  }
}

export class VehicleUnavailableError extends Error {
  constructor() {
    super('Veículo indisponível para venda');
    this.name = 'VehicleUnavailableError';
  }
}

type VehicleSyncInput = {
  vehicleId: string;
  brand: string;
  model: string;
  version?: string | null | undefined;
  year: number;
  color: string;
  price: number;
  isSold?: boolean | undefined;
};

type CreateSaleInput = {
  vehicleId: string;
  buyerCpf: string;
  buyerEmail?: string | null | undefined;
  buyerName?: string | null | undefined;
  totalAmount?: number | undefined;
};

type PaymentWebhookInput = {
  paymentCode: string;
  status: Exclude<PaymentStatus, 'PENDING'>;
  payload?: Record<string, unknown> | undefined;
};

export class SalesService {
  constructor(
    private readonly inventoryRepository: VehicleInventoryRepository,
    private readonly salesRepository: SalesRepository,
    private readonly eventsRepository: PaymentWebhookEventsRepository,
    private readonly coreSync?: CoreSyncPort
  ) {}

  listAvailableVehicles(): Promise<VehicleInventory[]> {
    return this.inventoryRepository.listByStatus('AVAILABLE');
  }

  listSoldVehicles(): Promise<VehicleInventory[]> {
    return this.inventoryRepository.listByStatus('SOLD');
  }

  async upsertVehicle(payload: VehicleSyncInput): Promise<VehicleInventory> {
    logger.info('[sales] sincronizando veículo', { vehicleId: payload.vehicleId });
    const existing = await this.inventoryRepository.findByVehicleId(payload.vehicleId);
    const nextStatus = payload.isSold ? 'SOLD' : 'AVAILABLE';

    if (!existing) {
      const vehicle = VehicleInventory.create({
        ...payload,
        status: nextStatus
      });

      await this.inventoryRepository.save(vehicle);
      return vehicle;
    }

    existing.update({
      brand: payload.brand,
      model: payload.model,
      version: payload.version ?? null,
      year: payload.year,
      color: payload.color,
      price: payload.price
    });

    if (nextStatus === 'SOLD') {
      existing.markSold();
    } else if (existing.status !== 'AVAILABLE') {
      existing.markAvailable();
    }

    await this.inventoryRepository.save(existing);
    return existing;
  }

  async removeVehicle(vehicleId: string): Promise<void> {
    await this.inventoryRepository.deleteByVehicleId(vehicleId);
  }

  async createSale(input: CreateSaleInput): Promise<{ sale: Sale; inventory: VehicleInventory }> {
    logger.info('[sales] iniciando venda', { vehicleId: input.vehicleId });
    const vehicle = await this.inventoryRepository.findByVehicleId(input.vehicleId);

    if (!vehicle) {
      throw new VehicleNotFoundError();
    }

    if (!vehicle.isAvailable()) {
      throw new VehicleUnavailableError();
    }

    vehicle.markPendingPayment();
    await this.inventoryRepository.save(vehicle);

    const sale = Sale.create({
      vehicleId: vehicle.vehicleId,
      buyerCpf: input.buyerCpf,
      buyerEmail: input.buyerEmail ?? null,
      buyerName: input.buyerName ?? null,
      totalAmount: input.totalAmount ?? vehicle.price
    });

    await this.salesRepository.create(sale);

    logger.info('[sales] venda criada', { saleId: sale.id, paymentCode: sale.paymentCode });
    return { sale, inventory: vehicle };
  }

  async handlePaymentWebhook(input: PaymentWebhookInput): Promise<{
    sale: Sale | null;
    inventory: VehicleInventory | null;
  }> {
    logger.info('[sales] recebendo webhook de pagamento', {
      paymentCode: input.paymentCode,
      status: input.status
    });

    const event = PaymentWebhookEvent.create({
      paymentCode: input.paymentCode,
      statusReceived: input.status,
      payload: input.payload ?? null,
      processedAt: new Date()
    });

    await this.eventsRepository.create(event);
    const sale = await this.salesRepository.findByPaymentCode(input.paymentCode);

    if (!sale) {
      logger.warn('[sales] webhook sem venda associada', { paymentCode: input.paymentCode });
      return { sale: null, inventory: null };
    }

    const inventory = await this.inventoryRepository.findByVehicleId(sale.vehicleId);

    if (!inventory) {
      logger.warn('[sales] inventário não encontrado para venda', { vehicleId: sale.vehicleId });
      return { sale, inventory: null };
    }

    if (input.status === 'PAID') {
      sale.markPaid();
      inventory.markSold();
    } else if (input.status === 'CANCELED') {
      sale.markCanceled();
      inventory.markAvailable();
    }

    await this.salesRepository.update(sale);
    await this.inventoryRepository.save(inventory);
    await this.notifyCoreVehicleSaleStatus(sale);

    logger.info('[sales] webhook processado', {
      paymentCode: sale.paymentCode,
      paymentStatus: sale.paymentStatus,
      inventoryStatus: inventory.status
    });

    return { sale, inventory };
  }

  private async notifyCoreVehicleSaleStatus(sale: Sale): Promise<void> {
    if (!this.coreSync) {
      return;
    }

    if (sale.paymentStatus === 'PAID') {
      await this.coreSync.syncVehicleSaleStatus({
        vehicleId: sale.vehicleId,
        isSold: true,
        buyerId: sale.buyerCpf,
        buyerEmail: sale.buyerEmail,
        buyerName: sale.buyerName
      });
      return;
    }

    if (sale.paymentStatus === 'CANCELED') {
      await this.coreSync.syncVehicleSaleStatus({
        vehicleId: sale.vehicleId,
        isSold: false,
        buyerId: null,
        buyerEmail: null,
        buyerName: null
      });
    }
  }
}
