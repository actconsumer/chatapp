import { Container, SqlParameter } from '@azure/cosmos';
import { ICall } from '../../domain/entities/Call';
import { cosmosDBClient } from '../database/cosmosdb.config';
import { logger } from '../../utils/logger';

export class CallRepository {
  private readonly container: Container;

  constructor() {
    const container = cosmosDBClient.callsContainer;
    if (!container) {
      throw new Error('Calls container not initialized');
    }
    this.container = container;
  }

  async create(call: ICall): Promise<ICall> {
  const { resource } = await this.container.items.create(call);
  logger.debug(`[CallRepository] Created call ${resource?.id}`);
  return resource as unknown as ICall;
  }

  async upsert(call: ICall): Promise<ICall> {
  const { resource } = await this.container.items.upsert(call);
  logger.debug(`[CallRepository] Upserted call ${resource?.id}`);
  return resource as unknown as ICall;
  }

  async findById(callId: string): Promise<ICall | null> {
    try {
      const { resource } = await this.container.item(callId, callId).read<ICall>();
      return resource ?? null;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  async findActiveCallByUser(userId: string): Promise<ICall | null> {
    const query = {
      query: `SELECT * FROM c WHERE ARRAY_CONTAINS(c.targetUserIds, @userId) OR ARRAY_CONTAINS(c.participants, { "userId": @userId }, true)`,
      parameters: [{ name: '@userId', value: userId } as SqlParameter],
    };

    const { resources } = await this.container.items.query<ICall>(query).fetchAll();
    const active = resources.find((call) => ['ringing', 'ongoing'].includes(call.status));
    return active ?? null;
  }

  async findLatestByChat(chatId: string): Promise<ICall | null> {
    const query = {
      query: `SELECT TOP 1 * FROM c WHERE c.chatId = @chatId ORDER BY c.createdAt DESC`,
      parameters: [{ name: '@chatId', value: chatId } as SqlParameter],
    };

    const { resources } = await this.container.items.query<ICall>(query).fetchAll();
    return resources[0] ?? null;
  }

  async getUserHistory(userId: string, limit = 50, offset = 0): Promise<ICall[]> {
    const query = {
      query: `SELECT * FROM c WHERE (ARRAY_CONTAINS(c.targetUserIds, @userId) OR ARRAY_CONTAINS(c.participants, { "userId": @userId }, true)) ORDER BY c.createdAt DESC OFFSET @offset LIMIT @limit`,
      parameters: [
        { name: '@userId', value: userId } as SqlParameter,
        { name: '@limit', value: limit } as SqlParameter,
        { name: '@offset', value: offset } as SqlParameter,
      ],
    };

    const { resources } = await this.container.items.query<ICall>(query).fetchAll();
    return resources;
  }

  async delete(callId: string): Promise<void> {
    await this.container.item(callId, callId).delete();
  }
}

export const callRepository = new CallRepository();
