import { URL } from 'node:url';
import { logger } from '../logger';
import {
  CoreSyncClientOptions,
  CoreSyncPort,
  CoreVehicleSaleStatusPayload
} from './interfaces/core-sync.interface';

type FetchFn = typeof fetch;

type HttpCoreSyncClientOptions = CoreSyncClientOptions & {
  fetchFn?: FetchFn | undefined;
};

export class HttpCoreSyncClient implements CoreSyncPort {
  private readonly fetchFn: FetchFn;

  constructor(private readonly options: HttpCoreSyncClientOptions) {
    this.fetchFn = options.fetchFn ?? fetch;

    if (!options.baseUrl) {
      logger.warn('[core-sync] base URL não configurada. Notificações desabilitadas.');
    }
  }

  async syncVehicleSaleStatus(payload: CoreVehicleSaleStatusPayload): Promise<void> {
    const url = this.buildUrl(`/internal/vehicles/${payload.vehicleId}/sale-status`);

    if (!url) {
      return;
    }

    const headers: Record<string, string> = {
      'content-type': 'application/json'
    };

    if (this.options.token) {
      headers['x-internal-token'] = this.options.token;
    }

    try {
      const response = await this.fetchFn(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          isSold: payload.isSold,
          buyerId: payload.buyerId,
          buyerEmail: payload.buyerEmail ?? null,
          buyerName: payload.buyerName ?? null
        })
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(`status=${response.status} body=${message}`);
      }

      logger.debug('[core-sync] status de venda sincronizado', {
        vehicleId: payload.vehicleId,
        isSold: payload.isSold
      });
    } catch (error) {
      logger.warn('[core-sync] falha ao sincronizar status no Core', {
        vehicleId: payload.vehicleId,
        isSold: payload.isSold,
        error: (error as Error).message
      });
    }
  }

  private buildUrl(path: string): URL | null {
    if (!this.options.baseUrl) {
      return null;
    }

    const trimmedPath = path.replace(/^\//, '');
    return new URL(trimmedPath, this.ensureTrailingSlash(this.options.baseUrl));
  }

  private ensureTrailingSlash(url: string): string {
    return url.endsWith('/') ? url : `${url}/`;
  }
}
