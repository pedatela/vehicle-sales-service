import { SalesService } from '../services/sales.service';
import { InMemoryVehicleInventoryRepository } from '../../infra/repositories/in-memory/in-memory-vehicle-inventory.repository';
import { InMemorySalesRepository } from '../../infra/repositories/in-memory/in-memory-sales.repository';
import { InMemoryPaymentWebhookEventsRepository } from '../../infra/repositories/in-memory/in-memory-payment-webhook-events.repository';
import { PostgresVehicleInventoryRepository } from '../../infra/repositories/postgres/postgres-vehicle-inventory.repository';
import { PostgresSalesRepository } from '../../infra/repositories/postgres/postgres-sales.repository';
import { PostgresPaymentWebhookEventsRepository } from '../../infra/repositories/postgres/postgres-payment-webhook-events.repository';
import { HttpCoreSyncClient } from '../services/core-sync.client';
import { coreSyncConfig } from '../../config/core-sync';
import { databaseConfig } from '../../config/database';

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

const createRepositories = () => {
  if (databaseConfig.enabled) {
    return {
      inventoryRepository: new PostgresVehicleInventoryRepository(),
      salesRepository: new PostgresSalesRepository(),
      eventsRepository: new PostgresPaymentWebhookEventsRepository()
    };
  }

  return {
    inventoryRepository: new InMemoryVehicleInventoryRepository(),
    salesRepository: new InMemorySalesRepository(),
    eventsRepository: new InMemoryPaymentWebhookEventsRepository()
  };
};

export const createSalesService = (): SalesService => {
  if (!singleton) {
    const repositories = createRepositories();

    singleton = new SalesService(
      repositories.inventoryRepository,
      repositories.salesRepository,
      repositories.eventsRepository,
      createCoreSyncClient()
    );
  }

  return singleton;
};
