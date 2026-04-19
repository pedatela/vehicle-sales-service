const { CORE_SERVICE_URL = '', CORE_SERVICE_TOKEN = '', INTERNAL_SYNC_TOKEN = '' } = process.env;

export const coreSyncConfig = {
  baseUrl: CORE_SERVICE_URL,
  token: CORE_SERVICE_TOKEN || INTERNAL_SYNC_TOKEN
};
