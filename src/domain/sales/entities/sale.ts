import { randomUUID } from 'crypto';

export type PaymentStatus = 'PENDING' | 'PAID' | 'CANCELED';

export type SaleAttributes = {
  vehicleId: string;
  buyerCpf: string;
  totalAmount: number;
  paymentCode?: string;
  paymentStatus?: PaymentStatus;
  saleDate?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

type SaleProps = SaleAttributes & {
  paymentCode: string;
  paymentStatus: PaymentStatus;
  saleDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export class Sale {
  private constructor(
    private readonly _id: string,
    private props: SaleProps
  ) {}

  static create(attrs: SaleAttributes, id: string = randomUUID()): Sale {
    const now = new Date();

    const props: SaleProps = {
      ...attrs,
      paymentCode: attrs.paymentCode ?? randomUUID(),
      paymentStatus: attrs.paymentStatus ?? 'PENDING',
      saleDate: attrs.saleDate ?? null,
      createdAt: attrs.createdAt ?? now,
      updatedAt: attrs.updatedAt ?? now
    };

    return new Sale(id, props);
  }

  get id(): string {
    return this._id;
  }

  get paymentCode(): string {
    return this.props.paymentCode;
  }

  get paymentStatus(): PaymentStatus {
    return this.props.paymentStatus;
  }

  get totalAmount(): number {
    return this.props.totalAmount;
  }

  get vehicleId(): string {
    return this.props.vehicleId;
  }

  get saleDate(): Date | null {
    return this.props.saleDate;
  }

  get buyerCpf(): string {
    return this.props.buyerCpf;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  markPaid(): void {
    this.props.paymentStatus = 'PAID';
    this.props.saleDate = new Date();
    this.touch();
  }

  markCanceled(): void {
    this.props.paymentStatus = 'CANCELED';
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      vehicleId: this.vehicleId,
      buyerCpf: this.buyerCpf,
      totalAmount: this.totalAmount,
      paymentCode: this.paymentCode,
      paymentStatus: this.paymentStatus,
      saleDate: this.saleDate?.toISOString() ?? null,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }
}
