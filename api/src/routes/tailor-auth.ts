import { Router, Response, Request } from 'express';
import { supabase, DbTailor } from '../config/supabase';
import { AuthRequest, ApiResponse } from '../types';
import { authenticateToken, requireAdmin } from '../middleware';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/environment';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const router = Router();

// Multer configuration for file uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
const patternsDir = path.join(process.cwd(), 'patterns');

// Ensure directories exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(patternsDir)) {
  fs.mkdirSync(patternsDir, { recursive: true });
}

const productImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `product-${crypto.randomUUID()}${ext}`);
  },
});

const patternStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, patternsDir);
  },
  filename: (req, file, cb) => {
    // Keep original filename but sanitize it
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, safeName);
  },
});

const uploadProductImage = multer({
  storage: productImageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Nur Bilder erlaubt (JPEG, PNG, WebP, GIF)'));
    }
  },
});

const uploadPattern = multer({
  storage: patternStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/zip', 'application/x-zip-compressed'];
    const allowedExts = ['.pdf', '.zip'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Nur PDF und ZIP Dateien erlaubt'));
    }
  },
});

// Middleware: Schneider-Token prüfen
export const authenticateTailor = async (
  req: AuthRequest,
  res: Response,
  next: Function
) => {
  const token = req.cookies?.tailor_token || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Nicht autorisiert',
    });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      tailorId: string;
      username: string;
      type: 'tailor';
    };

    if (decoded.type !== 'tailor') {
      throw new Error('Invalid token type');
    }

    // Schneider aus DB laden
    const { data: tailor, error } = await supabase
      .from('tailors')
      .select('*')
      .eq('id', decoded.tailorId)
      .eq('registration_status', 'approved')
      .eq('is_active', true)
      .single();

    if (error || !tailor) {
      throw new Error('Tailor not found or not approved');
    }

    req.tailor = {
      id: tailor.id,
      username: tailor.username,
      name: tailor.name,
      slug: tailor.slug,
    };

    next();
  } catch (error) {
    logger.error('Tailor auth error:', error);
    res.clearCookie('tailor_token');
    return res.status(401).json({
      success: false,
      error: 'Ungültiger Token',
    });
  }
};

/**
 * POST /api/tailor-auth/register
 * Neue Schneider-Registrierung (öffentlich)
 */
router.post('/register', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { name, username, email, password, description } = req.body;

    // Validierung
    if (!name || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, Benutzername, E-Mail und Passwort sind erforderlich',
      });
    }

    // Username validieren
    const usernameRegex = /^[a-z0-9_-]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        success: false,
        error: 'Benutzername muss 3-30 Zeichen lang sein (nur Kleinbuchstaben, Zahlen, _ und -)',
      });
    }

    // Passwort-Stärke prüfen
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Passwort muss mindestens 8 Zeichen lang sein',
      });
    }

    // Prüfen ob Username bereits existiert
    const { data: existingUsername } = await supabase
      .from('tailors')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUsername) {
      return res.status(409).json({
        success: false,
        error: 'Dieser Benutzername ist bereits vergeben',
      });
    }

    // Prüfen ob E-Mail bereits existiert
    const { data: existingEmail } = await supabase
      .from('tailors')
      .select('id')
      .eq('contact_email', email)
      .single();

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        error: 'Diese E-Mail-Adresse ist bereits registriert',
      });
    }

    // Slug aus Namen generieren
    const slug = name
      .toLowerCase()
      .replace(/[äöüß]/g, (match: string) => {
        const map: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' };
        return map[match] || match;
      })
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Prüfen ob Slug bereits existiert
    const { data: existingSlug } = await supabase
      .from('tailors')
      .select('id')
      .eq('slug', slug)
      .single();

    let finalSlug = slug;
    if (existingSlug) {
      // Füge Zufallszahl an
      finalSlug = `${slug}-${Date.now().toString(36)}`;
    }

    // Passwort hashen
    const passwordHash = await bcrypt.hash(password, 12);

    // Schneider erstellen
    const { data: newTailor, error: insertError } = await supabase
      .from('tailors')
      .insert({
        name,
        slug: finalSlug,
        username,
        password_hash: passwordHash,
        contact_email: email,
        description: description || null,
        is_active: false, // Noch nicht aktiv bis Admin freischaltet
        registration_status: 'pending',
      })
      .select('id, name, slug, username')
      .single();

    if (insertError) {
      logger.error('Tailor registration error:', insertError);
      throw insertError;
    }

    logger.info(`New tailor registration: ${name} (${username}) - pending approval`);

    res.status(201).json({
      success: true,
      data: {
        message: 'Registrierung erfolgreich! Ihre Anfrage wird geprüft. Sie erhalten eine E-Mail, sobald Ihr Konto freigeschaltet wurde.',
        tailorId: newTailor.id,
      },
    } as any);
  } catch (error) {
    logger.error('Tailor registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler bei der Registrierung',
    });
  }
});

