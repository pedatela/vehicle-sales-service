import { SalesService } from '../services/sales.service';
import { InMemoryVehicleInventoryRepository } from '../../infra/repositories/in-memory/in-memory-vehicle-inventory.repository';
import { InMemorySalesRepository } from '../../infra/repositories/in-memory/in-memory-sales.repository';
import { InMemoryPaymentWebhookEventsRepository } from '../../infra/repositories/in-memory/in-memory-payment-webhook-events.repository';
import { HttpCoreSyncClient } from '../services/core-sync.client';
import { coreSyncConfig } from '../../config/core-sync';

let singleton: SalesService | null = null;

const createCoreSyncClient = () => {
  if (!coreSyncConfig.baseUrl) {
    return undefined;
  }

  return new HttpCoreSyncClient({
    baseUrl: coreSyncConfig.baseUrl,
    token: coreSyncConfig.token || undefined
  });
};

export const createSalesService = (): SalesService => {
  if (!singleton) {
    singleton = new SalesService(
      new InMemoryVehicleInventoryRepository(),
      new InMemorySalesRepository(),
      new InMemoryPaymentWebhookEventsRepository(),
      createCoreSyncClient()
    );
  }

  return singleton;
};
