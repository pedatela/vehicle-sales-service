import { Pool } from 'pg';
import { VehicleInventory, VehicleStatus } from '../../../domain/inventory/entities/vehicle-inventory';
import { VehicleInventoryRepository } from '../../../domain/inventory/repositories/vehicle-inventory.repository';
import { getPostgresPool } from '../../database/postgres';

type VehicleInventoryRow = {
  id: string;
  vehicle_id: string;
  brand: string;
  model: string;
  version: string | null;
  year: number;
  color: string;
  price: string | number;
  status: VehicleStatus;
  created_at: Date;
  updated_at: Date;
};

export class PostgresVehicleInventoryRepository implements VehicleInventoryRepository {
  private schemaReady: Promise<void> | null = null;

  constructor(private readonly pool: Pool = getPostgresPool()) {}

  async listByStatus(status: VehicleStatus): Promise<VehicleInventory[]> {
    await this.ensureSchemaReady();

    const { rows } = await this.pool.query<VehicleInventoryRow>(
      `
        SELECT
          id,
          vehicle_id,
          brand,
          model,
          version,
          year,
          color,
          price,
          status,
          created_at,
          updated_at
        FROM vehicle_inventory
        WHERE status = $1
        ORDER BY price ASC
      `,
      [status]
    );

    return rows.map((row) => this.mapRowToEntity(row));
  }

  async findByVehicleId(vehicleId: string): Promise<VehicleInventory | null> {
    await this.ensureSchemaReady();

    const { rows } = await this.pool.query<VehicleInventoryRow>(
      `
        SELECT
          id,
          vehicle_id,
          brand,
          model,
          version,
          year,
          color,
          price,
          status,
          created_at,
          updated_at
        FROM vehicle_inventory
        WHERE vehicle_id = $1
        LIMIT 1
      `,
      [vehicleId]
    );

    const row = rows[0];
    return row ? this.mapRowToEntity(row) : null;
  }

  async save(vehicle: VehicleInventory): Promise<void> {
    await this.ensureSchemaReady();

    await this.pool.query(
      `
        INSERT INTO vehicle_inventory (
          id,
          vehicle_id,
          brand,
          model,
          version,
          year,
          color,
          price,
          status,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (vehicle_id)
        DO UPDATE
        SET
          id = EXCLUDED.id,
          brand = EXCLUDED.brand,
          model = EXCLUDED.model,
          version = EXCLUDED.version,
          year = EXCLUDED.year,
          color = EXCLUDED.color,
          price = EXCLUDED.price,
          status = EXCLUDED.status,
          updated_at = EXCLUDED.updated_at
      `,
      [
        vehicle.id,
        vehicle.vehicleId,
        vehicle.brand,
        vehicle.model,
        vehicle.version ?? null,
        vehicle.year,
        vehicle.color,
        vehicle.price,
        vehicle.status,
        vehicle.createdAt,
        vehicle.updatedAt
      ]
    );
  }

  async deleteByVehicleId(vehicleId: string): Promise<void> {
    await this.ensureSchemaReady();
    await this.pool.query(`DELETE FROM vehicle_inventory WHERE vehicle_id = $1`, [vehicleId]);
  }

  private async ensureSchemaReady(): Promise<void> {
    if (!this.schemaReady) {
      this.schemaReady = this.createSchema();
    }

    await this.schemaReady;
  }

  private async createSchema(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS vehicle_inventory (
        id TEXT PRIMARY KEY,
        vehicle_id TEXT NOT NULL UNIQUE,
        brand TEXT NOT NULL,
        model TEXT NOT NULL,
        version TEXT NULL,
        year INTEGER NOT NULL,
        color TEXT NOT NULL,
        price NUMERIC(12, 2) NOT NULL,
        status TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  private mapRowToEntity(row: VehicleInventoryRow): VehicleInventory {
    return VehicleInventory.create(
      {
        vehicleId: row.vehicle_id,
        brand: row.brand,
        model: row.model,
        version: row.version,
        year: row.year,
        color: row.color,
        price: Number(row.price),
        status: row.status,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      },
      row.id
    );
  }
}
