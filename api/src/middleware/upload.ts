import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { env } from '../config/environment';

// Ensure upload directory exists
const uploadDir = path.resolve(env.UPLOAD_PATH);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9]/g, '-')
      .substring(0, 50);
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  },
});

// File filter for images only
const imageFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

  const ext = path.extname(file.originalname).toLowerCase();
  const mimeOk = allowedMimes.includes(file.mimetype);
  const extOk = allowedExts.includes(ext);

  if (mimeOk && extOk) {
    cb(null, true);
  } else {
    cb(new Error('Nur Bilder erlaubt (JPEG, PNG, GIF, WebP)'));
  }
};

// Create multer instance
export const uploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024, // Convert MB to bytes
    files: 1,
  },
});

// Multiple images upload
export const uploadImages = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 10,
  },
});

// Error handler for multer
export const handleMulterError = (
  err: Error,
  _req: Request,
  res: import('express').Response,
  next: import('express').NextFunction
): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        error: `Datei zu groß. Maximum: ${env.MAX_FILE_SIZE_MB}MB`,
      });
      return;
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      res.status(400).json({
        success: false,
        error: 'Zu viele Dateien',
      });
      return;
    }
    res.status(400).json({
      success: false,
      error: 'Upload-Fehler: ' + err.message,
    });
    return;
  }

  if (err.message.includes('Nur Bilder')) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
    return;
  }

  next(err);
};
