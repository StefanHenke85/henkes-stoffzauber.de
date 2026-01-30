import { Router, Response, Request } from 'express';
import { supabase, DbPattern } from '../config/supabase';
import { AuthRequest, ApiResponse } from '../types';
import { authenticateToken, requireAdmin } from '../middleware';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import multer from 'multer';

const execAsync = promisify(exec);
const router = Router();

// Pfad zum Schnittmuster-Ordner
const PATTERNS_DIR = process.env.PATTERNS_DIR || '/var/www/henkes-stoffzauber.de/patterns';
const THUMBNAILS_DIR = path.join(PATTERNS_DIR, 'thumbnails');

// Multer für Pattern-Upload (PDF/ZIP)
const patternStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(PATTERNS_DIR)) {
      fs.mkdirSync(PATTERNS_DIR, { recursive: true });
    }
    cb(null, PATTERNS_DIR);
  },
  filename: (req, file, cb) => {
    // Behalte Originalname, aber sanitize
    const sanitized = file.originalname
      .replace(/[^a-zA-Z0-9äöüÄÖÜß._-]/g, '_')
      .replace(/__+/g, '_');
    cb(null, sanitized);
  },
});

const uploadPattern = multer({
  storage: patternStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.pdf' || ext === '.zip') {
      cb(null, true);
    } else {
      cb(new Error('Nur PDF und ZIP Dateien erlaubt'));
    }
  },
});

// Multer für Thumbnail-Upload (Bilder)
const thumbnailStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(THUMBNAILS_DIR)) {
      fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });
    }
    cb(null, THUMBNAILS_DIR);
  },
  filename: (req, file, cb) => {
    const patternId = req.params.id;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `custom_${patternId}${ext}`);
  },
});

const uploadThumbnail = multer({
  storage: thumbnailStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Nur Bilder erlaubt (JPG, PNG, WebP, GIF)'));
    }
  },
});

// Hilfsfunktion: Bytes formatieren
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Hilfsfunktion: Thumbnail für PDF generieren
async function generateThumbnail(pdfPath: string, filename: string): Promise<string | null> {
  try {
    if (!fs.existsSync(THUMBNAILS_DIR)) {
      fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });
    }

    const thumbnailName = filename.replace(/\.pdf$/i, '.jpg');
    const thumbnailPath = path.join(THUMBNAILS_DIR, thumbnailName);

    // Wenn Thumbnail bereits existiert, überspringe
    if (fs.existsSync(thumbnailPath)) {
      return thumbnailName;
    }

    // Verwende pdftoppm um erste Seite als JPEG zu rendern
    // -f 1 -l 1: nur erste Seite, -jpeg: JPEG format, -scale-to 400: max 400px
    const cmd = `pdftoppm -f 1 -l 1 -jpeg -scale-to 400 "${pdfPath}" "${thumbnailPath.replace('.jpg', '')}"`;

    await execAsync(cmd);

    // pdftoppm fügt "-1" an den Dateinamen an
    const generatedFile = thumbnailPath.replace('.jpg', '-1.jpg');
    if (fs.existsSync(generatedFile)) {
      fs.renameSync(generatedFile, thumbnailPath);
      return thumbnailName;
    }

    return null;
  } catch (error) {
    logger.error('Thumbnail generation error:', error);
    return null;
  }
}

/**
 * GET /api/patterns
 * Liste aller Schnittmuster (Admin only)
 */
