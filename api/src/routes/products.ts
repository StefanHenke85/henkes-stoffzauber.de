import { Router, Response, Request } from 'express';
import { supabase, DbProduct } from '../config/supabase';
import { AuthRequest, ApiResponse, PaginatedResponse } from '../types';
import {
  authenticateToken,
  requireAdmin,
  uploadImage,
  handleMulterError,
} from '../middleware';
import { processImage, deleteImage, processMaskToMatchProduct } from '../services';
import { logger } from '../utils/logger';
import { transformDbToApi } from '../utils/helpers';

const router = Router();

/**
 * GET /api/products
 * Get all active products (public)
 */
router.get('/', async (_req: Request, res: Response<ApiResponse>) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*, tailors(id, name)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Get products error:', error);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Laden der Produkte',
      });
    }

    // Add tailorName to each product
    const productsWithTailor = (products || []).map((p: any) => ({
      ...p,
      tailor_name: p.tailors?.name || null,
      tailors: undefined, // Remove nested object
    }));

    res.json({
      success: true,
      data: transformDbToApi(productsWithTailor),
    });
  } catch (error) {
    logger.error('Get products error:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Laden der Produkte',
    });
  }
});

/**
 * GET /api/products/featured
 * Get featured products (public)
 */
router.get('/featured', async (_req: Request, res: Response<ApiResponse>) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*, tailors(id, name)')
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) {
      logger.error('Get featured products error:', error);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Laden der Featured-Produkte',
      });
    }

    // Add tailorName to each product
    const productsWithTailor = (products || []).map((p: any) => ({
      ...p,
      tailor_name: p.tailors?.name || null,
      tailors: undefined,
    }));

    res.json({
      success: true,
      data: transformDbToApi(productsWithTailor),
    });
  } catch (error) {
    logger.error('Get featured products error:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Laden der Featured-Produkte',
    });
  }
});

/**
 * GET /api/products/admin
 * Get all products including inactive (admin only)
 */
router.get(
  '/admin',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response<ApiResponse<PaginatedResponse<unknown>>>) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;

      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (search) {
        const q = search.toLowerCase();
        query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
      }

      const start = (page - 1) * limit;
      query = query.range(start, start + limit - 1);

      const { data: products, count, error } = await query;

      if (error) {
        logger.error('Admin get products error:', error);
        return res.status(500).json({
          success: false,
          error: 'Fehler beim Laden der Produkte',
        });
      }

      const total = count || 0;

      res.json({
        success: true,
        data: {
          data: transformDbToApi(products),
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
          },
        },
      });
    } catch (error) {
      logger.error('Admin get products error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Laden der Produkte',
      });
    }
  }
);

/**
 * GET /api/products/:id
 * Get single product (public)
 */
router.get('/:id', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('*, tailors(id, name)')
      .eq('id', req.params.id)
      .single();

    if (error || !product) {
      return res.status(404).json({
        success: false,
        error: 'Produkt nicht gefunden',
      });
    }

    // Add tailorName to product
    const productWithTailor = {
      ...product,
      tailor_name: (product as any).tailors?.name || null,
      tailors: undefined,
    };

    res.json({
      success: true,
      data: transformDbToApi(productWithTailor),
    });
  } catch (error) {
    logger.error('Get product error:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Laden des Produkts',
    });
  }
});

/**
 * POST /api/products
 * Create new product (admin only)
 */
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  uploadImage.any(),
  handleMulterError,
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const { name, description, price, stock, fabrics, availableFabrics, isFeatured, fabricScale, productScale } = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      let imageUrl = req.body.imageUrl || '';
      let imageUrlWebp = '';
      let thumbnailUrl = '';
      let maskUrl = '';

      // Process uploaded image
      const imageFile = files?.imageFile?.[0];
      if (imageFile) {
        try {
          const processed = await processImage(imageFile.path);
          imageUrl = processed.original;
          imageUrlWebp = processed.webp;
          thumbnailUrl = processed.thumbnail;
        } catch (imgError) {
          logger.error('Image processing error:', imgError);
          imageUrl = `/uploads/${imageFile.filename}`;
        }
      }

      // Process uploaded mask - MUST match product image dimensions!
      const maskFile = files?.maskFile?.[0];
      if (maskFile && imageUrl) {
        try {
          // Resize mask to match product image exactly
          maskUrl = await processMaskToMatchProduct(maskFile.path, imageUrl);
        } catch (imgError) {
          logger.error('Mask processing error:', imgError);
          maskUrl = `/uploads/${maskFile.filename}`;
        }
      }

      // Parse availableFabrics if it's a JSON string
      let parsedAvailableFabrics: string[] | undefined;
      if (availableFabrics) {
        try {
          parsedAvailableFabrics = typeof availableFabrics === 'string'
            ? JSON.parse(availableFabrics)
            : availableFabrics;
        } catch {
          parsedAvailableFabrics = [];
        }
      }

      const productId = `${Date.now()}`;
      const productData = {
        id: productId,
        name: name || '',
        description: description || '',
        price: Number(price) || 0,
        stock: Number(stock) || 0,
        fabrics: fabrics || '',
        available_fabrics: parsedAvailableFabrics || null,
        is_featured: isFeatured === 'true' || isFeatured === true,
        is_active: true,
        image_url: imageUrl,
        image_url_webp: imageUrlWebp || null,
        thumbnail_url: thumbnailUrl || null,
        mask_url: maskUrl || null,
        fabric_scale: fabricScale ? Number(fabricScale) : 1.0,
        product_scale: productScale ? Number(productScale) : 1.0,
      };

      const { data: product, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (error) {
        logger.error('Create product error:', error);
        return res.status(500).json({
          success: false,
          error: 'Fehler beim Erstellen des Produkts',
        });
      }

      logger.info(`Product created: ${product.id} by ${req.user?.username}`);

      res.status(201).json({
        success: true,
        data: transformDbToApi(product),
        message: 'Produkt erstellt',
      });
    } catch (error) {
      logger.error('Create product error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Erstellen des Produkts',
      });
    }
  }
);

