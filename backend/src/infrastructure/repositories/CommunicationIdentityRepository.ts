import { Container } from '@azure/cosmos';
import { cosmosDBClient } from '../database/cosmosdb.config';

export interface ICommunicationIdentity {
  id: string;
  userId: string;
  acsUserId: string;
  token?: string;
  expiresOn?: string;
  createdAt: string;
  updatedAt: string;
}

export class CommunicationIdentityRepository {
  private readonly container: Container;

  constructor() {
    const container = cosmosDBClient.communicationIdentitiesContainer;
    if (!container) {
      throw new Error('CommunicationIdentities container not initialized');
    }
    this.container = container;
  }

  async findByUserId(userId: string): Promise<ICommunicationIdentity | null> {
    try {
      const { resource } = await this.container.item(userId, userId).read<ICommunicationIdentity>();
      return resource ?? null;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  async upsert(identity: ICommunicationIdentity): Promise<ICommunicationIdentity> {
    const { resource } = await this.container.items.upsert(identity);
    return resource as unknown as ICommunicationIdentity;
  }
}

export const communicationIdentityRepository = new CommunicationIdentityRepository();
