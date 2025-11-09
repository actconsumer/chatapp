import { Container, SqlParameter } from '@azure/cosmos';
import { ICallTelemetry } from '../../domain/entities/CallTelemetry';
import { cosmosDBClient } from '../database/cosmosdb.config';

export class CallTelemetryRepository {
  private readonly container: Container;

  constructor() {
    const container = cosmosDBClient.callTelemetryContainer;
    if (!container) {
      throw new Error('CallTelemetry container not initialized');
    }
    this.container = container;
  }

  async log(telemetry: ICallTelemetry): Promise<void> {
    await this.container.items.create(telemetry);
  }

  async getRecent(callId: string, limit = 20): Promise<ICallTelemetry[]> {
    const query = {
      query: 'SELECT * FROM c WHERE c.callId = @callId ORDER BY c.timestamp DESC OFFSET 0 LIMIT @limit',
      parameters: [
        { name: '@callId', value: callId } as SqlParameter,
        { name: '@limit', value: limit } as SqlParameter,
      ],
    };

    const { resources } = await this.container.items.query<ICallTelemetry>(query).fetchAll();
    return resources;
  }
}

export const callTelemetryRepository = new CallTelemetryRepository();
