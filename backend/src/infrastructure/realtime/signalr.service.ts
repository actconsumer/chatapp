import crypto from 'crypto';
import axios, { AxiosInstance } from 'axios';
import { keyVaultService } from '../secrets/keyVault.service';
import { logger } from '../../utils/logger';

interface SignalRConnectionString {
  endpoint: string;
  accessKey: string;
  keyName?: string;
}

interface NegotiationResponse {
  url: string;
  accessToken: string;
}

export class SignalRService {
  private connection?: SignalRConnectionString;
  private axiosClient: AxiosInstance | null = null;

  constructor(private readonly hubName: string) {}

  private async ensureConnection(): Promise<void> {
    if (this.connection) {
      return;
    }

    const connectionString = await keyVaultService.getSecret('AZURE_SIGNALR_CONNECTION_STRING', process.env.AZURE_SIGNALR_CONNECTION_STRING);
    if (!connectionString) {
      throw new Error('SignalR connection string not configured');
    }

    const parts = connectionString.split(';');
    const map = parts.reduce<Record<string, string>>((acc, part) => {
      const [key, value] = part.split('=');
      if (key && value) {
        acc[key.toLowerCase()] = value;
      }
      return acc;
    }, {});

    if (!map['endpoint'] || !map['accesskey']) {
      throw new Error('Invalid SignalR connection string');
    }

    this.connection = {
      endpoint: map['endpoint'],
      accessKey: map['accesskey'],
      keyName: map['sharedaccesskeyname'] || map['keyname'],
    };

    this.axiosClient = axios.create({
      baseURL: `${this.connection.endpoint}/api/v1/hubs/${this.hubName}`,
      timeout: 5000,
    });
  }

  private generateAccessToken(resourceUri: string, expiresInSeconds: number = 3600): { token: string; expiresOn: number } {
    if (!this.connection) {
      throw new Error('SignalR connection is not initialized');
    }

    const expiry = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const toSign = `${resourceUri}\n${expiry}`;
    const key = Buffer.from(this.connection.accessKey, 'base64');
    const hmac = crypto.createHmac('sha256', key).update(toSign).digest('base64');

    const tokenParts = [
      `sr=${encodeURIComponent(resourceUri)}`,
      `sig=${encodeURIComponent(hmac)}`,
      `se=${expiry}`,
    ];

    if (this.connection.keyName) {
      tokenParts.push(`skn=${encodeURIComponent(this.connection.keyName)}`);
    }

    return {
      token: `SharedAccessSignature ${tokenParts.join('&')}`,
      expiresOn: expiry,
    };
  }

  async negotiate(userId: string): Promise<NegotiationResponse> {
    await this.ensureConnection();
    if (!this.connection) {
      throw new Error('SignalR connection is not initialized');
    }

    logger.debug(`[SignalR] Negotiating connection for user ${userId}`);

    const resourceUri = `${this.connection.endpoint}/client/?hub=${this.hubName}`;
    const { token } = this.generateAccessToken(resourceUri);

    return {
      url: resourceUri,
      accessToken: token,
    };
  }

  private async managementToken(path: string, expiresInSeconds = 600): Promise<string> {
    await this.ensureConnection();
    if (!this.connection) {
      throw new Error('SignalR connection is not initialized');
    }
    const resourceUri = `${this.connection.endpoint}${path}`;
    const { token } = this.generateAccessToken(resourceUri, expiresInSeconds);
    return token;
  }

  async sendToUser(userId: string, target: string, payload: unknown): Promise<void> {
    await this.ensureConnection();
    if (!this.axiosClient) {
      throw new Error('SignalR HTTP client not initialized');
    }
    const path = `/users/${encodeURIComponent(userId)}/:send`;
    const token = await this.managementToken(`/api/v1/hubs/${this.hubName}${path}`);

    try {
      await this.axiosClient.post(path, {
        target,
        arguments: [payload],
      }, {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      logger.error(`[SignalR] Failed to send to user ${userId}`, error);
    }
  }

  async sendToGroup(group: string, target: string, payload: unknown): Promise<void> {
    await this.ensureConnection();
    if (!this.axiosClient) {
      throw new Error('SignalR HTTP client not initialized');
    }
    const path = `/groups/${encodeURIComponent(group)}/:send`;
    const token = await this.managementToken(`/api/v1/hubs/${this.hubName}${path}`);

    try {
      await this.axiosClient.post(path, {
        target,
        arguments: [payload],
      }, {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      logger.error(`[SignalR] Failed to send to group ${group}`, error);
    }
  }
}

const hubName = process.env.AZURE_SIGNALR_HUB || 'realtime';
export const signalRService = new SignalRService(hubName);
