import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SalesService, VehicleUnavailableError } from '../src/app/services/sales.service';
import { InMemoryVehicleInventoryRepository } from '../src/infra/repositories/in-memory/in-memory-vehicle-inventory.repository';
import { InMemorySalesRepository } from '../src/infra/repositories/in-memory/in-memory-sales.repository';
import { InMemoryPaymentWebhookEventsRepository } from '../src/infra/repositories/in-memory/in-memory-payment-webhook-events.repository';
import { VehicleInventory } from '../src/domain/inventory/entities/vehicle-inventory';
import { CoreSyncPort } from '../src/app/services/interfaces/core-sync.interface';

const makeVehicle = () =>
  VehicleInventory.create({
    vehicleId: 'vehicle-1',
    brand: 'Tesla',
    model: 'Model Y',
    year: 2024,
    color: 'Azul',
    price: 320000
  });

describe('SalesService', () => {
  let inventoryRepo: InMemoryVehicleInventoryRepository;
  let salesRepo: InMemorySalesRepository;
  let eventsRepo: InMemoryPaymentWebhookEventsRepository;
  let service: SalesService;
  let coreSync: CoreSyncPort;
  let syncVehicleSaleStatusMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    inventoryRepo = new InMemoryVehicleInventoryRepository();
    salesRepo = new InMemorySalesRepository();
    eventsRepo = new InMemoryPaymentWebhookEventsRepository();
    syncVehicleSaleStatusMock = vi.fn().mockResolvedValue(undefined);
    coreSync = {
      syncVehicleSaleStatus: syncVehicleSaleStatusMock
    };
    service = new SalesService(inventoryRepo, salesRepo, eventsRepo, coreSync);

    const vehicle = makeVehicle();
    await inventoryRepo.save(vehicle);
  });

  it('creates sales and mark inventory as pending payment', async () => {
    const result = await service.createSale({
      vehicleId: 'vehicle-1',
      buyerCpf: '12345678901'
    });

    expect(result.sale.paymentStatus).toBe('PENDING');
    expect(result.inventory.status).toBe('PENDING_PAYMENT');
  });

  it('prevents multiple sales for the same vehicle', async () => {
    await service.createSale({ vehicleId: 'vehicle-1', buyerCpf: '12345678901' });

    await expect(
      service.createSale({ vehicleId: 'vehicle-1', buyerCpf: '23456789012' })
    ).rejects.toBeInstanceOf(VehicleUnavailableError);
  });

  it('marks sale as paid when webhook confirms payment', async () => {
    const { sale } = await service.createSale({
      vehicleId: 'vehicle-1',
      buyerCpf: '12345678901'
    });

    const result = await service.handlePaymentWebhook({
      paymentCode: sale.paymentCode,
      status: 'PAID'
    });

    expect(result.sale?.paymentStatus).toBe('PAID');
    expect(result.inventory?.status).toBe('SOLD');
    expect(syncVehicleSaleStatusMock).toHaveBeenCalledWith({
      vehicleId: 'vehicle-1',
      isSold: true,
      buyerId: '12345678901',
      buyerEmail: null,
      buyerName: null
    });
  });

  it('marks sale as canceled when webhook notifies failure', async () => {
    const { sale } = await service.createSale({
      vehicleId: 'vehicle-1',
      buyerCpf: '12345678901'
    });

    const result = await service.handlePaymentWebhook({
      paymentCode: sale.paymentCode,
      status: 'CANCELED'
    });

    expect(result.sale?.paymentStatus).toBe('CANCELED');
    expect(result.inventory?.status).toBe('AVAILABLE');
    expect(syncVehicleSaleStatusMock).toHaveBeenCalledWith({
      vehicleId: 'vehicle-1',
      isSold: false,
      buyerId: null,
      buyerEmail: null,
      buyerName: null
    });
  });
});