router.get(
  '/',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const search = (req.query.search as string || '').toLowerCase();
      const type = req.query.type as string;

      let query = supabase
        .from('patterns')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (type && type !== 'all') {
        query = query.eq('file_type', type);
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,filename.ilike.%${search}%`);
      }

      const { data: dbPatterns, error } = await query;

      if (error) {
        logger.error('Supabase patterns query failed:', error);
        return res.status(500).json({
          success: false,
          error: 'Fehler beim Laden der Schnittmuster',
        });
      }

      const patterns = (dbPatterns || []).map((p: DbPattern) => ({
        id: p.id,
        filename: p.filename,
        name: p.name,
        description: p.description,
        type: p.file_type,
        size: p.file_size,
        sizeFormatted: formatBytes(p.file_size),
        category: p.category,
        tags: p.tags,
        downloadCount: p.download_count,
        createdAt: p.created_at,
        modifiedAt: p.updated_at,
        hasThumbnail: p.file_type === 'pdf' || !!p.thumbnail_url,
        thumbnailUrl: p.thumbnail_url,
        tailorId: p.tailor_id,
      }));

      res.json({
        success: true,
        data: patterns,
      } as any);
    } catch (error) {
      logger.error('Get patterns error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Laden der Schnittmuster',
      });
    }
  }
);

/**
 * GET /api/patterns/:id/thumbnail
 * Thumbnail (custom oder auto-generiert) als Bild (Admin only)
 */
router.get(
  '/:id/thumbnail',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const patternId = req.params.id;

      const { data: pattern, error } = await supabase
        .from('patterns')
        .select('filename, file_path, file_type, thumbnail_url')
        .eq('id', patternId)
        .single();

      if (error || !pattern) {
        return res.status(404).json({
          success: false,
          error: 'Schnittmuster nicht gefunden',
        });
      }

      // Prüfe zuerst auf Custom-Thumbnail
      if (pattern.thumbnail_url) {
        // Custom Thumbnail - prüfe ob lokale Datei oder URL
        if (pattern.thumbnail_url.startsWith('http')) {
          // Externe URL - redirect
          return res.redirect(pattern.thumbnail_url);
        } else {
          // Lokale Datei
          const customPath = path.join(THUMBNAILS_DIR, pattern.thumbnail_url);
          if (fs.existsSync(customPath)) {
            const ext = path.extname(customPath).toLowerCase();
            const contentType = ext === '.png' ? 'image/png' :
                               ext === '.webp' ? 'image/webp' :
                               ext === '.gif' ? 'image/gif' : 'image/jpeg';
            res.setHeader('Content-Type', contentType);
            res.setHeader('Cache-Control', 'public, max-age=86400');
            return fs.createReadStream(customPath).pipe(res);
          }
        }
      }

      // ZIP-Dateien haben kein auto-generiertes Thumbnail
      if (pattern.file_type === 'zip') {
        return res.status(404).json({
          success: false,
          error: 'Keine Vorschau für ZIP-Dateien',
        });
      }

      const pdfPath = path.join(PATTERNS_DIR, pattern.file_path || pattern.filename);

      if (!fs.existsSync(pdfPath)) {
        return res.status(404).json({
          success: false,
          error: 'PDF nicht gefunden',
        });
      }

      // Generiere Thumbnail (wird gecached)
      const thumbnailName = await generateThumbnail(pdfPath, pattern.filename);

      if (!thumbnailName) {
        return res.status(500).json({
          success: false,
          error: 'Thumbnail konnte nicht erstellt werden',
        });
      }

      const thumbnailPath = path.join(THUMBNAILS_DIR, thumbnailName);

      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 24h Cache
      fs.createReadStream(thumbnailPath).pipe(res);
    } catch (error) {
      logger.error('Thumbnail error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Laden des Thumbnails',
      });
    }
  }
);

/**
 * GET /api/patterns/:id/preview
 * PDF-Vorschau - Admin only
 */
router.get(
  '/:id/preview',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const patternId = req.params.id;

      const { data: pattern, error } = await supabase
        .from('patterns')
        .select('filename, file_path')
        .eq('id', patternId)
        .single();

      if (error || !pattern) {
        return res.status(404).json({
          success: false,
          error: 'Schnittmuster nicht gefunden',
        });
      }

      const filePath = path.join(PATTERNS_DIR, pattern.file_path || pattern.filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error: 'Datei nicht gefunden',
        });
      }

      const ext = path.extname(pattern.filename).toLowerCase();

      if (ext === '.pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${pattern.filename}"`);
        fs.createReadStream(filePath).pipe(res);
      } else if (ext === '.zip') {
        res.json({
          success: true,
          data: {
            type: 'zip',
            message: 'ZIP-Dateien können nicht als Vorschau angezeigt werden',
          },
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Nicht unterstütztes Dateiformat',
        });
      }
    } catch (error) {
      logger.error('Pattern preview error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Laden der Vorschau',
      });
    }
  }
);

/**
 * GET /api/patterns/:id/download
 * Direkter Download (Admin only)
 */
