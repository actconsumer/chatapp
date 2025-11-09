/**
 * Azure Cosmos DB Configuration
 * Sets up connection to Cosmos DB with partitioning and indexing strategies
 */

import { CosmosClient, Database, Container } from '@azure/cosmos';
import { logger } from '../../utils/logger';

export class CosmosDBClient {
  private static instance: CosmosDBClient;
  private client: CosmosClient;
  private database: Database | null = null;

  // Container references
  public usersContainer: Container | null = null;
  public chatsContainer: Container | null = null;
  public messagesContainer: Container | null = null;
  public storiesContainer: Container | null = null;
  public otpContainer: Container | null = null;
  public callsContainer: Container | null = null;
  public callSettingsContainer: Container | null = null;
  public callTelemetryContainer: Container | null = null;
  public communicationIdentitiesContainer: Container | null = null;

  private constructor() {
    const endpoint = process.env.COSMOS_ENDPOINT!;
    const key = process.env.COSMOS_KEY!;

    this.client = new CosmosClient({
      endpoint,
      key,
      connectionPolicy: {
        requestTimeout: 10000,
        enableEndpointDiscovery: true,
      },
    });
  }

  public static getInstance(): CosmosDBClient {
    if (!CosmosDBClient.instance) {
      CosmosDBClient.instance = new CosmosDBClient();
    }
    return CosmosDBClient.instance;
  }

  public async initialize(): Promise<void> {
    try {
      const databaseName = process.env.COSMOS_DATABASE_NAME || 'ProjectChatDB';

      // Create database if it doesn't exist
      const { database } = await this.client.databases.createIfNotExists({
        id: databaseName,
        throughput: 400, // Start with 400 RU/s, can scale up
      });

      this.database = database;
      logger.info(`Connected to Cosmos DB: ${databaseName}`);

      // Initialize containers
      await this.initializeContainers();
    } catch (error) {
      logger.error('Failed to initialize Cosmos DB:', error);
      throw error;
    }
  }

  private async initializeContainers(): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    // Users Container
    const { container: usersContainer } = await this.database.containers.createIfNotExists({
      id: 'Users',
      partitionKey: { paths: ['/id'] },
      indexingPolicy: {
        automatic: true,
        indexingMode: 'consistent',
        includedPaths: [{ path: '/*' }],
        excludedPaths: [{ path: '/_etag/?' }],
        compositeIndexes: [
          [
            { path: '/email', order: 'ascending' },
            { path: '/createdAt', order: 'descending' },
          ],
        ],
      },
      uniqueKeyPolicy: {
        uniqueKeys: [{ paths: ['/email'] }, { paths: ['/username'] }],
      },
    });
    this.usersContainer = usersContainer;

    // Chats Container
    const { container: chatsContainer } = await this.database.containers.createIfNotExists({
      id: 'Chats',
      partitionKey: { paths: ['/id'] },
      indexingPolicy: {
        automatic: true,
        indexingMode: 'consistent',
        includedPaths: [{ path: '/*' }],
        compositeIndexes: [
          [
            { path: '/participants/userId', order: 'ascending' },
            { path: '/updatedAt', order: 'descending' },
          ],
        ],
      },
    });
    this.chatsContainer = chatsContainer;

    // Messages Container (Partitioned by chatId for better performance)
    const { container: messagesContainer } = await this.database.containers.createIfNotExists({
      id: 'Messages',
      partitionKey: { paths: ['/chatId'] },
      indexingPolicy: {
        automatic: true,
        indexingMode: 'consistent',
        includedPaths: [{ path: '/*' }],
        compositeIndexes: [
          [
            { path: '/chatId', order: 'ascending' },
            { path: '/timestamp', order: 'descending' },
          ],
          [
            { path: '/chatId', order: 'ascending' },
            { path: '/status', order: 'ascending' },
          ],
        ],
      },
    });
    this.messagesContainer = messagesContainer;

    // Stories Container
    const { container: storiesContainer } = await this.database.containers.createIfNotExists({
      id: 'Stories',
      partitionKey: { paths: ['/userId'] },
      indexingPolicy: {
        automatic: true,
        indexingMode: 'consistent',
        compositeIndexes: [
          [
            { path: '/userId', order: 'ascending' },
            { path: '/createdAt', order: 'descending' },
          ],
          [
            { path: '/isActive', order: 'ascending' },
            { path: '/expiresAt', order: 'ascending' },
          ],
        ],
      },
      defaultTtl: 86400, // Auto-delete after 24 hours
    });
    this.storiesContainer = storiesContainer;

    // OTP Container
    const { container: otpContainer } = await this.database.containers.createIfNotExists({
      id: 'OTPs',
      partitionKey: { paths: ['/email'] },
      indexingPolicy: {
        automatic: true,
        indexingMode: 'consistent',
        compositeIndexes: [
          [
            { path: '/email', order: 'ascending' },
            { path: '/purpose', order: 'ascending' },
          ],
        ],
      },
      defaultTtl: 600, // Auto-delete after 10 minutes
    });
    this.otpContainer = otpContainer;

    // Calls Container
    const { container: callsContainer } = await this.database.containers.createIfNotExists({
      id: 'Calls',
      partitionKey: { paths: ['/id'] },
      indexingPolicy: {
        automatic: true,
        indexingMode: 'consistent',
        includedPaths: [{ path: '/*' }],
        compositeIndexes: [
          [
            { path: '/initiatorId', order: 'ascending' },
            { path: '/createdAt', order: 'descending' },
          ],
        ],
      },
    });
    this.callsContainer = callsContainer;

