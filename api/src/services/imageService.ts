import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { env } from '../config/environment';
import { logger } from '../utils/logger';

const uploadDir = path.resolve(env.UPLOAD_PATH);

interface ProcessedImage {
  original: string;
  webp: string;
  thumbnail: string;
}

/**
 * Process uploaded image: create WebP version and thumbnail
 */
export async function processImage(filePath: string): Promise<ProcessedImage> {
  const ext = path.extname(filePath);
  const baseName = path.basename(filePath, ext);
  const dir = path.dirname(filePath);

  const webpPath = path.join(dir, `${baseName}.webp`);
  const thumbnailPath = path.join(dir, `${baseName}-thumb.webp`);

  try {
    // Read original image
    const imageBuffer = await fs.readFile(filePath);

    // Create optimized WebP version (max 1200px width)
    await sharp(imageBuffer)
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toFile(webpPath);

    // Create thumbnail (400px)
    await sharp(imageBuffer)
      .resize(400, 400, {
        fit: 'cover',
      })
      .webp({ quality: 80 })
      .toFile(thumbnailPath);

    logger.info(`Image processed: ${baseName}`);

    return {
      original: `/uploads/${path.basename(filePath)}`,
      webp: `/uploads/${path.basename(webpPath)}`,
      thumbnail: `/uploads/${path.basename(thumbnailPath)}`,
    };
  } catch (error) {
    logger.error('Image processing error:', error);
    // Return original if processing fails
    return {
      original: `/uploads/${path.basename(filePath)}`,
      webp: `/uploads/${path.basename(filePath)}`,
      thumbnail: `/uploads/${path.basename(filePath)}`,
    };
  }
}

/**
 * Delete image and its variants
 */
export async function deleteImage(imageUrl: string): Promise<void> {
  if (!imageUrl || !imageUrl.startsWith('/uploads/')) return;

  const filename = path.basename(imageUrl);
  const ext = path.extname(filename);
  const baseName = path.basename(filename, ext);

  const filesToDelete = [
    path.join(uploadDir, filename),
    path.join(uploadDir, `${baseName}.webp`),
    path.join(uploadDir, `${baseName}-thumb.webp`),
  ];

  for (const file of filesToDelete) {
    try {
      await fs.unlink(file);
      logger.debug(`Deleted: ${file}`);
    } catch (error) {
      // File might not exist, ignore
    }
  }
}

/**
 * Get image metadata
 */
export async function getImageMetadata(filePath: string): Promise<sharp.Metadata | null> {
  try {
    const fullPath = path.join(uploadDir, path.basename(filePath));
    return await sharp(fullPath).metadata();
  } catch {
    return null;
  }
}

/**
 * Optimize existing images (for migration)
 */
export async function optimizeExistingImages(): Promise<number> {
  let processed = 0;

  try {
    const files = await fs.readdir(uploadDir);

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();

      // Skip already processed files
      if (file.includes('-thumb') || ext === '.webp') continue;

      // Only process image files
      if (!['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) continue;

      const filePath = path.join(uploadDir, file);
      await processImage(filePath);
      processed++;
    }

    logger.info(`Optimized ${processed} images`);
  } catch (error) {
    logger.error('Error optimizing images:', error);
  }

  return processed;
}