router.get(
  '/:id/download',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const patternId = req.params.id;

      const { data: pattern, error } = await supabase
        .from('patterns')
        .select('id, filename, file_path')
        .eq('id', patternId)
        .single();

      if (error || !pattern) {
        return res.status(404).json({
          success: false,
          error: 'Schnittmuster nicht gefunden',
        });
      }

      const filePath = path.join(PATTERNS_DIR, pattern.file_path || pattern.filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error: 'Datei nicht gefunden',
        });
      }

      // Erhöhe Download-Counter
      await supabase.rpc('increment_pattern_download', { p_pattern_id: patternId });

      logger.info(`Pattern downloaded: ${pattern.filename} by ${req.user?.username}`);
      res.download(filePath, pattern.filename);
    } catch (error) {
      logger.error('Pattern download error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Download',
      });
    }
  }
);

/**
 * POST /api/patterns/upload
 * Neues Schnittmuster hochladen (Admin only)
 */
router.post(
  '/upload',
  authenticateToken,
  requireAdmin,
  uploadPattern.single('file'),
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Keine Datei hochgeladen',
        });
      }

      const file = req.file;
      const ext = path.extname(file.filename).toLowerCase();

      // Prüfe ob Datei bereits existiert
      const { data: existing } = await supabase
        .from('patterns')
        .select('id')
        .eq('filename', file.filename)
        .single();

      if (existing) {
        // Lösche hochgeladene Datei
        fs.unlinkSync(file.path);
        return res.status(409).json({
          success: false,
          error: 'Eine Datei mit diesem Namen existiert bereits',
        });
      }

      const name = path.basename(file.filename, ext)
        .replace(/_/g, ' ')
        .replace(/-/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // In Datenbank speichern
      const { data: newPattern, error: insertError } = await supabase
        .from('patterns')
        .insert({
          filename: file.filename,
          name,
          file_type: ext.slice(1),
          file_size: file.size,
          file_path: file.filename,
          is_active: true,
        })
        .select()
        .single();

      if (insertError) {
        // Lösche Datei bei DB-Fehler
        fs.unlinkSync(file.path);
        throw insertError;
      }

      logger.info(`Pattern uploaded: ${file.filename} by ${req.user?.username}`);

      res.json({
        success: true,
        data: {
          id: newPattern.id,
          filename: file.filename,
          name,
          type: ext.slice(1),
          size: file.size,
          sizeFormatted: formatBytes(file.size),
        },
      });
    } catch (error) {
      logger.error('Pattern upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Hochladen',
      });
    }
  }
);

/**
 * POST /api/patterns/:id/thumbnail
 * Custom Thumbnail hochladen (Admin only)
 */
router.post(
  '/:id/thumbnail',
  authenticateToken,
  requireAdmin,
  uploadThumbnail.single('thumbnail'),
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const patternId = req.params.id;

      // Prüfe ob Pattern existiert
      const { data: pattern, error: findError } = await supabase
        .from('patterns')
        .select('id, filename, thumbnail_url')
        .eq('id', patternId)
        .single();

      if (findError || !pattern) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(404).json({
          success: false,
          error: 'Schnittmuster nicht gefunden',
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Kein Thumbnail hochgeladen',
        });
      }

      // Lösche altes custom Thumbnail falls vorhanden
      if (pattern.thumbnail_url && !pattern.thumbnail_url.startsWith('http')) {
        const oldPath = path.join(THUMBNAILS_DIR, pattern.thumbnail_url);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      // Speichere neuen Dateinamen in DB
      const thumbnailFilename = req.file.filename;
      const { error: updateError } = await supabase
        .from('patterns')
        .update({ thumbnail_url: thumbnailFilename })
        .eq('id', patternId);

      if (updateError) {
        fs.unlinkSync(req.file.path);
        throw updateError;
      }

      logger.info(`Thumbnail uploaded for ${pattern.filename} by ${req.user?.username}`);

      res.json({
        success: true,
        data: {
          thumbnailUrl: thumbnailFilename,
        },
      });
    } catch (error) {
      logger.error('Thumbnail upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Hochladen des Thumbnails',
      });
    }
  }
);

/**
 * PUT /api/patterns/:id/thumbnail-url
 * Externe Thumbnail-URL setzen (z.B. von stoffe.de) (Admin only)
 */
