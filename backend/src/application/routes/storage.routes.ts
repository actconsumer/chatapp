/**
 * Storage Routes
 * Production-grade REST API routes for Azure Blob Storage operations
 */

import { Router } from 'express';
import { storageController } from '../controllers/StorageController';
import { authenticate } from '../middleware/auth.middleware';
import multer from 'multer';

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
  },
}).single('file');

// All routes require authentication
router.use(authenticate);

// SAS token generation
router.post('/sas-token', storageController.generateSasToken.bind(storageController));

// Direct file upload
router.post('/upload', upload, storageController.uploadFile.bind(storageController));

// File deletion
router.delete('/delete', storageController.deleteFile.bind(storageController));

// Check blob existence
router.get('/exists', storageController.blobExists.bind(storageController));

export default router;