/**
 * POST /api/tailor-auth/login
 * Schneider-Login
 */
router.post('/login', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Benutzername und Passwort sind erforderlich',
      });
    }

    // Schneider suchen
    const { data: tailor, error } = await supabase
      .from('tailors')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !tailor) {
      return res.status(401).json({
        success: false,
        error: 'Ungültige Anmeldedaten',
      });
    }

    // Registrierungsstatus prüfen
    if (tailor.registration_status === 'pending') {
      return res.status(403).json({
        success: false,
        error: 'Ihr Konto wartet noch auf Freigabe durch den Administrator',
      });
    }

    if (tailor.registration_status === 'rejected') {
      return res.status(403).json({
        success: false,
        error: 'Ihre Registrierung wurde abgelehnt',
      });
    }

    if (!tailor.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Ihr Konto ist deaktiviert',
      });
    }

    // Passwort prüfen
    if (!tailor.password_hash) {
      return res.status(401).json({
        success: false,
        error: 'Kein Passwort gesetzt. Bitte kontaktieren Sie den Administrator.',
      });
    }

    const isValid = await bcrypt.compare(password, tailor.password_hash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Ungültige Anmeldedaten',
      });
    }

    // last_login aktualisieren
    await supabase
      .from('tailors')
      .update({ last_login: new Date().toISOString() })
      .eq('id', tailor.id);

    // JWT Token erstellen
    const token = jwt.sign(
      {
        tailorId: tailor.id,
        username: tailor.username,
        type: 'tailor',
      },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Cookie setzen
    res.cookie('tailor_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Tage
    });

    logger.info(`Tailor login: ${tailor.name} (${tailor.username})`);

    res.json({
      success: true,
      data: {
        tailor: {
          id: tailor.id,
          name: tailor.name,
          slug: tailor.slug,
          username: tailor.username,
          email: tailor.contact_email,
          description: tailor.description,
          logoUrl: tailor.logo_url,
        },
        token,
      },
    } as any);
  } catch (error) {
    logger.error('Tailor login error:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Anmelden',
    });
  }
});

/**
 * POST /api/tailor-auth/logout
 * Schneider-Logout
 */
router.post('/logout', (req: Request, res: Response<ApiResponse>) => {
  res.clearCookie('tailor_token');
  res.json({
    success: true,
    message: 'Erfolgreich abgemeldet',
  });
});

/**
 * GET /api/tailor-auth/me
 * Aktueller Schneider (authentifiziert)
 */
router.get(
  '/me',
  authenticateTailor,
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const { data: tailor, error } = await supabase
        .from('tailors')
        .select('id, name, slug, username, contact_email, description, logo_url')
        .eq('id', req.tailor?.id)
        .single();

      if (error || !tailor) {
        return res.status(404).json({
          success: false,
          error: 'Schneider nicht gefunden',
        });
      }

      res.json({
        success: true,
        data: {
          id: tailor.id,
          name: tailor.name,
          slug: tailor.slug,
          username: tailor.username,
          email: tailor.contact_email,
          description: tailor.description,
          logoUrl: tailor.logo_url,
        },
      } as any);
    } catch (error) {
      logger.error('Get tailor me error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Laden der Daten',
      });
    }
  }
);

