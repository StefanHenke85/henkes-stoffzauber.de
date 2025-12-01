import { Router, Response, Request } from 'express';
import { productsStore, Product } from '../data/jsonStore';
import { AuthRequest, ApiResponse, PaginatedResponse } from '../types';
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
 * GET /api/products
 * Get all active products (public)
 */
router.get('/', async (_req: Request, res: Response<ApiResponse>) => {
  try {
    const products = productsStore.getActive();
    res.json({
      success: true,
      data: products,
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
    const products = productsStore.getFeatured().slice(0, 8);
    res.json({
      success: true,
      data: products,
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

      let products = productsStore.getAll();

      if (search) {
        const q = search.toLowerCase();
        products = products.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
        );
      }

      // Sort by createdAt descending
      products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const total = products.length;
      const start = (page - 1) * limit;
      const data = products.slice(start, start + limit);

      res.json({
        success: true,
        data: {
          data,
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
    const product = productsStore.getById(req.params.id);

    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Produkt nicht gefunden',
      });
      return;
    }

    res.json({
      success: true,
      data: product,
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
  uploadImage.single('imageFile'),
  handleMulterError,
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const { name, description, price, stock, fabrics, availableFabrics, isFeatured } = req.body;

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

      const product = productsStore.create({
        name: name || '',
        description: description || '',
        price: Number(price) || 0,
        stock: Number(stock) || 0,
        fabrics: fabrics || '',
        availableFabrics: parsedAvailableFabrics,
        isFeatured: isFeatured === 'true' || isFeatured === true,
        isActive: true,
        imageUrl,
        imageUrlWebp,
        thumbnailUrl,
      });

      logger.info(`Product created: ${product.id} by ${req.user?.username}`);

      res.status(201).json({
        success: true,
        data: product,
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
  uploadImage.single('imageFile'),
  handleMulterError,
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const existingProduct = productsStore.getById(req.params.id);

      if (!existingProduct) {
        res.status(404).json({
          success: false,
          error: 'Produkt nicht gefunden',
        });
        return;
      }

      const updates: Partial<Product> = {};

      if (req.body.name !== undefined) updates.name = req.body.name;
      if (req.body.description !== undefined) updates.description = req.body.description;
      if (req.body.price !== undefined) updates.price = Number(req.body.price);
      if (req.body.stock !== undefined) updates.stock = Number(req.body.stock);
      if (req.body.fabrics !== undefined) updates.fabrics = req.body.fabrics;
      if (req.body.availableFabrics !== undefined) {
        try {
          updates.availableFabrics = typeof req.body.availableFabrics === 'string'
            ? JSON.parse(req.body.availableFabrics)
            : req.body.availableFabrics;
        } catch {
          updates.availableFabrics = [];
        }
      }
      if (req.body.isFeatured !== undefined) {
        updates.isFeatured = req.body.isFeatured === 'true' || req.body.isFeatured === true;
      }
      if (req.body.isActive !== undefined) {
        updates.isActive = req.body.isActive === 'true' || req.body.isActive === true;
      }

      // Handle new image upload
      if (req.file) {
        // Delete old images
        if (existingProduct.imageUrl) {
          await deleteImage(existingProduct.imageUrl);
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

      const product = productsStore.update(req.params.id, updates);

      logger.info(`Product updated: ${req.params.id} by ${req.user?.username}`);

      res.json({
        success: true,
        data: product,
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
      const product = productsStore.getById(req.params.id);

      if (!product) {
        res.status(404).json({
          success: false,
          error: 'Produkt nicht gefunden',
        });
        return;
      }

      // Delete associated images
      if (product.imageUrl) {
        await deleteImage(product.imageUrl);
      }

      productsStore.delete(req.params.id);

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
