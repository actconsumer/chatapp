/**
 * Storage Controller
 * Production-grade Azure Blob Storage operations
 * Handles SAS token generation and blob management
 */

import { Request, Response, NextFunction } from 'express';
import { azureBlobStorage } from '../../infrastructure/storage/blob.config';
import { AppError } from '../middleware/error.middleware';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export class StorageController {
  /**
   * Generate SAS token for blob upload
   * POST /api/storage/sas-token
   */
  async generateSasToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new AppError('Unauthorized', 401);
      }

      const { containerName, blobName } = req.body;

      if (!containerName || !blobName) {
        throw new AppError('Container name and blob name are required', 400);
      }

      // Validate container name
      const allowedContainers = ['profiles', 'messages', 'groups', 'stories', 'media'];
      if (!allowedContainers.includes(containerName)) {
        throw new AppError('Invalid container name', 400);
      }

      // Generate unique blob name with user ID for security
      const fileExtension = path.extname(blobName);
      const uniqueBlobName = `${req.user.id}/${uuidv4()}${fileExtension}`;

      // Generate SAS URL (60 minutes expiry)
      const sasUrl = await azureBlobStorage.generateSasUrl(
        containerName === 'profiles' || containerName === 'groups' ? 'avatars' : 'media',
        uniqueBlobName,
        60
      );

      // Construct upload URL
      const container = azureBlobStorage['getContainer'](
        containerName === 'profiles' || containerName === 'groups' ? 'avatars' : 'media'
      );
      const blockBlobClient = container.getBlockBlobClient(uniqueBlobName);
      const blobUrl = blockBlobClient.url;

      res.json({
        success: true,
        data: {
          sasToken: sasUrl.split('?')[1] || '',
          blobUrl: blobUrl,
          uploadUrl: sasUrl,
          blobName: uniqueBlobName,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload file directly via backend
   * POST /api/storage/upload
   */
  async uploadFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new AppError('Unauthorized', 401);
      }

      if (!req.file) {
        throw new AppError('No file provided', 400);
      }

      const containerName = (req.body.containerName || 'media') as string;
      const allowedContainers = ['profiles', 'messages', 'groups', 'stories', 'media'];
      
      if (!allowedContainers.includes(containerName)) {
        throw new AppError('Invalid container name', 400);
      }

      // Map frontend container names to backend containers
      const backendContainer = containerName === 'profiles' || containerName === 'groups' 
        ? 'avatars' 
        : 'media';

      // Generate unique blob name
      const fileExtension = path.extname(req.file.originalname);
      const blobName = `${req.user.id}/${uuidv4()}${fileExtension}`;

      // Upload to blob storage
      const url = await azureBlobStorage.uploadBlob(
        backendContainer,
        blobName,
        req.file.buffer,
        req.file.mimetype
      );

      res.json({
        success: true,
        data: {
          url,
          blobName,
          contentType: req.file.mimetype,
          size: req.file.size,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a blob
   * DELETE /api/storage/delete
   */
  async deleteFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new AppError('Unauthorized', 401);
      }

      const { blobUrl } = req.body;

      if (!blobUrl) {
        throw new AppError('Blob URL is required', 400);
      }

      // Extract container and blob name from URL
      const urlParts = new URL(blobUrl);
      const pathParts = urlParts.pathname.split('/').filter(p => p);
      
      if (pathParts.length < 2) {
        throw new AppError('Invalid blob URL', 400);
      }

      const containerName = pathParts[0];
      const blobName = pathParts.slice(1).join('/');

      // Verify the blob belongs to the user
      if (!blobName.startsWith(req.user.id)) {
        throw new AppError('Not authorized to delete this file', 403);
      }

      await azureBlobStorage.deleteBlob(containerName, blobName);

      res.json({
        success: true,
        message: 'File deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if blob exists
   * GET /api/storage/exists
   */
  async blobExists(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new AppError('Unauthorized', 401);
      }

      const { containerName, blobName } = req.query;

      if (!containerName || !blobName) {
        throw new AppError('Container name and blob name are required', 400);
      }

      const exists = await azureBlobStorage.blobExists(
        containerName as string,
        blobName as string
      );

      res.json({
        success: true,
        data: { exists },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const storageController = new StorageController();
