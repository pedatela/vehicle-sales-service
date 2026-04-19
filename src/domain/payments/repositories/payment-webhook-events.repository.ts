import { PaymentWebhookEvent } from '../entities/payment-webhook-event';

export interface PaymentWebhookEventsRepository {
  create(event: PaymentWebhookEvent): Promise<void>;
  list(): Promise<PaymentWebhookEvent[]>;
}
