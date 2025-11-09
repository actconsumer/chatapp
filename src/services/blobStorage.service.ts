/**
 * Azure Blob Storage Service
 * Handles file uploads to Azure Blob Storage for profile photos, media attachments, etc.
 */

import axios from 'axios';
import { buildApiUrl } from './config';
import { getAuthHeaders } from './apiHelper';

export interface UploadResult {
  url: string;
  blobName: string;
  contentType: string;
  size: number;
}

export interface UploadOptions {
  uri: string;
  fileName: string;
  fileType: string;
  containerName?: 'profiles' | 'messages' | 'groups' | 'stories';
}

class BlobStorageService {
  /**
   * Upload a file to Azure Blob Storage
   * This method handles the entire upload process:
   * 1. Request a SAS token from backend
   * 2. Upload file directly to Azure Blob Storage using the SAS token
   * 3. Return the public URL
   */
  async uploadFile(options: UploadOptions): Promise<UploadResult> {
    const { uri, fileName, fileType, containerName = 'messages' } = options;

    try {
      // Step 1: Request SAS token from backend
      const sasUrl = buildApiUrl('/storage/sas-token');
      const headers = await getAuthHeaders();
      
      const sasResponse = await axios.post(
        sasUrl,
        {
          containerName,
          blobName: fileName,
          contentType: fileType,
        },
        { headers }
      );

      const { sasToken, blobUrl, uploadUrl } = sasResponse.data.data;

      // Step 2: Upload file to Azure Blob Storage
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: fileName,
        type: fileType,
      } as any);

      const uploadResponse = await axios.put(uploadUrl || blobUrl, formData, {
        headers: {
          'Content-Type': fileType,
          'x-ms-blob-type': 'BlockBlob',
        },
        transformRequest: (data, headers) => {
          // Don't transform the request for blob upload
          return data;
        },
      });

      // Step 3: Return the result
      return {
        url: blobUrl.split('?')[0], // Remove SAS token from URL
        blobName: fileName,
        contentType: fileType,
        size: 0, // Size will be determined by backend
      };
    } catch (error: any) {
      console.error('Blob upload error:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload file');
    }
  }

  /**
   * Upload profile photo
   */
  async uploadProfilePhoto(uri: string, fileName: string): Promise<string> {
    const fileType = this.getMimeType(fileName);
    const result = await this.uploadFile({
      uri,
      fileName: `profile-${Date.now()}-${fileName}`,
      fileType,
      containerName: 'profiles',
    });

    return result.url;
  }

  /**
   * Upload group photo
   */
  async uploadGroupPhoto(uri: string, fileName: string, groupId: string): Promise<string> {
    const fileType = this.getMimeType(fileName);
    const result = await this.uploadFile({
      uri,
      fileName: `group-${groupId}-${Date.now()}-${fileName}`,
      fileType,
      containerName: 'groups',
    });

    return result.url;
  }

  /**
   * Upload message attachment
   */
  async uploadMessageAttachment(
    uri: string,
    fileName: string,
    chatId: string
  ): Promise<UploadResult> {
    const fileType = this.getMimeType(fileName);
    return this.uploadFile({
      uri,
      fileName: `chat-${chatId}-${Date.now()}-${fileName}`,
      fileType,
      containerName: 'messages',
    });
  }

  /**
   * Upload story media
   */
  async uploadStoryMedia(uri: string, fileName: string): Promise<string> {
    const fileType = this.getMimeType(fileName);
    const result = await this.uploadFile({
      uri,
      fileName: `story-${Date.now()}-${fileName}`,
      fileType,
      containerName: 'stories',
    });

    return result.url;
  }

  /**
   * Get MIME type from file name
   */
  private getMimeType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    const mimeTypes: Record<string, string> = {
      // Images
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      bmp: 'image/bmp',
      
      // Videos
      mp4: 'video/mp4',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo',
      mkv: 'video/x-matroska',
      webm: 'video/webm',
      
      // Audio
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      m4a: 'audio/mp4',
      aac: 'audio/aac',
      
      // Documents
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      txt: 'text/plain',
      
      // Archives
      zip: 'application/zip',
      rar: 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed',
    };

    return mimeTypes[extension || ''] || 'application/octet-stream';
  }

  /**
   * Delete a blob from storage
   */
  async deleteFile(blobUrl: string): Promise<void> {
    try {
      const deleteUrl = buildApiUrl('/storage/delete');
      const headers = await getAuthHeaders();
      
      await axios.delete(deleteUrl, {
        headers,
        data: { blobUrl },
      });
    } catch (error: any) {
      console.error('Blob delete error:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete file');
    }
  }
}

export const blobStorageService = new BlobStorageService();
export default BlobStorageService;