/**
 * PUT /api/products/:id
 * Update product (admin only)
 */
router.put(
  '/:id',
  authenticateToken,
  requireAdmin,
  uploadImage.any(),
  handleMulterError,
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const { data: existingProduct, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (fetchError || !existingProduct) {
        return res.status(404).json({
          success: false,
          error: 'Produkt nicht gefunden',
        });
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const updates: Partial<DbProduct> = {};

      if (req.body.name !== undefined) updates.name = req.body.name;
      if (req.body.description !== undefined) updates.description = req.body.description;
      if (req.body.price !== undefined) updates.price = Number(req.body.price);
      if (req.body.stock !== undefined) updates.stock = Number(req.body.stock);
      if (req.body.fabrics !== undefined) updates.fabrics = req.body.fabrics;
      if (req.body.availableFabrics !== undefined) {
        try {
          updates.available_fabrics = typeof req.body.availableFabrics === 'string'
            ? JSON.parse(req.body.availableFabrics)
            : req.body.availableFabrics;
        } catch {
          updates.available_fabrics = [];
        }
      }
      if (req.body.isFeatured !== undefined) {
        updates.is_featured = req.body.isFeatured === 'true' || req.body.isFeatured === true;
      }
      if (req.body.isActive !== undefined) {
        updates.is_active = req.body.isActive === 'true' || req.body.isActive === true;
      }
      if (req.body.fabricScale !== undefined) {
        updates.fabric_scale = Number(req.body.fabricScale) || 1.0;
      }
      if (req.body.productScale !== undefined) {
        updates.product_scale = Number(req.body.productScale) || 1.0;
      }
      if (req.body.sizeType !== undefined) {
        updates.size_type = req.body.sizeType;
      }
      if (req.body.availableSizes !== undefined) {
        try {
          updates.available_sizes = typeof req.body.availableSizes === 'string'
            ? JSON.parse(req.body.availableSizes)
            : req.body.availableSizes;
        } catch {
          updates.available_sizes = [];
        }
      }

      // Handle new image upload
      const imageFile = files?.imageFile?.[0];
      if (imageFile) {
        // Delete old images
        if (existingProduct.image_url) {
          await deleteImage(existingProduct.image_url);
        }

        try {
          const processed = await processImage(imageFile.path);
          updates.image_url = processed.original;
          updates.image_url_webp = processed.webp;
          updates.thumbnail_url = processed.thumbnail;
        } catch (imgError) {
          logger.error('Image processing error:', imgError);
          updates.image_url = `/uploads/${imageFile.filename}`;
        }
      }

      // Handle new mask upload - MUST match product image dimensions!
      const maskFile = files?.maskFile?.[0];
      if (maskFile) {
        // Delete old mask
        if (existingProduct.mask_url) {
          await deleteImage(existingProduct.mask_url);
        }

        try {
          // Use updated imageUrl if new image was uploaded, otherwise use existing
          const productImageUrl = updates.image_url || existingProduct.image_url;
          updates.mask_url = await processMaskToMatchProduct(maskFile.path, productImageUrl!);
        } catch (imgError) {
          logger.error('Mask processing error:', imgError);
          updates.mask_url = `/uploads/${maskFile.filename}`;
        }
      }

      const { data: product, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) {
        logger.error('Update product error:', error);
        return res.status(500).json({
          success: false,
          error: 'Fehler beim Aktualisieren des Produkts',
        });
      }

      logger.info(`Product updated: ${req.params.id} by ${req.user?.username}`);

      res.json({
        success: true,
        data: transformDbToApi(product),
        message: 'Produkt aktualisiert',
      });
    } catch (error) {
      logger.error('Update product error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Aktualisieren des Produkts',
      });
    }
  }
);

/**
 * DELETE /api/products/:id
 * Delete product (admin only)
 */
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (fetchError || !product) {
        return res.status(404).json({
          success: false,
          error: 'Produkt nicht gefunden',
        });
      }

      // Delete associated images
      if (product.image_url) {
        await deleteImage(product.image_url);
      }

      // Delete associated mask
      if (product.mask_url) {
        await deleteImage(product.mask_url);
      }

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', req.params.id);

      if (error) {
        logger.error('Delete product error:', error);
        return res.status(500).json({
          success: false,
          error: 'Fehler beim Löschen des Produkts',
        });
      }

      logger.info(`Product deleted: ${req.params.id} by ${req.user?.username}`);

      res.json({
        success: true,
        message: 'Produkt gelöscht',
      });
    } catch (error) {
      logger.error('Delete product error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Löschen des Produkts',
      });
    }
  }
);

export default router;
