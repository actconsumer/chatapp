/**
 * Azure Blob Storage Configuration
 * Handles media uploads (avatars, images, videos, documents)
 */

import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { logger } from '../../utils/logger';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface UploadOptions {
  fileName?: string;
  contentType?: string;
  metadata?: Record<string, string>;
  containerName?: string;
}

export interface UploadResult {
  url: string;
  blobName: string;
  containerName: string;
}

export class AzureBlobStorage {
  private static instance: AzureBlobStorage;
  private blobServiceClient: BlobServiceClient;
  private avatarsContainer: ContainerClient | null = null;
  private mediaContainer: ContainerClient | null = null;
  private documentsContainer: ContainerClient | null = null;

  private constructor() {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;
    
    if (!connectionString) {
      throw new Error('Azure Storage connection string not configured');
    }

    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  }

  public static getInstance(): AzureBlobStorage {
    if (!AzureBlobStorage.instance) {
      AzureBlobStorage.instance = new AzureBlobStorage();
    }
    return AzureBlobStorage.instance;
  }

  public async initialize(): Promise<void> {
    try {
      // Create containers if they don't exist
      const avatarsContainerName = process.env.BLOB_CONTAINER_AVATARS || 'avatars';
      const mediaContainerName = process.env.BLOB_CONTAINER_MEDIA || 'media';
      const documentsContainerName = process.env.BLOB_CONTAINER_DOCUMENTS || 'documents';

      this.avatarsContainer = this.blobServiceClient.getContainerClient(avatarsContainerName);
      await this.avatarsContainer.createIfNotExists({
        access: 'blob', // Public read access for avatars
      });

      this.mediaContainer = this.blobServiceClient.getContainerClient(mediaContainerName);
      await this.mediaContainer.createIfNotExists({
        access: 'blob', // Use 'blob' or 'container' for public access, omit for private
      });

      this.documentsContainer = this.blobServiceClient.getContainerClient(documentsContainerName);
      await this.documentsContainer.createIfNotExists({
        // Omit access property for private containers
      });

      logger.info('Azure Blob Storage initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Azure Blob Storage:', error);
      throw error;
    }
  }

  /**
   * Upload a file to blob storage
   */
  public async uploadFile(
    buffer: Buffer,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      const containerName = options.containerName || 'media';
      const container = this.getContainer(containerName);

      // Generate unique blob name
      const fileExtension = options.fileName 
        ? path.extname(options.fileName) 
        : '';
      const blobName = `${uuidv4()}${fileExtension}`;

      const blockBlobClient = container.getBlockBlobClient(blobName);

      // Upload with metadata
      const uploadOptions = {
        blobHTTPHeaders: {
          blobContentType: options.contentType || 'application/octet-stream',
        },
        metadata: options.metadata,
      };

      await blockBlobClient.upload(buffer, buffer.length, uploadOptions);

      const url = blockBlobClient.url;

      logger.info(`File uploaded successfully: ${blobName}`);

      return {
        url,
        blobName,
        containerName,
      };
    } catch (error) {
      logger.error('Failed to upload file to Blob Storage:', error);
      throw error;
    }
  }

  /**
   * Upload avatar (public access)
   */
  public async uploadAvatar(buffer: Buffer, userId: string): Promise<UploadResult> {
    const fileName = `avatar-${userId}-${Date.now()}.jpg`;
    return this.uploadFile(buffer, {
      fileName,
      contentType: 'image/jpeg',
      containerName: 'avatars',
      metadata: {
        userId,
        uploadedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Upload media (images, videos)
   */
  public async uploadMedia(
    buffer: Buffer,
    contentType: string,
    userId: string
  ): Promise<UploadResult> {
    return this.uploadFile(buffer, {
      contentType,
      containerName: 'media',
      metadata: {
        userId,
        uploadedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Generate SAS token for private blob access
   * @param containerName - Container name
   * @param blobName - Blob name
   * @param expiryMinutes - Token expiry time in minutes (default: 60)
   */
  public async generateSasUrl(
    containerName: string,
    blobName: string,
    expiryMinutes: number = 60
  ): Promise<string> {
    try {
      const container = this.getContainer(containerName);
      const blockBlobClient = container.getBlockBlobClient(blobName);

      // For production, implement proper SAS token generation
      // This is a simplified version
      // The expiryMinutes parameter will be used when implementing full SAS token generation
      logger.debug(`Generating SAS URL with ${expiryMinutes} minutes expiry`);
      
      const url = blockBlobClient.url;
      
      // In production, use:
      // const sasToken = generateBlobSASQueryParameters({
      //   expiresOn: new Date(Date.now() + expiryMinutes * 60 * 1000),
      //   permissions: BlobSASPermissions.parse("r"),
      //   containerName,
      //   blobName
      // }, sharedKeyCredential).toString();
      // return `${blockBlobClient.url}?${sasToken}`;

      return url;
    } catch (error) {
      logger.error('Failed to generate SAS URL:', error);
      throw error;
    }
  }

  /**
   * Delete a blob
   */
  public async deleteBlob(containerName: string, blobName: string): Promise<void> {
    try {
      const container = this.getContainer(containerName);
      const blockBlobClient = container.getBlockBlobClient(blobName);
      await blockBlobClient.deleteIfExists();
      logger.info(`Blob deleted: ${blobName}`);
    } catch (error) {
      logger.error('Failed to delete blob:', error);
      throw error;
    }
  }

  /**
   * Upload blob (simpler method)
   */
  public async uploadBlob(
    containerName: string,
    blobName: string,
    buffer: Buffer,
    contentType?: string
  ): Promise<string> {
    try {
      const container = this.getContainer(containerName);
      const blockBlobClient = container.getBlockBlobClient(blobName);

      await blockBlobClient.upload(buffer, buffer.length, {
        blobHTTPHeaders: {
          blobContentType: contentType || 'application/octet-stream',
        },
      });

      return blockBlobClient.url;
    } catch (error) {
      logger.error('Failed to upload blob:', error);
      throw error;
    }
  }

  /**
   * Check if blob exists
   */
  public async blobExists(containerName: string, blobName: string): Promise<boolean> {
    try {
      const container = this.getContainer(containerName);
      const blockBlobClient = container.getBlockBlobClient(blobName);
      return await blockBlobClient.exists();
    } catch (error) {
      logger.error('Failed to check blob existence:', error);
      return false;
    }
  }

  private getContainer(containerName: string): ContainerClient {
    switch (containerName) {
      case 'avatars':
        if (!this.avatarsContainer) throw new Error('Avatars container not initialized');
        return this.avatarsContainer;
      case 'media':
        if (!this.mediaContainer) throw new Error('Media container not initialized');
        return this.mediaContainer;
      case 'documents':
        if (!this.documentsContainer) throw new Error('Documents container not initialized');
        return this.documentsContainer;
      default:
        throw new Error(`Unknown container: ${containerName}`);
    }
  }
}

export const azureBlobStorage = AzureBlobStorage.getInstance();
