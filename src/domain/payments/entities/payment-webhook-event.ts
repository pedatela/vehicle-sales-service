import { randomUUID } from 'crypto';

export type PaymentWebhookEventAttributes = {
  paymentCode: string;
  statusReceived: string;
  payload?: Record<string, unknown> | null;
  processedAt?: Date | null;
};

type PaymentWebhookEventProps = PaymentWebhookEventAttributes & {
  processedAt: Date | null;
};

export class PaymentWebhookEvent {
  private constructor(
    private readonly _id: string,
    private props: PaymentWebhookEventProps
  ) {}

  static create(attrs: PaymentWebhookEventAttributes, id: string = randomUUID()): PaymentWebhookEvent {
    const props: PaymentWebhookEventProps = {
      ...attrs,
      processedAt: attrs.processedAt ?? null
    };

    return new PaymentWebhookEvent(id, props);
  }

  get id(): string {
    return this._id;
  }

  get paymentCode(): string {
    return this.props.paymentCode;
  }

  get statusReceived(): string {
    return this.props.statusReceived;
  }

  get processedAt(): Date | null {
    return this.props.processedAt;
  }

  get payload(): Record<string, unknown> | null | undefined {
    return this.props.payload;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      paymentCode: this.paymentCode,
      statusReceived: this.statusReceived,
      processedAt: this.processedAt?.toISOString() ?? null
    };
  }
}
