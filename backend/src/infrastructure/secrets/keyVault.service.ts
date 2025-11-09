import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import { logger } from '../../utils/logger';

export class KeyVaultService {
  private client: SecretClient | null = null;
  private readonly cache = new Map<string, string>();
  private readonly vaultUrl?: string;
  private initializationAttempted = false;

  constructor(vaultUrl?: string) {
    this.vaultUrl = vaultUrl;
  }

  initialize(): void {
    if (!this.vaultUrl) {
      logger.warn('[KeyVaultService] Vault URL not provided; falling back to environment variables');
      return;
    }

    if (this.client) {
      return;
    }

    if (this.initializationAttempted) {
      return;
    }

    this.initializationAttempted = true;

    try {
      const credential = new DefaultAzureCredential();

      this.client = new SecretClient(this.vaultUrl, credential);
      logger.info('[KeyVaultService] Initialized secret client');
    } catch (error) {
      logger.error('[KeyVaultService] Failed to initialize', error);
      this.client = null;
      this.initializationAttempted = false;
    }
  }

  async getSecret(name: string, fallback?: string): Promise<string | undefined> {
    if (this.cache.has(name)) {
      return this.cache.get(name);
    }

    if (!this.client && this.vaultUrl) {
      this.initialize();
    }

    if (!this.client) {
      const value = process.env[name] ?? fallback;
      if (value) {
        this.cache.set(name, value);
      }
      return value;
    }

    try {
      const response = await this.client.getSecret(name);
      if (response.value) {
        this.cache.set(name, response.value);
        return response.value;
      }
    } catch (error) {
      logger.warn(`[KeyVaultService] Unable to fetch secret ${name} from Key Vault`, error);
    }

    const envValue = process.env[name] ?? fallback;
    if (envValue) {
      this.cache.set(name, envValue);
    }
    return envValue;
  }
}

const keyVaultUrl = process.env.AZURE_KEY_VAULT_URL;
export const keyVaultService = new KeyVaultService(keyVaultUrl);
keyVaultService.initialize();
