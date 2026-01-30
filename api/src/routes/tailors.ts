import { Router, Response } from 'express';
import { supabase, DbTailor } from '../config/supabase';
import { AuthRequest, ApiResponse } from '../types';
import { authenticateToken, requireAdmin } from '../middleware';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/tailors
 * Liste aller aktiven Schneider (öffentlich)
 */
router.get('/', async (req, res: Response<ApiResponse>) => {
  try {
    const { data: tailors, error } = await supabase
      .from('tailors')
      .select('id, name, slug, description, logo_url')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      logger.error('Get tailors error:', error);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Laden der Schneider',
      });
    }

    res.json({
      success: true,
      data: tailors || [],
    } as any);
  } catch (error) {
    logger.error('Get tailors error:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Laden der Schneider',
    });
  }
});

/**
 * GET /api/tailors/:slug
 * Einzelnen Schneider abrufen (öffentlich)
 */
router.get('/:slug', async (req, res: Response<ApiResponse>) => {
  try {
    const { slug } = req.params;

    const { data: tailor, error } = await supabase
      .from('tailors')
      .select('id, name, slug, description, logo_url')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !tailor) {
      return res.status(404).json({
        success: false,
        error: 'Schneider nicht gefunden',
      });
    }

    res.json({
      success: true,
      data: tailor,
    } as any);
  } catch (error) {
    logger.error('Get tailor error:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Laden des Schneiders',
    });
  }
});

/**
 * GET /api/tailors/admin/all
 * Liste aller Schneider inkl. inaktive (Admin only)
 */
router.get(
  '/admin/all',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const { data: tailors, error } = await supabase
        .from('tailors')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        logger.error('Get admin tailors error:', error);
        return res.status(500).json({
          success: false,
          error: 'Fehler beim Laden der Schneider',
        });
      }

      res.json({
        success: true,
        data: tailors || [],
      } as any);
    } catch (error) {
      logger.error('Get admin tailors error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Laden der Schneider',
      });
    }
  }
);

/**
 * POST /api/tailors
 * Neuen Schneider erstellen (Admin only)
 */
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const { name, slug, description, logo_url, contact_email, is_active } = req.body;

      if (!name || !slug) {
        return res.status(400).json({
          success: false,
          error: 'Name und Slug sind erforderlich',
        });
      }

      // Slug validieren
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(slug)) {
        return res.status(400).json({
          success: false,
          error: 'Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten',
        });
      }

      const { data: newTailor, error } = await supabase
        .from('tailors')
        .insert({
          name,
          slug,
          description: description || null,
          logo_url: logo_url || null,
          contact_email: contact_email || null,
          is_active: is_active !== false,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return res.status(409).json({
            success: false,
            error: 'Ein Schneider mit diesem Slug existiert bereits',
          });
        }
        throw error;
      }

      logger.info(`Tailor created: ${name} by ${req.user?.username}`);

      res.status(201).json({
        success: true,
        data: newTailor,
      } as any);
    } catch (error) {
      logger.error('Create tailor error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Erstellen des Schneiders',
      });
    }
  }
);

/**
 * PUT /api/tailors/:id
 * Schneider aktualisieren (Admin only)
 */
router.put(
  '/:id',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const { id } = req.params;
      const { name, slug, description, logo_url, contact_email, is_active } = req.body;

      // Prüfe ob Schneider existiert
      const { data: existing, error: findError } = await supabase
        .from('tailors')
        .select('id')
        .eq('id', id)
        .single();

      if (findError || !existing) {
        return res.status(404).json({
          success: false,
          error: 'Schneider nicht gefunden',
        });
      }

      // Slug validieren wenn angegeben
      if (slug) {
        const slugRegex = /^[a-z0-9-]+$/;
        if (!slugRegex.test(slug)) {
          return res.status(400).json({
            success: false,
            error: 'Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten',
          });
        }
      }

      const updateData: Partial<DbTailor> = {};
      if (name !== undefined) updateData.name = name;
      if (slug !== undefined) updateData.slug = slug;
      if (description !== undefined) updateData.description = description;
      if (logo_url !== undefined) updateData.logo_url = logo_url;
      if (contact_email !== undefined) updateData.contact_email = contact_email;
      if (is_active !== undefined) updateData.is_active = is_active;

      const { data: updatedTailor, error: updateError } = await supabase
        .from('tailors')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        if (updateError.code === '23505') {
          return res.status(409).json({
            success: false,
            error: 'Ein Schneider mit diesem Slug existiert bereits',
          });
        }
        throw updateError;
      }

      logger.info(`Tailor updated: ${updatedTailor.name} by ${req.user?.username}`);

      res.json({
        success: true,
        data: updatedTailor,
      } as any);
    } catch (error) {
      logger.error('Update tailor error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Aktualisieren des Schneiders',
      });
    }
  }
);

/**
 * DELETE /api/tailors/:id
 * Schneider löschen (Admin only)
 */
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const { id } = req.params;

      // Prüfe ob Schneider existiert
      const { data: existing, error: findError } = await supabase
        .from('tailors')
        .select('id, name')
        .eq('id', id)
        .single();

      if (findError || !existing) {
        return res.status(404).json({
          success: false,
          error: 'Schneider nicht gefunden',
        });
      }

      // Lösche Schneider (products/patterns werden auf NULL gesetzt durch FK CASCADE)
      const { error: deleteError } = await supabase
        .from('tailors')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      logger.info(`Tailor deleted: ${existing.name} by ${req.user?.username}`);

      res.json({
        success: true,
        message: 'Schneider gelöscht',
      });
    } catch (error) {
      logger.error('Delete tailor error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Löschen des Schneiders',
      });
    }
  }
);

export default router;
