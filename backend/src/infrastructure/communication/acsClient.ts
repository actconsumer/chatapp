import { CommunicationIdentityClient } from '@azure/communication-identity';
import { keyVaultService } from '../secrets/keyVault.service';
import { communicationIdentityRepository, ICommunicationIdentity } from '../repositories/CommunicationIdentityRepository';
import { logger } from '../../utils/logger';

const TOKEN_REFRESH_BUFFER = 60 * 5; // 5 minutes

class AzureCommunicationService {
  private client: CommunicationIdentityClient | null = null;
  private initializationPromise: Promise<void> | null = null;

  private async ensureClient(): Promise<void> {
    if (this.client) {
      return;
    }

    if (this.initializationPromise) {
      await this.initializationPromise;
      return;
    }

    this.initializationPromise = (async () => {
      const connectionString = await keyVaultService.getSecret('ACS_CONNECTION_STRING', process.env.ACS_CONNECTION_STRING);
      if (!connectionString) {
        throw new Error('Azure Communication Services connection string not configured');
      }

      this.client = new CommunicationIdentityClient(connectionString);
      logger.info('[ACS] Communication Identity client initialized');
    })();

    try {
      await this.initializationPromise;
    } finally {
      this.initializationPromise = null;
    }
  }

  private isTokenValid(identity?: ICommunicationIdentity | null): boolean {
    if (!identity?.token || !identity.expiresOn) {
      return false;
    }

    const expiry = Math.floor(new Date(identity.expiresOn).getTime() / 1000);
    const now = Math.floor(Date.now() / 1000);
    return expiry - now > TOKEN_REFRESH_BUFFER;
  }

  async issueToken(userId: string): Promise<{ token: string; userId: string; expiresOn: string; acsUserId: string }> {
    await this.ensureClient();

    const existing = await communicationIdentityRepository.findByUserId(userId);
    if (existing && this.isTokenValid(existing)) {
      return {
        token: existing.token!,
        userId: existing.userId,
        expiresOn: existing.expiresOn!,
        acsUserId: existing.acsUserId,
      };
    }

    if (!this.client) {
      throw new Error('Failed to initialize ACS client');
    }

    let acsUserId: string;
    if (existing?.acsUserId) {
      acsUserId = existing.acsUserId;
    } else {
      const identityResponse = await this.client.createUser();
      acsUserId = identityResponse.communicationUserId;
    }

    const tokenResponse = await this.client.getToken({ communicationUserId: acsUserId }, ['voip']);

    const payload: ICommunicationIdentity = {
      id: userId,
      userId,
      acsUserId,
      token: tokenResponse.token,
      expiresOn: tokenResponse.expiresOn.toISOString(),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await communicationIdentityRepository.upsert(payload);

    logger.debug(`[ACS] Issued token for user ${userId}`);

    return {
      token: tokenResponse.token,
      userId,
      expiresOn: tokenResponse.expiresOn.toISOString(),
      acsUserId,
    };
  }
}

export const azureCommunicationService = new AzureCommunicationService();
