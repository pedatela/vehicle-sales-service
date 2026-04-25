import { Pool } from 'pg';
import { PaymentWebhookEvent } from '../../../domain/payments/entities/payment-webhook-event';
import { PaymentWebhookEventsRepository } from '../../../domain/payments/repositories/payment-webhook-events.repository';
import { getPostgresPool } from '../../database/postgres';

type PaymentWebhookEventRow = {
  id: string;
  payment_code: string;
  status_received: string;
  payload: Record<string, unknown> | null;
  processed_at: Date | null;
  created_at: Date;
};

export class PostgresPaymentWebhookEventsRepository implements PaymentWebhookEventsRepository {
  private schemaReady: Promise<void> | null = null;

  constructor(private readonly pool: Pool = getPostgresPool()) {}

  async create(event: PaymentWebhookEvent): Promise<void> {
    await this.ensureSchemaReady();

    await this.pool.query(
      `
        INSERT INTO payment_webhook_events (
          id,
          payment_code,
          status_received,
          payload,
          processed_at
        )
        VALUES ($1, $2, $3, $4, $5)
      `,
      [
        event.id,
        event.paymentCode,
        event.statusReceived,
        event.payload ?? null,
        event.processedAt
      ]
    );
  }

  async list(): Promise<PaymentWebhookEvent[]> {
    await this.ensureSchemaReady();

    const { rows } = await this.pool.query<PaymentWebhookEventRow>(
      `
        SELECT
          id,
          payment_code,
          status_received,
          payload,
          processed_at,
          created_at
        FROM payment_webhook_events
        ORDER BY created_at ASC
      `
    );

    return rows.map((row) =>
      PaymentWebhookEvent.create(
        {
          paymentCode: row.payment_code,
          statusReceived: row.status_received,
          payload: row.payload ?? null,
          processedAt: row.processed_at ? new Date(row.processed_at) : null
        },
        row.id
      )
    );
  }

  private async ensureSchemaReady(): Promise<void> {
    if (!this.schemaReady) {
      this.schemaReady = this.createSchema();
    }

    await this.schemaReady;
  }

  private async createSchema(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS payment_webhook_events (
        id TEXT PRIMARY KEY,
        payment_code TEXT NOT NULL,
        status_received TEXT NOT NULL,
        payload JSONB NULL,
        processed_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }
}
