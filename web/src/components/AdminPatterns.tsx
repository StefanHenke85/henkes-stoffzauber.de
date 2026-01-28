import { useState, useEffect } from 'react';
import {
  FileText,
  Archive,
  Search,
  Download,
  Share2,
  Eye,
  Loader2,
  X,
  Copy,
  Check,
  Clock,
  Link2,
  Trash2,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { patternsApi } from '@/utils/api';

interface Pattern {
  id: string;
  filename: string;
  name: string;
  type: 'pdf' | 'zip';
  size: number;
  sizeFormatted: string;
  createdAt: string;
  modifiedAt: string;
}

interface ShareLink {
  token: string;
  filename: string;
  expiresAt: string;
  createdBy: string;
  shareUrl: string;
}

export function AdminPatterns() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'pdf' | 'zip'>('all');

  // Vorschau Modal
  const [previewPattern, setPreviewPattern] = useState<Pattern | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Share Modal
  const [sharePattern, setSharePattern] = useState<Pattern | null>(null);
  const [shareUrl, setShareUrl] = useState('');
  const [shareExpires, setShareExpires] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Active Shares Modal
  const [showActiveShares, setShowActiveShares] = useState(false);
  const [activeShares, setActiveShares] = useState<ShareLink[]>([]);
  const [sharesLoading, setSharesLoading] = useState(false);

  useEffect(() => {
    loadPatterns();
  }, [search, typeFilter]);

  const loadPatterns = async () => {
    try {
      setLoading(true);
      const response = await patternsApi.getAll(search, typeFilter);
      setPatterns(response.data || []);
    } catch (error) {
      toast.error('Fehler beim Laden der Schnittmuster');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (pattern: Pattern) => {
    if (pattern.type === 'zip') {
      toast.error('ZIP-Dateien können nicht als Vorschau angezeigt werden');
      return;
    }

    setPreviewPattern(pattern);
    setPreviewLoading(true);
  };

  const handleDownload = async (pattern: Pattern) => {
    try {
      const url = await patternsApi.getDownloadUrl(pattern.id);
      window.open(url, '_blank');
      toast.success('Download gestartet');
    } catch (error) {
      toast.error('Fehler beim Download');
    }
  };

  const handleShare = async (pattern: Pattern) => {
    setSharePattern(pattern);
    setShareLoading(true);
    setShareUrl('');
    setShareExpires('');

    try {
      const response = await patternsApi.createShareLink(pattern.id);
      setShareUrl(response.data?.shareUrl || '');
      setShareExpires(response.data?.expiresAt || '');
      toast.success('Share-Link erstellt (24h gültig)');
    } catch (error) {
      toast.error('Fehler beim Erstellen des Share-Links');
      setSharePattern(null);
    } finally {
      setShareLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link kopiert!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Fehler beim Kopieren');
    }
  };

  const loadActiveShares = async () => {
    setSharesLoading(true);
    try {
      const response = await patternsApi.getActiveShares();
      setActiveShares(response.data || []);
    } catch (error) {
      toast.error('Fehler beim Laden der Share-Links');
    } finally {
      setSharesLoading(false);
    }
  };

  const handleDeleteShare = async (token: string) => {
    try {
      await patternsApi.deleteShare(token);
      toast.success('Share-Link gelöscht');
      loadActiveShares();
    } catch (error) {
      toast.error('Fehler beim Löschen');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const pdfCount = patterns.filter((p) => p.type === 'pdf').length;
  const zipCount = patterns.filter((p) => p.type === 'zip').length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-neutral-800">
            Schnittmuster verwalten
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {patterns.length} Dateien ({pdfCount} PDFs, {zipCount} ZIPs)
          </p>
        </div>

        <button
          onClick={() => {
            setShowActiveShares(true);
            loadActiveShares();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-secondary-400 text-neutral-800 rounded-lg hover:bg-secondary-500 transition-colors"
        >
          <Link2 className="h-4 w-4" />
          Aktive Links
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Schnittmuster suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-400"
            >
              <option value="all">Alle Dateien</option>
              <option value="pdf">Nur PDFs ({pdfCount})</option>
              <option value="zip">Nur ZIPs ({zipCount})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Patterns Grid */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-400" />
          <p className="text-gray-500 mt-2">Lade Schnittmuster...</p>
        </div>
      ) : patterns.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Keine Schnittmuster gefunden</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {patterns.map((pattern) => (
            <div
              key={pattern.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Icon/Preview Area */}
              <div
                className={`h-32 flex items-center justify-center ${
                  pattern.type === 'pdf'
                    ? 'bg-red-50'
                    : 'bg-amber-50'
                }`}
              >
                {pattern.type === 'pdf' ? (
                  <FileText className="h-16 w-16 text-red-400" />
                ) : (
                  <Archive className="h-16 w-16 text-amber-500" />
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h3
                  className="font-medium text-neutral-800 truncate mb-1"
                  title={pattern.name}
                >
                  {pattern.name}
                </h3>
                <p className="text-xs text-gray-400 truncate mb-2" title={pattern.filename}>
                  {pattern.filename}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span className="uppercase font-semibold text-xs px-2 py-0.5 rounded bg-gray-100">
                    {pattern.type}
                  </span>
                  <span>{pattern.sizeFormatted}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t px-4 py-3 flex justify-between">
                {pattern.type === 'pdf' && (
                  <button
                    onClick={() => handlePreview(pattern)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Vorschau"
                  >
                    <Eye className="h-5 w-5 text-gray-600" />
                  </button>
                )}
                {pattern.type === 'zip' && <div className="w-9" />}

                <button
                  onClick={() => handleDownload(pattern)}
                  className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Herunterladen"
                >
                  <Download className="h-5 w-5 text-blue-500" />
                </button>

                <button
                  onClick={() => handleShare(pattern)}
                  className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                  title="24h Link teilen"
                >
                  <Share2 className="h-5 w-5 text-green-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewPattern && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold truncate pr-4">
                {previewPattern.name}
              </h3>
              <button
                onClick={() => setPreviewPattern(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-gray-100">
              {previewLoading && (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
                </div>
              )}
              <iframe
                src={patternsApi.getPreviewUrl(previewPattern.id)}
                className="w-full h-full min-h-[600px]"
                title={previewPattern.name}
                onLoad={() => setPreviewLoading(false)}
              />
            </div>
            <div className="p-4 border-t flex justify-end gap-3">
              <button
                onClick={() => handleDownload(previewPattern)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-400 text-white rounded-lg hover:bg-primary-500"
              >
                <Download className="h-4 w-4" />
                Herunterladen
              </button>
              <button
                onClick={() => handleShare(previewPattern)}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                <Share2 className="h-4 w-4" />
                Teilen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {sharePattern && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Link teilen</h3>
              <button
                onClick={() => {
                  setSharePattern(null);
                  setShareUrl('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              <strong>{sharePattern.name}</strong>
            </p>

            {shareLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary-400" />
                <span className="ml-2 text-gray-500">Erstelle Link...</span>
              </div>
            ) : shareUrl ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 bg-transparent text-sm truncate"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`p-2 rounded-lg transition-colors ${
                      copied
                        ? 'bg-green-100 text-green-600'
                        : 'hover:bg-gray-200'
                    }`}
                    title="Link kopieren"
                  >
                    {copied ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                  <Clock className="h-5 w-5 flex-shrink-0" />
                  <span>
                    Dieser Link ist <strong>24 Stunden</strong> gültig und läuft am{' '}
                    {formatDate(shareExpires)} ab.
                  </span>
                </div>

                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-400 text-white rounded-lg hover:bg-primary-500 font-medium"
                >
                  <Copy className="h-5 w-5" />
                  Link kopieren
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Active Shares Modal */}
      {showActiveShares && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Aktive Share-Links</h3>
              <button
                onClick={() => setShowActiveShares(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {sharesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary-400" />
                </div>
              ) : activeShares.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Link2 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Keine aktiven Share-Links</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeShares.map((share) => (
                    <div
                      key={share.token}
                      className="border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate" title={share.filename}>
                            {share.filename}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Erstellt von: {share.createdBy}
                          </p>
                          <p className="text-sm text-amber-600 mt-1">
                            <Clock className="h-4 w-4 inline mr-1" />
                            Läuft ab: {formatDate(share.expiresAt)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(share.shareUrl);
                              toast.success('Link kopiert!');
                            }}
                            className="p-2 hover:bg-gray-200 rounded-lg"
                            title="Link kopieren"
                          >
                            <Copy className="h-5 w-5 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteShare(share.token)}
                            className="p-2 hover:bg-red-50 rounded-lg"
                            title="Link löschen"
                          >
                            <Trash2 className="h-5 w-5 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t">
              <button
                onClick={loadActiveShares}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Aktualisieren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