router.put(
  '/:id/thumbnail-url',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const patternId = req.params.id;
      const { thumbnailUrl } = req.body;

      // Prüfe ob Pattern existiert
      const { data: pattern, error: findError } = await supabase
        .from('patterns')
        .select('id, filename, thumbnail_url')
        .eq('id', patternId)
        .single();

      if (findError || !pattern) {
        return res.status(404).json({
          success: false,
          error: 'Schnittmuster nicht gefunden',
        });
      }

      // Lösche altes custom Thumbnail falls lokal vorhanden
      if (pattern.thumbnail_url && !pattern.thumbnail_url.startsWith('http')) {
        const oldPath = path.join(THUMBNAILS_DIR, pattern.thumbnail_url);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      // Speichere URL in DB (kann auch null/leer sein zum Zurücksetzen)
      const { error: updateError } = await supabase
        .from('patterns')
        .update({ thumbnail_url: thumbnailUrl || null })
        .eq('id', patternId);

      if (updateError) {
        throw updateError;
      }

      logger.info(`Thumbnail URL set for ${pattern.filename} by ${req.user?.username}: ${thumbnailUrl || '(removed)'}`);

      res.json({
        success: true,
        data: {
          thumbnailUrl: thumbnailUrl || null,
        },
      });
    } catch (error) {
      logger.error('Set thumbnail URL error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Setzen der Thumbnail-URL',
      });
    }
  }
);

/**
 * DELETE /api/patterns/:id/thumbnail
 * Custom Thumbnail löschen (zurück zu auto-generiert) (Admin only)
 */
router.delete(
  '/:id/thumbnail',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const patternId = req.params.id;

      const { data: pattern, error: findError } = await supabase
        .from('patterns')
        .select('id, filename, thumbnail_url')
        .eq('id', patternId)
        .single();

      if (findError || !pattern) {
        return res.status(404).json({
          success: false,
          error: 'Schnittmuster nicht gefunden',
        });
      }

      // Lösche lokales Thumbnail falls vorhanden
      if (pattern.thumbnail_url && !pattern.thumbnail_url.startsWith('http')) {
        const thumbnailPath = path.join(THUMBNAILS_DIR, pattern.thumbnail_url);
        if (fs.existsSync(thumbnailPath)) {
          fs.unlinkSync(thumbnailPath);
        }
      }

      // Setze thumbnail_url auf null
      const { error: updateError } = await supabase
        .from('patterns')
        .update({ thumbnail_url: null })
        .eq('id', patternId);

      if (updateError) {
        throw updateError;
      }

      logger.info(`Thumbnail removed for ${pattern.filename} by ${req.user?.username}`);

      res.json({
        success: true,
        message: 'Thumbnail entfernt',
      });
    } catch (error) {
      logger.error('Delete thumbnail error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Entfernen des Thumbnails',
      });
    }
  }
);

/**
 * DELETE /api/patterns/:id
 * Schnittmuster löschen (Admin only)
 */
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const patternId = req.params.id;

      const { data: pattern, error: findError } = await supabase
        .from('patterns')
        .select('filename, file_path')
        .eq('id', patternId)
        .single();

      if (findError || !pattern) {
        return res.status(404).json({
          success: false,
          error: 'Schnittmuster nicht gefunden',
        });
      }

      // Lösche aus Datenbank
      const { error: deleteError } = await supabase
        .from('patterns')
        .delete()
        .eq('id', patternId);

      if (deleteError) {
        throw deleteError;
      }

      // Lösche Datei vom Filesystem
      const filePath = path.join(PATTERNS_DIR, pattern.file_path || pattern.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Lösche Thumbnail falls vorhanden
      const thumbnailPath = path.join(THUMBNAILS_DIR, pattern.filename.replace(/\.pdf$/i, '.jpg'));
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }

      logger.info(`Pattern deleted: ${pattern.filename} by ${req.user?.username}`);

      res.json({
        success: true,
        message: 'Schnittmuster gelöscht',
      });
    } catch (error) {
      logger.error('Pattern delete error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Löschen',
      });
    }
  }
);

/**
 * POST /api/patterns/:id/share
 * Erstelle einen temporären Share-Link (24 Stunden gültig)
 */
