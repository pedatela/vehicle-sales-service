import { randomUUID } from 'crypto';

export type VehicleStatus = 'AVAILABLE' | 'PENDING_PAYMENT' | 'SOLD';

export type VehicleInventoryAttributes = {
  vehicleId: string;
  brand: string;
  model: string;
  version?: string | null | undefined;
  year: number;
  color: string;
  price: number;
  status?: VehicleStatus;
  createdAt?: Date;
  updatedAt?: Date;
};

type VehicleInventoryProps = VehicleInventoryAttributes & {
  status: VehicleStatus;
  createdAt: Date;
  updatedAt: Date;
};

export class VehicleInventory {
  private constructor(
    private readonly _id: string,
    private props: VehicleInventoryProps
  ) {}

  static create(attrs: VehicleInventoryAttributes, id: string = randomUUID()): VehicleInventory {
    const now = new Date();

    const props: VehicleInventoryProps = {
      ...attrs,
      version: attrs.version ?? null,
      status: attrs.status ?? 'AVAILABLE',
      createdAt: attrs.createdAt ?? now,
      updatedAt: attrs.updatedAt ?? now
    };

    return new VehicleInventory(id, props);
  }

  get id(): string {
    return this._id;
  }

  get vehicleId(): string {
    return this.props.vehicleId;
  }

  get status(): VehicleStatus {
    return this.props.status;
  }

  get price(): number {
    return this.props.price;
  }

  get brand(): string {
    return this.props.brand;
  }

  get model(): string {
    return this.props.model;
  }

  get version(): string | null | undefined {
    return this.props.version;
  }

  get year(): number {
    return this.props.year;
  }

  get color(): string {
    return this.props.color;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isAvailable(): boolean {
    return this.props.status === 'AVAILABLE';
  }

  markPendingPayment(): void {
    this.props.status = 'PENDING_PAYMENT';
    this.touch();
  }

  markAvailable(): void {
    this.props.status = 'AVAILABLE';
    this.touch();
  }

  markSold(): void {
    this.props.status = 'SOLD';
    this.touch();
  }

  update(attrs: Partial<Omit<VehicleInventoryAttributes, 'status'>>): void {
    const sanitized = Object.fromEntries(
      Object.entries(attrs).filter(([, value]) => value !== undefined)
    ) as Partial<VehicleInventoryAttributes>;

    this.props = {
      ...this.props,
      ...sanitized
    };

    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      vehicleId: this.vehicleId,
      brand: this.brand,
      model: this.model,
      version: this.version,
      year: this.year,
      color: this.color,
      price: this.price,
      status: this.status,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }
}