/**
 * GET /api/tailor-auth/verify
 * Token verifizieren
 */
router.get('/verify', authenticateTailor, (req: AuthRequest, res: Response<ApiResponse>) => {
  res.json({
    success: true,
    data: { valid: true, tailor: req.tailor },
  } as any);
});

// =====================================================
// ADMIN ENDPOINTS - Schneider-Verwaltung
// =====================================================

/**
 * GET /api/tailor-auth/admin/pending
 * Liste der ausstehenden Registrierungen (Admin only)
 */
router.get(
  '/admin/pending',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const { data: tailors, error } = await supabase
        .from('tailors')
        .select('*')
        .eq('registration_status', 'pending')
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: tailors || [],
      } as any);
    } catch (error) {
      logger.error('Get pending tailors error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Laden',
      });
    }
  }
);

/**
 * POST /api/tailor-auth/admin/:id/approve
 * Schneider freischalten (Admin only)
 */
router.post(
  '/admin/:id/approve',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const { id } = req.params;

      const { data: tailor, error: findError } = await supabase
        .from('tailors')
        .select('id, name, contact_email')
        .eq('id', id)
        .single();

      if (findError || !tailor) {
        return res.status(404).json({
          success: false,
          error: 'Schneider nicht gefunden',
        });
      }

      const { error: updateError } = await supabase
        .from('tailors')
        .update({
          registration_status: 'approved',
          is_active: true,
          approved_at: new Date().toISOString(),
          approved_by: req.user?.username,
        })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      logger.info(`Tailor approved: ${tailor.name} by ${req.user?.username}`);

      // TODO: E-Mail an Schneider senden

      res.json({
        success: true,
        message: `Schneider "${tailor.name}" wurde freigeschaltet`,
      });
    } catch (error) {
      logger.error('Approve tailor error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Freischalten',
      });
    }
  }
);

/**
 * POST /api/tailor-auth/admin/:id/reject
 * Schneider-Registrierung ablehnen (Admin only)
 */
router.post(
  '/admin/:id/reject',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const { data: tailor, error: findError } = await supabase
        .from('tailors')
        .select('id, name')
        .eq('id', id)
        .single();

      if (findError || !tailor) {
        return res.status(404).json({
          success: false,
          error: 'Schneider nicht gefunden',
        });
      }

      const { error: updateError } = await supabase
        .from('tailors')
        .update({
          registration_status: 'rejected',
          is_active: false,
        })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      logger.info(`Tailor rejected: ${tailor.name} by ${req.user?.username}. Reason: ${reason || 'none'}`);

      // TODO: E-Mail an Schneider senden mit Ablehnungsgrund

      res.json({
        success: true,
        message: `Registrierung von "${tailor.name}" wurde abgelehnt`,
      });
    } catch (error) {
      logger.error('Reject tailor error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Ablehnen',
      });
    }
  }
);

/**
 * POST /api/tailor-auth/admin/:id/set-password
 * Passwort für bestehenden Schneider setzen (Admin only)
 */
router.post(
  '/admin/:id/set-password',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const { id } = req.params;
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Benutzername und Passwort sind erforderlich',
        });
      }

      const { data: tailor, error: findError } = await supabase
        .from('tailors')
        .select('id, name')
        .eq('id', id)
        .single();

      if (findError || !tailor) {
        return res.status(404).json({
          success: false,
          error: 'Schneider nicht gefunden',
        });
      }

      // Prüfen ob Username bereits vergeben
      const { data: existingUsername } = await supabase
        .from('tailors')
        .select('id')
        .eq('username', username)
        .neq('id', id)
        .single();

      if (existingUsername) {
        return res.status(409).json({
          success: false,
          error: 'Dieser Benutzername ist bereits vergeben',
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const { error: updateError } = await supabase
        .from('tailors')
        .update({
          username,
          password_hash: passwordHash,
          registration_status: 'approved',
          is_active: true,
          approved_at: new Date().toISOString(),
          approved_by: req.user?.username,
        })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      logger.info(`Password set for tailor: ${tailor.name} by ${req.user?.username}`);

      res.json({
        success: true,
        message: `Login-Daten für "${tailor.name}" wurden gesetzt`,
      });
    } catch (error) {
      logger.error('Set tailor password error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Setzen des Passworts',
      });
    }
  }
);

