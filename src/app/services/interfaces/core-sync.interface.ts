export type CoreVehicleSaleStatusPayload = {
  vehicleId: string;
  isSold: boolean;
  buyerId: string | null;
};

export type CoreSyncClientOptions = {
  baseUrl?: string | undefined;
  token?: string | undefined;
};

export interface CoreSyncPort {
  syncVehicleSaleStatus(payload: CoreVehicleSaleStatusPayload): Promise<void>;
}
