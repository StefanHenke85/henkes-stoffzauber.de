import { Router, Response, Request } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import { authenticateToken, requireAdmin } from '../middleware';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const router = Router();

// Pfad zum Schnittmuster-Ordner
const PATTERNS_DIR = 'C:\\Users\\Stefan\\Desktop\\Henke-Net Projeklte\\schnittmuster\\ebooks';

// In-Memory Store für temporäre Share-Links (in Produktion: Redis oder DB)
interface ShareLink {
  token: string;
  filename: string;
  expiresAt: Date;
  createdBy: string;
}

const shareLinks = new Map<string, ShareLink>();

// Cleanup abgelaufener Links alle 5 Minuten
setInterval(() => {
  const now = new Date();
  for (const [token, link] of shareLinks.entries()) {
    if (link.expiresAt < now) {
      shareLinks.delete(token);
      logger.info(`Expired share link removed: ${token}`);
    }
  }
}, 5 * 60 * 1000);

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
      const type = req.query.type as string; // 'pdf' | 'zip' | 'all'

      // Prüfe ob Verzeichnis existiert
      if (!fs.existsSync(PATTERNS_DIR)) {
        return res.status(404).json({
          success: false,
          error: 'Schnittmuster-Verzeichnis nicht gefunden',
        });
      }

      // Lese alle Dateien
      const files = fs.readdirSync(PATTERNS_DIR);

      // Filtere und transformiere
      let patterns = files
        .filter(file => {
          const ext = path.extname(file).toLowerCase();
          return ext === '.pdf' || ext === '.zip';
        })
        .map(file => {
          const filePath = path.join(PATTERNS_DIR, file);
          const stats = fs.statSync(filePath);
          const ext = path.extname(file).toLowerCase().slice(1);

          return {
            id: Buffer.from(file).toString('base64url'),
            filename: file,
            name: path.basename(file, path.extname(file))
              .replace(/_/g, ' ')
              .replace(/-/g, ' ')
              .replace(/\s+/g, ' ')
              .trim(),
            type: ext,
            size: stats.size,
            sizeFormatted: formatBytes(stats.size),
            createdAt: stats.birthtime.toISOString(),
            modifiedAt: stats.mtime.toISOString(),
          };
        });

      // Filter nach Suche
      if (search) {
        patterns = patterns.filter(p =>
          p.name.toLowerCase().includes(search) ||
          p.filename.toLowerCase().includes(search)
        );
      }

      // Filter nach Typ
      if (type && type !== 'all') {
        patterns = patterns.filter(p => p.type === type);
      }

      // Sortiere nach Name
      patterns.sort((a, b) => a.name.localeCompare(b.name, 'de'));

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
 * GET /api/patterns/:id/preview
 * PDF-Vorschau (erste Seite als Bild) - Admin only
 */
router.get(
  '/:id/preview',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const filename = Buffer.from(req.params.id, 'base64url').toString();
      const filePath = path.join(PATTERNS_DIR, filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error: 'Datei nicht gefunden',
        });
      }

      const ext = path.extname(filename).toLowerCase();

      if (ext === '.pdf') {
        // Sende PDF direkt für Browser-Vorschau
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        fs.createReadStream(filePath).pipe(res);
      } else if (ext === '.zip') {
        // Für ZIP-Dateien: Sende Info
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
      const filename = Buffer.from(req.params.id, 'base64url').toString();
      const filePath = path.join(PATTERNS_DIR, filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error: 'Datei nicht gefunden',
        });
      }

      res.download(filePath, filename);
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
 * POST /api/patterns/:id/share
 * Erstelle einen temporären Share-Link (24 Stunden gültig)
 */
router.post(
  '/:id/share',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const filename = Buffer.from(req.params.id, 'base64url').toString();
      const filePath = path.join(PATTERNS_DIR, filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error: 'Datei nicht gefunden',
        });
      }

      // Generiere eindeutigen Token
      const token = crypto.randomBytes(32).toString('hex');

      // Speichere Link (24 Stunden gültig)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const shareLink: ShareLink = {
        token,
        filename,
        expiresAt,
        createdBy: req.user?.username || 'unknown',
      };

      shareLinks.set(token, shareLink);
      logger.info(`Share link created for ${filename} by ${req.user?.username}`);

      // Erstelle die Share-URL
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
    const shareLink = shareLinks.get(token);

    if (!shareLink) {
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
    if (shareLink.expiresAt < new Date()) {
      shareLinks.delete(token);
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

    const filePath = path.join(PATTERNS_DIR, shareLink.filename);

    if (!fs.existsSync(filePath)) {
      shareLinks.delete(token);
      return res.status(404).send('Datei nicht gefunden');
    }

    logger.info(`Shared file downloaded: ${shareLink.filename} (token: ${token.slice(0, 8)}...)`);

    res.download(filePath, shareLink.filename);
  } catch (error) {
    logger.error('Shared download error:', error);
    res.status(500).send('Fehler beim Download');
  }
});

/**
 * GET /api/patterns/shares
 * Liste aller aktiven Share-Links (Admin only)
 */
router.get(
  '/shares/active',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
      const now = new Date();
      const activeLinks = Array.from(shareLinks.entries())
        .filter(([_, link]) => link.expiresAt > now)
        .map(([token, link]) => ({
          token: token.slice(0, 8) + '...',
          filename: link.filename,
          expiresAt: link.expiresAt.toISOString(),
          createdBy: link.createdBy,
          shareUrl: `${process.env.PUBLIC_URL || 'https://henkes-stoffzauber.de'}/api/patterns/shared/${token}`,
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
      // Finde den vollständigen Token
      const partialToken = req.params.token;
      let fullToken: string | null = null;

      for (const token of shareLinks.keys()) {
        if (token.startsWith(partialToken) || token === partialToken) {
          fullToken = token;
          break;
        }
      }

      if (!fullToken) {
        return res.status(404).json({
          success: false,
          error: 'Share-Link nicht gefunden',
        });
      }

      shareLinks.delete(fullToken);
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

// Hilfsfunktion: Bytes formatieren
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default router;
