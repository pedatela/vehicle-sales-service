import { SalesService } from '../services/sales.service';
import { InMemoryVehicleInventoryRepository } from '../../infra/repositories/in-memory/in-memory-vehicle-inventory.repository';
import { InMemorySalesRepository } from '../../infra/repositories/in-memory/in-memory-sales.repository';
import { InMemoryPaymentWebhookEventsRepository } from '../../infra/repositories/in-memory/in-memory-payment-webhook-events.repository';

let singleton: SalesService | null = null;

export const createSalesService = (): SalesService => {
  if (!singleton) {
    singleton = new SalesService(
      new InMemoryVehicleInventoryRepository(),
      new InMemorySalesRepository(),
      new InMemoryPaymentWebhookEventsRepository()
    );
  }

  return singleton;
};
