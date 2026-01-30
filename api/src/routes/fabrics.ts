import { Router, Response, Request } from 'express';
import { supabase, DbFabric } from '../config/supabase';
import { AuthRequest, ApiResponse } from '../types';
import {
  authenticateToken,
  requireAdmin,
  uploadImage,
  handleMulterError,
} from '../middleware';
import { processImage, deleteImage } from '../services';
import { logger } from '../utils/logger';
import { transformDbToApi } from '../utils/helpers';

const router = Router();

/**
 * GET /api/fabrics
 * Get all active fabrics (public - for gallery view)
 */
router.get('/', async (_req: Request, res: Response<ApiResponse>) => {
  try {
    const { data: fabrics, error } = await supabase
      .from('fabrics')
      .select(`
        *,
        tailors:tailor_id (
          name,
          contact_email
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Get fabrics error:', error);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Laden der Stoffe',
      });
    }

    // Transform and add tailor info
    const fabricsWithTailor = fabrics.map((fabric: any) => {
      const transformed = transformDbToApi(fabric);
      if (fabric.tailors) {
        transformed.tailorName = fabric.tailors.name;
        transformed.tailorEmail = fabric.tailors.contact_email;
      }
      return transformed;
    });

    res.json({
      success: true,
      data: fabricsWithTailor,
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
    const { data: fabrics, error } = await supabase
      .from('fabrics')
      .select('*')
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) {
      logger.error('Get featured fabrics error:', error);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Laden der Featured-Stoffe',
      });
    }

    res.json({
      success: true,
      data: transformDbToApi(fabrics),
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
      const { data: fabrics, error } = await supabase
        .from('fabrics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Admin get fabrics error:', error);
        return res.status(500).json({
          success: false,
          error: 'Fehler beim Laden der Stoffe',
        });
      }

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
    const { data: fabric, error } = await supabase
      .from('fabrics')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !fabric) {
      return res.status(404).json({
        success: false,
        error: 'Stoff nicht gefunden',
      });
    }

    res.json({
      success: true,
      data: transformDbToApi(fabric),
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

      const fabricId = `${Date.now()}`;
      const fabricData = {
        id: fabricId,
        name: name || '',
        description: description || '',
        fabric_type: fabricType || '',
        color: color || null,
        pattern: pattern || null,
        material: material || null,
        width: width ? Number(width) : null,
        is_featured: isFeatured === 'true' || isFeatured === true,
        is_active: true,
        image_url: imageUrl,
        image_url_webp: imageUrlWebp || null,
        thumbnail_url: thumbnailUrl || null,
      };

      const { data: fabric, error } = await supabase
        .from('fabrics')
        .insert(fabricData)
        .select()
        .single();

      if (error) {
        logger.error('Create fabric error:', error);
        return res.status(500).json({
          success: false,
          error: 'Fehler beim Erstellen des Stoffes',
        });
      }

      logger.info(`Fabric created: ${fabric.id} by ${req.user?.username}`);

      res.status(201).json({
        success: true,
        data: transformDbToApi(fabric),
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
      const { data: existingFabric, error: fetchError } = await supabase
        .from('fabrics')
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (fetchError || !existingFabric) {
        return res.status(404).json({
          success: false,
          error: 'Stoff nicht gefunden',
        });
      }

      const updates: Partial<DbFabric> = {};

      if (req.body.name !== undefined) updates.name = req.body.name;
      if (req.body.description !== undefined) updates.description = req.body.description;
      if (req.body.fabricType !== undefined) updates.fabric_type = req.body.fabricType;
      if (req.body.color !== undefined) updates.color = req.body.color;
      if (req.body.pattern !== undefined) updates.pattern = req.body.pattern;
      if (req.body.material !== undefined) updates.material = req.body.material;
      if (req.body.width !== undefined) updates.width = Number(req.body.width);
      if (req.body.isFeatured !== undefined) {
        updates.is_featured = req.body.isFeatured === 'true' || req.body.isFeatured === true;
      }
      if (req.body.isActive !== undefined) {
        updates.is_active = req.body.isActive === 'true' || req.body.isActive === true;
      }

      // Handle new image upload
      if (req.file) {
        // Delete old images
        if (existingFabric.image_url) {
          await deleteImage(existingFabric.image_url);
        }

        try {
          const processed = await processImage(req.file.path);
          updates.image_url = processed.original;
          updates.image_url_webp = processed.webp;
          updates.thumbnail_url = processed.thumbnail;
        } catch (imgError) {
          logger.error('Image processing error:', imgError);
          updates.image_url = `/uploads/${req.file.filename}`;
        }
      }

      const { data: fabric, error } = await supabase
        .from('fabrics')
        .update(updates)
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) {
        logger.error('Update fabric error:', error);
        return res.status(500).json({
          success: false,
          error: 'Fehler beim Aktualisieren des Stoffes',
        });
      }

      logger.info(`Fabric updated: ${req.params.id} by ${req.user?.username}`);

      res.json({
        success: true,
        data: transformDbToApi(fabric),
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
      const { data: fabric, error: fetchError } = await supabase
        .from('fabrics')
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (fetchError || !fabric) {
        return res.status(404).json({
          success: false,
          error: 'Stoff nicht gefunden',
        });
      }

      // Delete associated images
      if (fabric.image_url) {
        await deleteImage(fabric.image_url);
      }

      const { error } = await supabase
        .from('fabrics')
        .delete()
        .eq('id', req.params.id);

      if (error) {
        logger.error('Delete fabric error:', error);
        return res.status(500).json({
          success: false,
          error: 'Fehler beim Löschen des Stoffes',
        });
      }

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
