import { Container } from '@azure/cosmos';
import { ICallSettings, createDefaultCallSettings } from '../../domain/entities/CallSettings';
import { cosmosDBClient } from '../database/cosmosdb.config';

export class CallSettingsRepository {
  private readonly container: Container;

  constructor() {
    const container = cosmosDBClient.callSettingsContainer;
    if (!container) {
      throw new Error('CallSettings container not initialized');
    }
    this.container = container;
  }

  async getByUserId(userId: string): Promise<ICallSettings | null> {
    try {
      const id = `settings-${userId}`;
      const { resource } = await this.container.item(id, userId).read<ICallSettings>();
      return resource ?? null;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  async upsert(settings: ICallSettings): Promise<ICallSettings> {
    const { resource } = await this.container.items.upsert(settings);
    return resource as unknown as ICallSettings;
  }

  async ensureDefault(userId: string): Promise<ICallSettings> {
    const existing = await this.getByUserId(userId);
    if (existing) {
      return existing;
    }

    const defaults = createDefaultCallSettings(userId);
    return this.upsert(defaults);
  }
}

export const callSettingsRepository = new CallSettingsRepository();
