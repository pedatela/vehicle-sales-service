import { PaymentWebhookEvent } from '../../../domain/payments/entities/payment-webhook-event';
import { PaymentWebhookEventsRepository } from '../../../domain/payments/repositories/payment-webhook-events.repository';

export class InMemoryPaymentWebhookEventsRepository implements PaymentWebhookEventsRepository {
  private readonly items: PaymentWebhookEvent[] = [];

  async create(event: PaymentWebhookEvent): Promise<void> {
    this.items.push(event);
  }

  async list(): Promise<PaymentWebhookEvent[]> {
    return [...this.items];
  }
}