    // Call Settings Container (partitioned by user)
    const { container: callSettingsContainer } = await this.database.containers.createIfNotExists({
      id: 'CallSettings',
      partitionKey: { paths: ['/userId'] },
      indexingPolicy: {
        automatic: true,
        indexingMode: 'consistent',
      },
    });
    this.callSettingsContainer = callSettingsContainer;

    // Call Telemetry Container
    const { container: callTelemetryContainer } = await this.database.containers.createIfNotExists({
      id: 'CallTelemetry',
      partitionKey: { paths: ['/callId'] },
      indexingPolicy: {
        automatic: true,
        indexingMode: 'consistent',
        compositeIndexes: [
          [
            { path: '/callId', order: 'ascending' },
            { path: '/timestamp', order: 'descending' },
          ],
        ],
      },
      defaultTtl: 60 * 60 * 24 * 7, // retain for 7 days by default
    });
    this.callTelemetryContainer = callTelemetryContainer;

    // Communication Identities mapping container
    const { container: communicationIdentitiesContainer } = await this.database.containers.createIfNotExists({
      id: 'CommunicationIdentities',
      partitionKey: { paths: ['/userId'] },
      indexingPolicy: {
        automatic: true,
        indexingMode: 'consistent',
      },
    });
    this.communicationIdentitiesContainer = communicationIdentitiesContainer;

    // Devices Container
    await this.database.containers.createIfNotExists({
      id: 'Devices',
      partitionKey: { paths: ['/userId'] },
      indexingPolicy: {
        automatic: true,
        indexingMode: 'consistent',
        compositeIndexes: [
          [
            { path: '/userId', order: 'ascending' },
            { path: '/lastActiveAt', order: 'descending' },
          ],
        ],
      },
    });
    // Store reference if needed

    // Notifications Container
    await this.database.containers.createIfNotExists({
      id: 'Notifications',
      partitionKey: { paths: ['/userId'] },
      indexingPolicy: {
        automatic: true,
        indexingMode: 'consistent',
        compositeIndexes: [
          [
            { path: '/userId', order: 'ascending' },
            { path: '/createdAt', order: 'descending' },
          ],
          [
            { path: '/userId', order: 'ascending' },
            { path: '/isRead', order: 'ascending' },
          ],
        ],
      },
    });
    // Store reference if needed

    // Friends Container
    await this.database.containers.createIfNotExists({
      id: 'Friends',
      partitionKey: { paths: ['/userId'] },
      indexingPolicy: {
        automatic: true,
        indexingMode: 'consistent',
        compositeIndexes: [
          [
            { path: '/userId', order: 'ascending' },
            { path: '/isBlocked', order: 'ascending' },
          ],
        ],
      },
    });
    // Store reference if needed

    // Security PINs Container
    await this.database.containers.createIfNotExists({
      id: 'SecurityPins',
      partitionKey: { paths: ['/userId'] },
      indexingPolicy: {
        automatic: true,
        indexingMode: 'consistent',
      },
    });
    // Store reference if needed

    logger.info('All Cosmos DB containers initialized');
  }

  public getDatabase(): Database {
    if (!this.database) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.database;
  }

  /**
   * Get item by ID from a container
   */
  public async getItem<T = any>(containerName: string, id: string): Promise<T | null> {
    try {
      const container = this.getContainerByName(containerName);
      const { resource } = await container.item(id, id).read();
      return (resource as T) || null;
    } catch (error: any) {
      if (error.code === 404) return null;
      throw error;
    }
  }

  /**
   * Upsert (create or update) an item in a container
   */
  public async upsertItem<T = any>(containerName: string, item: any): Promise<T> {
    const container = this.getContainerByName(containerName);
    const { resource } = await container.items.upsert(item);
    return resource as T;
  }

  /**
   * Delete an item from a container
   */
  public async deleteItem(containerName: string, id: string): Promise<void> {
    const container = this.getContainerByName(containerName);
    await container.item(id, id).delete();
  }

  /**
   * Query items in a container
   */
  public async queryItems<T = any>(
    containerName: string,
    query: string,
    parameters?: Record<string, any>
  ): Promise<T[]> {
    const container = this.getContainerByName(containerName);
    
    const querySpec = {
      query,
      parameters: parameters 
        ? Object.entries(parameters).map(([name, value]) => ({ name: `@${name}`, value }))
        : [],
    };

    const { resources } = await container.items.query(querySpec).fetchAll();
    return resources as T[];
  }

  /**
   * Get container by name
   */
  private getContainerByName(name: string): Container {
    const containerMap: Record<string, Container | null> = {
      users: this.usersContainer,
      chats: this.chatsContainer,
      messages: this.messagesContainer,
      stories: this.storiesContainer,
      otps: this.otpContainer,
      devices: this.database?.container('Devices') || null,
      notifications: this.database?.container('Notifications') || null,
      friends: this.database?.container('Friends') || null,
      securitypins: this.database?.container('SecurityPins') || null,
      calls: this.callsContainer,
      callsettings: this.callSettingsContainer,
      calltelemetry: this.callTelemetryContainer,
      communicationidentities: this.communicationIdentitiesContainer,
    };

    const container = containerMap[name.toLowerCase()];
    if (!container) {
      throw new Error(`Container '${name}' not found or not initialized`);
    }
    return container;
  }

  public async close(): Promise<void> {
    // Cosmos DB client doesn't need explicit closing
    logger.info('Cosmos DB connection closed');
  }
}

export const cosmosDBClient = CosmosDBClient.getInstance();
