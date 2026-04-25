import { Pool } from 'pg';
import { Sale, PaymentStatus } from '../../../domain/sales/entities/sale';
import { SalesRepository } from '../../../domain/sales/repositories/sales.repository';
import { getPostgresPool } from '../../database/postgres';

type SaleRow = {
  id: string;
  vehicle_id: string;
  buyer_cpf: string;
  buyer_email: string | null;
  buyer_name: string | null;
  total_amount: string | number;
  payment_code: string;
  payment_status: PaymentStatus;
  sale_date: Date | null;
  created_at: Date;
  updated_at: Date;
};

export class PostgresSalesRepository implements SalesRepository {
  private schemaReady: Promise<void> | null = null;

  constructor(private readonly pool: Pool = getPostgresPool()) {}

  async create(sale: Sale): Promise<void> {
    await this.ensureSchemaReady();

    await this.pool.query(
      `
        INSERT INTO sales (
          id,
          vehicle_id,
          buyer_cpf,
          buyer_email,
          buyer_name,
          total_amount,
          payment_code,
          payment_status,
          sale_date,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `,
      [
        sale.id,
        sale.vehicleId,
        sale.buyerCpf,
        sale.buyerEmail,
        sale.buyerName,
        sale.totalAmount,
        sale.paymentCode,
        sale.paymentStatus,
        sale.saleDate,
        sale.createdAt,
        sale.updatedAt
      ]
    );
  }

  async findByPaymentCode(paymentCode: string): Promise<Sale | null> {
    await this.ensureSchemaReady();

    const { rows } = await this.pool.query<SaleRow>(
      `
        SELECT
          id,
          vehicle_id,
          buyer_cpf,
          buyer_email,
          buyer_name,
          total_amount,
          payment_code,
          payment_status,
          sale_date,
          created_at,
          updated_at
        FROM sales
        WHERE payment_code = $1
        LIMIT 1
      `,
      [paymentCode]
    );

    const row = rows[0];
    return row ? this.mapRowToEntity(row) : null;
  }

  async findByVehicleId(vehicleId: string): Promise<Sale | null> {
    await this.ensureSchemaReady();

    const { rows } = await this.pool.query<SaleRow>(
      `
        SELECT
          id,
          vehicle_id,
          buyer_cpf,
          buyer_email,
          buyer_name,
          total_amount,
          payment_code,
          payment_status,
          sale_date,
          created_at,
          updated_at
        FROM sales
        WHERE vehicle_id = $1
        LIMIT 1
      `,
      [vehicleId]
    );

    const row = rows[0];
    return row ? this.mapRowToEntity(row) : null;
  }

  async update(sale: Sale): Promise<void> {
    await this.ensureSchemaReady();

    await this.pool.query(
      `
        INSERT INTO sales (
          id,
          vehicle_id,
          buyer_cpf,
          buyer_email,
          buyer_name,
          total_amount,
          payment_code,
          payment_status,
          sale_date,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id)
        DO UPDATE
        SET
          vehicle_id = EXCLUDED.vehicle_id,
          buyer_cpf = EXCLUDED.buyer_cpf,
          buyer_email = EXCLUDED.buyer_email,
          buyer_name = EXCLUDED.buyer_name,
          total_amount = EXCLUDED.total_amount,
          payment_code = EXCLUDED.payment_code,
          payment_status = EXCLUDED.payment_status,
          sale_date = EXCLUDED.sale_date,
          updated_at = EXCLUDED.updated_at
      `,
      [
        sale.id,
        sale.vehicleId,
        sale.buyerCpf,
        sale.buyerEmail,
        sale.buyerName,
        sale.totalAmount,
        sale.paymentCode,
        sale.paymentStatus,
        sale.saleDate,
        sale.createdAt,
        sale.updatedAt
      ]
    );
  }

  async list(): Promise<Sale[]> {
    await this.ensureSchemaReady();

    const { rows } = await this.pool.query<SaleRow>(
      `
        SELECT
          id,
          vehicle_id,
          buyer_cpf,
          buyer_email,
          buyer_name,
          total_amount,
          payment_code,
          payment_status,
          sale_date,
          created_at,
          updated_at
        FROM sales
        ORDER BY created_at ASC
      `
    );

    return rows.map((row) => this.mapRowToEntity(row));
  }

  private async ensureSchemaReady(): Promise<void> {
    if (!this.schemaReady) {
      this.schemaReady = this.createSchema();
    }

    await this.schemaReady;
  }

  private async createSchema(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id TEXT PRIMARY KEY,
        vehicle_id TEXT NOT NULL UNIQUE,
        buyer_cpf TEXT NOT NULL,
        buyer_email TEXT NULL,
        buyer_name TEXT NULL,
        total_amount NUMERIC(12, 2) NOT NULL,
        payment_code TEXT NOT NULL UNIQUE,
        payment_status TEXT NOT NULL,
        sale_date TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  private mapRowToEntity(row: SaleRow): Sale {
    return Sale.create(
      {
        vehicleId: row.vehicle_id,
        buyerCpf: row.buyer_cpf,
        buyerEmail: row.buyer_email,
        buyerName: row.buyer_name,
        totalAmount: Number(row.total_amount),
        paymentCode: row.payment_code,
        paymentStatus: row.payment_status,
        saleDate: row.sale_date ? new Date(row.sale_date) : null,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      },
      row.id
    );
  }
}
