import { Router, Response, Request } from 'express';
import { fabricsStore, Fabric } from '../data/jsonStore';
import { AuthRequest, ApiResponse } from '../types';
import {
  authenticateToken,
  requireAdmin,
  uploadImage,
  handleMulterError,
} from '../middleware';
import { processImage, deleteImage } from '../services';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/fabrics
 * Get all active fabrics (public - for gallery view)
 */
router.get('/', async (_req: Request, res: Response<ApiResponse>) => {
  try {
    const fabrics = fabricsStore.getActive();
    res.json({
      success: true,
      data: fabrics,
    });
  } catch (error) {
    logger.error('Get fabrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Laden der Stoffe',
    });
  }
});

/**
 * GET /api/fabrics/featured
 * Get featured fabrics (public)
 */
router.get('/featured', async (_req: Request, res: Response<ApiResponse>) => {
  try {
    const fabrics = fabricsStore.getFeatured().slice(0, 8);
    res.json({
      success: true,
      data: fabrics,
    });
  } catch (error) {
    logger.error('Get featured fabrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Laden der Featured-Stoffe',
    });
  }
});

/**
 * GET /api/fabrics/admin
 * Get all fabrics including inactive (admin only)
 */
router.get(
  '/admin',
  authenticateToken,
  requireAdmin,
  async (_req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const fabrics = fabricsStore.getAll();
      // Sort by createdAt descending
      fabrics.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json({
        success: true,
        data: fabrics,
      });
    } catch (error) {
      logger.error('Admin get fabrics error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Laden der Stoffe',
      });
    }
  }
);

/**
 * GET /api/fabrics/:id
 * Get single fabric (public)
 */
router.get('/:id', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const fabric = fabricsStore.getById(req.params.id);

    if (!fabric) {
      res.status(404).json({
        success: false,
        error: 'Stoff nicht gefunden',
      });
      return;
    }

    res.json({
      success: true,
      data: fabric,
    });
  } catch (error) {
    logger.error('Get fabric error:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Laden des Stoffes',
    });
  }
});

/**
 * POST /api/fabrics
 * Create new fabric (admin only)
 */
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  uploadImage.single('imageFile'),
  handleMulterError,
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const { name, description, fabricType, color, pattern, material, width, isFeatured } = req.body;

      let imageUrl = req.body.imageUrl || '';
      let imageUrlWebp = '';
      let thumbnailUrl = '';

      // Process uploaded image
      if (req.file) {
        try {
          const processed = await processImage(req.file.path);
          imageUrl = processed.original;
          imageUrlWebp = processed.webp;
          thumbnailUrl = processed.thumbnail;
        } catch (imgError) {
          logger.error('Image processing error:', imgError);
          imageUrl = `/uploads/${req.file.filename}`;
        }
      }

      const fabric = fabricsStore.create({
        name: name || '',
        description: description || '',
        fabricType: fabricType || '',
        color: color || '',
        pattern: pattern || '',
        material: material || '',
        width: width ? Number(width) : undefined,
        isFeatured: isFeatured === 'true' || isFeatured === true,
        isActive: true,
        imageUrl,
        imageUrlWebp,
        thumbnailUrl,
      });

      logger.info(`Fabric created: ${fabric.id} by ${req.user?.username}`);

      res.status(201).json({
        success: true,
        data: fabric,
        message: 'Stoff erstellt',
      });
    } catch (error) {
      logger.error('Create fabric error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Erstellen des Stoffes',
      });
    }
  }
);

/**
 * PUT /api/fabrics/:id
 * Update fabric (admin only)
 */
router.put(
  '/:id',
  authenticateToken,
  requireAdmin,
  uploadImage.single('imageFile'),
  handleMulterError,
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const existingFabric = fabricsStore.getById(req.params.id);

      if (!existingFabric) {
        res.status(404).json({
          success: false,
          error: 'Stoff nicht gefunden',
        });
        return;
      }

      const updates: Partial<Fabric> = {};

      if (req.body.name !== undefined) updates.name = req.body.name;
      if (req.body.description !== undefined) updates.description = req.body.description;
      if (req.body.fabricType !== undefined) updates.fabricType = req.body.fabricType;
      if (req.body.color !== undefined) updates.color = req.body.color;
      if (req.body.pattern !== undefined) updates.pattern = req.body.pattern;
      if (req.body.material !== undefined) updates.material = req.body.material;
      if (req.body.width !== undefined) updates.width = Number(req.body.width);
      if (req.body.isFeatured !== undefined) {
        updates.isFeatured = req.body.isFeatured === 'true' || req.body.isFeatured === true;
      }
      if (req.body.isActive !== undefined) {
        updates.isActive = req.body.isActive === 'true' || req.body.isActive === true;
      }

      // Handle new image upload
      if (req.file) {
        // Delete old images
        if (existingFabric.imageUrl) {
          await deleteImage(existingFabric.imageUrl);
        }

        try {
          const processed = await processImage(req.file.path);
          updates.imageUrl = processed.original;
          updates.imageUrlWebp = processed.webp;
          updates.thumbnailUrl = processed.thumbnail;
        } catch (imgError) {
          logger.error('Image processing error:', imgError);
          updates.imageUrl = `/uploads/${req.file.filename}`;
        }
      }

      const fabric = fabricsStore.update(req.params.id, updates);

      logger.info(`Fabric updated: ${req.params.id} by ${req.user?.username}`);

      res.json({
        success: true,
        data: fabric,
        message: 'Stoff aktualisiert',
      });
    } catch (error) {
      logger.error('Update fabric error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Aktualisieren des Stoffes',
      });
    }
  }
);

/**
 * DELETE /api/fabrics/:id
 * Delete fabric (admin only)
 */
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const fabric = fabricsStore.getById(req.params.id);

      if (!fabric) {
        res.status(404).json({
          success: false,
          error: 'Stoff nicht gefunden',
        });
        return;
      }

      // Delete associated images
      if (fabric.imageUrl) {
        await deleteImage(fabric.imageUrl);
      }

      fabricsStore.delete(req.params.id);

      logger.info(`Fabric deleted: ${req.params.id} by ${req.user?.username}`);

      res.json({
        success: true,
        message: 'Stoff gelöscht',
      });
    } catch (error) {
      logger.error('Delete fabric error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Löschen des Stoffes',
      });
    }
  }
);

export default router;
