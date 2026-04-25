import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  SalesService,
  VehicleNotFoundError,
  VehicleUnavailableError
} from '../src/app/services/sales.service';
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

const makeSyncPayload = (overrides: Partial<{ vehicleId: string; price: number; isSold: boolean }> = {}) => ({
  vehicleId: overrides.vehicleId ?? 'vehicle-1',
  brand: 'Tesla',
  model: 'Model Y',
  year: 2024,
  color: 'Azul',
  price: overrides.price ?? 320000,
  isSold: overrides.isSold
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

  it('throws not found error when vehicle does not exist', async () => {
    await expect(
      service.createSale({
        vehicleId: 'vehicle-missing',
        buyerCpf: '12345678901'
      })
    ).rejects.toBeInstanceOf(VehicleNotFoundError);
  });

  it('returns nulls when webhook arrives for unknown payment code', async () => {
    const result = await service.handlePaymentWebhook({
      paymentCode: 'unknown-payment-code',
      status: 'PAID'
    });

    expect(result).toEqual({
      sale: null,
      inventory: null
    });
  });

  it('returns sale and null inventory when sale exists but inventory was removed', async () => {
    const { sale } = await service.createSale({
      vehicleId: 'vehicle-1',
      buyerCpf: '12345678901'
    });

    await service.removeVehicle('vehicle-1');

    const result = await service.handlePaymentWebhook({
      paymentCode: sale.paymentCode,
      status: 'PAID'
    });

    expect(result.sale?.id).toBe(sale.id);
    expect(result.sale?.paymentStatus).toBe('PENDING');
    expect(result.inventory).toBeNull();
  });

  it('upserts vehicle and updates status transitions', async () => {
    const created = await service.upsertVehicle(
      makeSyncPayload({
        vehicleId: 'vehicle-2',
        price: 210000
      })
    );

    expect(created.vehicleId).toBe('vehicle-2');
    expect(created.status).toBe('AVAILABLE');

    const updatedToSold = await service.upsertVehicle(
      makeSyncPayload({
        vehicleId: 'vehicle-2',
        isSold: true
      })
    );
    expect(updatedToSold.status).toBe('SOLD');

    const updatedToAvailable = await service.upsertVehicle(
      makeSyncPayload({
        vehicleId: 'vehicle-2',
        isSold: false
      })
    );
    expect(updatedToAvailable.status).toBe('AVAILABLE');
  });

  it('lists available and sold vehicles sorted by price', async () => {
    await service.upsertVehicle(
      makeSyncPayload({
        vehicleId: 'vehicle-2',
        price: 100000
      })
    );
    await service.upsertVehicle(
      makeSyncPayload({
        vehicleId: 'vehicle-3',
        price: 280000,
        isSold: true
      })
    );

    const available = await service.listAvailableVehicles();
    const sold = await service.listSoldVehicles();

    expect(available.map((vehicle) => vehicle.vehicleId)).toEqual(['vehicle-2', 'vehicle-1']);
    expect(sold.map((vehicle) => vehicle.vehicleId)).toEqual(['vehicle-3']);
  });

  it('processes webhook without core sync configured', async () => {
    const inventory = new InMemoryVehicleInventoryRepository();
    const sales = new InMemorySalesRepository();
    const events = new InMemoryPaymentWebhookEventsRepository();
    const serviceWithoutCoreSync = new SalesService(inventory, sales, events);

    await inventory.save(
      VehicleInventory.create({
        vehicleId: 'vehicle-10',
        brand: 'Ford',
        model: 'Mustang Mach-E',
        year: 2024,
        color: 'Preto',
        price: 299000
      })
    );

    const { sale } = await serviceWithoutCoreSync.createSale({
      vehicleId: 'vehicle-10',
      buyerCpf: '10987654321'
    });

    const result = await serviceWithoutCoreSync.handlePaymentWebhook({
      paymentCode: sale.paymentCode,
      status: 'PAID'
    });

    expect(result.sale?.paymentStatus).toBe('PAID');
    expect(result.inventory?.status).toBe('SOLD');
  });
});