// =====================================================
// TAILOR DATA ENDPOINTS - Eigene Produkte/Muster
// =====================================================

/**
 * GET /api/tailor-auth/my-products
 * Produkte des eingeloggten Verkäufers
 */
router.get(
  '/my-products',
  authenticateTailor,
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const tailorId = req.tailor?.id;

      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('tailor_id', tailorId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Format products for frontend
      const formattedProducts = (products || []).map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        stock: p.stock,
        imageUrl: p.image_url,
        isFeatured: p.is_featured,
        createdAt: p.created_at,
      }));

      res.json({
        success: true,
        data: formattedProducts,
      } as any);
    } catch (error) {
      logger.error('Get tailor products error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Laden der Produkte',
      });
    }
  }
);

/**
 * GET /api/tailor-auth/my-patterns
 * Schnittmuster des eingeloggten Verkäufers
 */
router.get(
  '/my-patterns',
  authenticateTailor,
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const tailorId = req.tailor?.id;

      const { data: patterns, error } = await supabase
        .from('patterns')
        .select('*')
        .eq('tailor_id', tailorId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Format patterns for frontend
      const formattedPatterns = (patterns || []).map((p) => ({
        id: p.id,
        filename: p.filename,
        name: p.name || p.filename.replace(/\.(pdf|zip)$/i, ''),
        type: p.type || (p.filename.endsWith('.zip') ? 'zip' : 'pdf'),
        sizeFormatted: p.size ? formatFileSize(p.size) : '0 B',
        hasThumbnail: !!p.thumbnail_url,
        thumbnailUrl: p.thumbnail_url,
        createdAt: p.created_at,
      }));

      res.json({
        success: true,
        data: formattedPatterns,
      } as any);
    } catch (error) {
      logger.error('Get tailor patterns error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Laden der Schnittmuster',
      });
    }
  }
);

/**
 * POST /api/tailor-auth/my-products
 * Neues Produkt erstellen (Verkäufer)
 */
router.post(
  '/my-products',
  authenticateTailor,
  uploadProductImage.single('image'),
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const tailorId = req.tailor?.id;
      const { name, description, price, stock, category } = req.body;

      if (!name || !price) {
        return res.status(400).json({
          success: false,
          error: 'Name und Preis sind erforderlich',
        });
      }

      const imageUrl = req.file ? `/api/uploads/${req.file.filename}` : null;

      const { data: product, error } = await supabase
        .from('products')
        .insert({
          name,
          description: description || '',
          price: parseFloat(price),
          stock: parseInt(stock) || 0,
          category: category || 'Sonstiges',
          image_url: imageUrl,
          tailor_id: tailorId,
          is_featured: false,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info(`Product created by tailor ${tailorId}: ${name}`);

      res.status(201).json({
        success: true,
        data: {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          imageUrl: product.image_url,
          isFeatured: product.is_featured,
        },
      } as any);
    } catch (error) {
      logger.error('Create tailor product error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Erstellen des Produkts',
      });
    }
  }
);

/**
 * PUT /api/tailor-auth/my-products/:id
 * Produkt bearbeiten (Verkäufer)
 */