router.post(
  '/:id/share',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const patternId = req.params.id;

      const { data: pattern, error } = await supabase
        .from('patterns')
        .select('id, filename, file_path')
        .eq('id', patternId)
        .single();

      if (error || !pattern) {
        return res.status(404).json({
          success: false,
          error: 'Schnittmuster nicht gefunden',
        });
      }

      // Prüfe ob Datei existiert
      const filePath = path.join(PATTERNS_DIR, pattern.file_path || pattern.filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error: 'Datei nicht gefunden',
        });
      }

      // Generiere Token
      const token = crypto.randomBytes(32).toString('hex');

      // Ablaufdatum (24 Stunden)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Speichere in Supabase
      const { error: insertError } = await supabase
        .from('pattern_shares')
        .insert({
          token,
          pattern_id: pattern.id,
          expires_at: expiresAt.toISOString(),
          created_by: req.user?.username || 'unknown',
        });

      if (insertError) {
        logger.error('Failed to save share link:', insertError);
        return res.status(500).json({
          success: false,
          error: 'Fehler beim Erstellen des Share-Links',
        });
      }

      logger.info(`Share link created for ${pattern.filename} by ${req.user?.username}`);

      const baseUrl = process.env.PUBLIC_URL || 'https://henkes-stoffzauber.de';
      const shareUrl = `${baseUrl}/api/patterns/shared/${token}`;

      res.json({
        success: true,
        data: {
          shareUrl,
          expiresAt: expiresAt.toISOString(),
          expiresIn: '24 Stunden',
        },
      });
    } catch (error) {
      logger.error('Create share link error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Erstellen des Share-Links',
      });
    }
  }
);

/**
 * GET /api/patterns/shared/:token
 * Download über Share-Link (öffentlich, temporär)
 */
router.get('/shared/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    // Suche Share-Link in Supabase
    const { data: shareLink, error } = await supabase
      .from('pattern_shares')
      .select(`
        *,
        patterns (
          id,
          filename,
          file_path
        )
      `)
      .eq('token', token)
      .single();

    if (error || !shareLink) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="de">
        <head>
          <meta charset="UTF-8">
          <title>Link ungültig - Henkes Stoffzauber</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 600px; margin: 100px auto; padding: 20px; text-align: center; }
            h1 { color: #e74c3c; }
            p { color: #666; }
            a { color: #3498db; }
          </style>
        </head>
        <body>
          <h1>Link ungültig</h1>
          <p>Dieser Download-Link existiert nicht oder ist abgelaufen.</p>
          <p><a href="https://henkes-stoffzauber.de">Zur Startseite</a></p>
        </body>
        </html>
      `);
    }

    // Prüfe Ablaufdatum
    if (new Date(shareLink.expires_at) < new Date()) {
      // Lösche abgelaufenen Link
      await supabase.from('pattern_shares').delete().eq('id', shareLink.id);

      return res.status(410).send(`
        <!DOCTYPE html>
        <html lang="de">
        <head>
          <meta charset="UTF-8">
          <title>Link abgelaufen - Henkes Stoffzauber</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 600px; margin: 100px auto; padding: 20px; text-align: center; }
            h1 { color: #e74c3c; }
            p { color: #666; }
            a { color: #3498db; }
          </style>
        </head>
        <body>
          <h1>Link abgelaufen</h1>
          <p>Dieser Download-Link ist leider abgelaufen. Bitte fordere einen neuen Link an.</p>
          <p><a href="https://henkes-stoffzauber.de">Zur Startseite</a></p>
        </body>
        </html>
      `);
    }

    const pattern = shareLink.patterns as any;
    if (!pattern) {
      return res.status(404).send('Schnittmuster nicht gefunden');
    }

    const filePath = path.join(PATTERNS_DIR, pattern.file_path || pattern.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Datei nicht gefunden');
    }

    // Erhöhe Access-Counter
    await supabase.rpc('increment_share_access', { p_token: token });

    logger.info(`Shared file downloaded: ${pattern.filename} (token: ${token.slice(0, 8)}...)`);

    res.download(filePath, pattern.filename);
  } catch (error) {
    logger.error('Shared download error:', error);
    res.status(500).send('Fehler beim Download');
  }
});

/**
 * GET /api/patterns/shares/active
 * Liste aller aktiven Share-Links (Admin only)
 */
router.get(
  '/shares/active',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const { data: shares, error } = await supabase
        .from('pattern_shares')
        .select(`
          id,
          token,
          expires_at,
          created_by,
          access_count,
          created_at,
          patterns (
            filename
          )
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Get active shares error:', error);
        return res.status(500).json({
          success: false,
          error: 'Fehler beim Laden der Share-Links',
        });
      }

      const baseUrl = process.env.PUBLIC_URL || 'https://henkes-stoffzauber.de';

      const activeLinks = (shares || []).map((share: any) => ({
        id: share.id,
        token: share.token.slice(0, 8) + '...',
        fullToken: share.token,
        filename: share.patterns?.filename || 'Unbekannt',
        expiresAt: share.expires_at,
        createdBy: share.created_by,
        accessCount: share.access_count,
        shareUrl: `${baseUrl}/api/patterns/shared/${share.token}`,
      }));

      res.json({
        success: true,
        data: activeLinks,
      } as any);
    } catch (error) {
      logger.error('Get active shares error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Laden der Share-Links',
      });
    }
  }
);