router.put(
  '/my-products/:id',
  authenticateTailor,
  uploadProductImage.single('image'),
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const tailorId = req.tailor?.id;
      const { id } = req.params;
      const { name, description, price, stock, category } = req.body;

      // Prüfen ob Produkt dem Verkäufer gehört
      const { data: existing, error: findError } = await supabase
        .from('products')
        .select('id, image_url')
        .eq('id', id)
        .eq('tailor_id', tailorId)
        .single();

      if (findError || !existing) {
        return res.status(404).json({
          success: false,
          error: 'Produkt nicht gefunden',
        });
      }

      const updates: any = {};
      if (name) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (price) updates.price = parseFloat(price);
      if (stock !== undefined) updates.stock = parseInt(stock);
      if (category) updates.category = category;

      if (req.file) {
        updates.image_url = `/api/uploads/${req.file.filename}`;
        // Delete old image if exists
        if (existing.image_url) {
          const oldPath = path.join(uploadsDir, path.basename(existing.image_url));
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }
      }

      const { data: product, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          imageUrl: product.image_url,
          isFeatured: product.is_featured,
        },
      } as any);
    } catch (error) {
      logger.error('Update tailor product error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Aktualisieren des Produkts',
      });
    }
  }
);

/**
 * DELETE /api/tailor-auth/my-products/:id
 * Produkt löschen (Verkäufer)
 */
router.delete(
  '/my-products/:id',
  authenticateTailor,
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const tailorId = req.tailor?.id;
      const { id } = req.params;

      // Prüfen ob Produkt dem Verkäufer gehört
      const { data: existing, error: findError } = await supabase
        .from('products')
        .select('id, image_url, name')
        .eq('id', id)
        .eq('tailor_id', tailorId)
        .single();

      if (findError || !existing) {
        return res.status(404).json({
          success: false,
          error: 'Produkt nicht gefunden',
        });
      }

      // Delete image if exists
      if (existing.image_url) {
        const imagePath = path.join(uploadsDir, path.basename(existing.image_url));
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      logger.info(`Product deleted by tailor ${tailorId}: ${existing.name}`);

      res.json({
        success: true,
        message: 'Produkt gelöscht',
      });
    } catch (error) {
      logger.error('Delete tailor product error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Löschen des Produkts',
      });
    }
  }
);

/**
 * POST /api/tailor-auth/my-patterns
 * Schnittmuster hochladen (Verkäufer)
 */
router.post(
  '/my-patterns',
  authenticateTailor,
  uploadPattern.single('file'),
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const tailorId = req.tailor?.id;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Keine Datei hochgeladen',
        });
      }

      const filename = req.file.filename;
      const name = req.body.name || filename.replace(/\.(pdf|zip)$/i, '');
      const type = filename.endsWith('.zip') ? 'zip' : 'pdf';
      const size = req.file.size;

      const { data: pattern, error } = await supabase
        .from('patterns')
        .insert({
          filename,
          name,
          type,
          size,
          tailor_id: tailorId,
          thumbnail_url: null,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info(`Pattern uploaded by tailor ${tailorId}: ${filename}`);

      res.status(201).json({
        success: true,
        data: {
          id: pattern.id,
          filename: pattern.filename,
          name: pattern.name,
          type: pattern.type,
          sizeFormatted: formatFileSize(pattern.size),
          hasThumbnail: false,
          thumbnailUrl: null,
        },
      } as any);
    } catch (error) {
      logger.error('Upload tailor pattern error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Hochladen des Schnittmusters',
      });
    }
  }
);

/**
 * DELETE /api/tailor-auth/my-patterns/:id
 * Schnittmuster löschen (Verkäufer)
 */
router.delete(
  '/my-patterns/:id',
  authenticateTailor,
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const tailorId = req.tailor?.id;
      const { id } = req.params;

      // Prüfen ob Muster dem Verkäufer gehört
      const { data: existing, error: findError } = await supabase
        .from('patterns')
        .select('id, filename')
        .eq('id', id)
        .eq('tailor_id', tailorId)
        .single();

      if (findError || !existing) {
        return res.status(404).json({
          success: false,
          error: 'Schnittmuster nicht gefunden',
        });
      }

      // Delete file
      const filePath = path.join(patternsDir, existing.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      const { error } = await supabase
        .from('patterns')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      logger.info(`Pattern deleted by tailor ${tailorId}: ${existing.filename}`);

      res.json({
        success: true,
        message: 'Schnittmuster gelöscht',
      });
    } catch (error) {
      logger.error('Delete tailor pattern error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Löschen des Schnittmusters',
      });
    }
  }
);

// Helper function for file size formatting
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default router;