/**
 * DELETE /api/patterns/shares/:token
 * Lösche einen Share-Link (Admin only)
 */
router.delete(
  '/shares/:token',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const partialToken = req.params.token;

      // Suche den vollständigen Token
      const { data: share, error: findError } = await supabase
        .from('pattern_shares')
        .select('id, token')
        .like('token', `${partialToken}%`)
        .single();

      if (findError || !share) {
        return res.status(404).json({
          success: false,
          error: 'Share-Link nicht gefunden',
        });
      }

      // Lösche den Share-Link
      const { error: deleteError } = await supabase
        .from('pattern_shares')
        .delete()
        .eq('id', share.id);

      if (deleteError) {
        throw deleteError;
      }

      logger.info(`Share link deleted by ${req.user?.username}`);

      res.json({
        success: true,
        message: 'Share-Link gelöscht',
      });
    } catch (error) {
      logger.error('Delete share link error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Löschen des Share-Links',
      });
    }
  }
);

/**
 * POST /api/patterns/sync
 * Synchronisiere Dateien vom Filesystem in die Datenbank (Admin only)
 */
router.post(
  '/sync',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      if (!fs.existsSync(PATTERNS_DIR)) {
        return res.status(404).json({
          success: false,
          error: 'Schnittmuster-Verzeichnis nicht gefunden',
        });
      }

      const files = fs.readdirSync(PATTERNS_DIR);

      // Hole alle existierenden Dateinamen aus der DB
      const { data: existingPatterns } = await supabase
        .from('patterns')
        .select('filename');

      const existingFilenames = new Set((existingPatterns || []).map(p => p.filename));

      // Sammle alle neuen Dateien
      const newPatterns: Array<{
        filename: string;
        name: string;
        file_type: string;
        file_size: number;
        file_path: string;
        is_active: boolean;
      }> = [];

      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (ext !== '.pdf' && ext !== '.zip') continue;

        // Überspringe wenn bereits in DB
        if (existingFilenames.has(file)) continue;

        const filePath = path.join(PATTERNS_DIR, file);
        const stats = fs.statSync(filePath);

        const name = path.basename(file, ext)
          .replace(/_/g, ' ')
          .replace(/-/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        newPatterns.push({
          filename: file,
          name,
          file_type: ext.slice(1),
          file_size: stats.size,
          file_path: file,
          is_active: true,
        });
      }

      let added = 0;
      const skipped = existingFilenames.size;

      // Batch-Insert in Gruppen von 50
      if (newPatterns.length > 0) {
        const batchSize = 50;
        for (let i = 0; i < newPatterns.length; i += batchSize) {
          const batch = newPatterns.slice(i, i + batchSize);
          const { error: insertError } = await supabase
            .from('patterns')
            .insert(batch);

          if (!insertError) {
            added += batch.length;
          } else {
            logger.error('Batch insert error:', insertError);
          }
        }
      }

      logger.info(`Pattern sync completed: ${added} added, ${skipped} already existed`);

      res.json({
        success: true,
        data: {
          added,
          skipped,
          total: files.filter(f => f.endsWith('.pdf') || f.endsWith('.zip')).length,
        },
      });
    } catch (error) {
      logger.error('Pattern sync error:', error);
      res.status(500).json({
        success: false,
        error: 'Fehler beim Synchronisieren',
      });
    }
  }
);

export default router;
