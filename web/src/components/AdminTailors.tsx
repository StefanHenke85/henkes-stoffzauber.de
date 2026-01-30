import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Loader2,
  X,
  Check,
  User,
  Mail,
  Link as LinkIcon,
  ToggleLeft,
  ToggleRight,
  Clock,
  CheckCircle,
  XCircle,
  Key,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { tailorsApi } from '@/utils/api';

interface Tailor {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  contact_email: string | null;
  is_active: boolean;
  username: string | null;
  registration_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export function AdminTailors() {
  const [tailors, setTailors] = useState<Tailor[]>([]);
  const [pendingTailors, setPendingTailors] = useState<Tailor[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTailor, setEditingTailor] = useState<Tailor | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState<Tailor | null>(null);
  const [passwordData, setPasswordData] = useState({ username: '', password: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    logo_url: '',
    contact_email: '',
    is_active: true,
  });

  useEffect(() => {
    loadTailors();
    loadPendingTailors();
  }, []);

  const loadTailors = async () => {
    try {
      setLoading(true);
      const response = await tailorsApi.getAdmin();
      // Map API response to include missing fields with defaults
      const mappedTailors: Tailor[] = (response.data || []).map((t) => ({
        ...t,
        username: (t as any).username || null,
        registration_status: (t as any).registration_status || 'approved',
      }));
      setTailors(mappedTailors);
    } catch (error) {
      toast.error('Fehler beim Laden der Schneider');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingTailors = async () => {
    try {
      setPendingLoading(true);
      const response = await tailorsApi.getPending();
      setPendingTailors(response.data || []);
    } catch (error) {
      console.error('Error loading pending tailors:', error);
    } finally {
      setPendingLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      logo_url: '',
      contact_email: '',
      is_active: true,
    });
    setEditingTailor(null);
    setShowForm(false);
  };

  const handleEdit = (tailor: Tailor) => {
    setEditingTailor(tailor);
    setFormData({
      name: tailor.name,
      slug: tailor.slug,
      description: tailor.description || '',
      logo_url: tailor.logo_url || '',
      contact_email: tailor.contact_email || '',
      is_active: tailor.is_active,
    });
    setShowForm(true);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[äöüß]/g, (match) => {
        const map: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' };
        return map[match] || match;
      })
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: editingTailor ? formData.slug : generateSlug(name),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      if (editingTailor) {
        await tailorsApi.update(editingTailor.id, formData);
        toast.success('Schneider aktualisiert');
      } else {
        await tailorsApi.create(formData);
        toast.success('Schneider erstellt');
      }
      loadTailors();
      resetForm();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Fehler beim Speichern';
      toast.error(message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (tailor: Tailor) => {
    if (!confirm(`Schneider "${tailor.name}" wirklich löschen? Produkte und Schnittmuster werden nicht gelöscht, sondern nur entkoppelt.`)) {
      return;
    }

    try {
      await tailorsApi.delete(tailor.id);
      toast.success('Schneider gelöscht');
      loadTailors();
    } catch (error) {
      toast.error('Fehler beim Löschen');
    }
  };

  const handleToggleActive = async (tailor: Tailor) => {
    try {
      await tailorsApi.update(tailor.id, { is_active: !tailor.is_active });
      toast.success(tailor.is_active ? 'Schneider deaktiviert' : 'Schneider aktiviert');
      loadTailors();
    } catch (error) {
      toast.error('Fehler beim Aktualisieren');
    }
  };

  const handleApprove = async (tailor: Tailor) => {
    try {
      await tailorsApi.approve(tailor.id);
      toast.success(`${tailor.name} wurde freigeschaltet!`);
      loadPendingTailors();
      loadTailors();
    } catch (error) {
      toast.error('Fehler beim Freischalten');
    }
  };

  const handleReject = async (tailor: Tailor) => {
    const reason = prompt('Ablehnungsgrund (optional):');
    if (reason === null) return; // User cancelled

    try {
      await tailorsApi.reject(tailor.id, reason || undefined);
      toast.success(`Registrierung von ${tailor.name} wurde abgelehnt`);
      loadPendingTailors();
    } catch (error) {
      toast.error('Fehler beim Ablehnen');
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPasswordModal) return;

    if (!passwordData.username || !passwordData.password) {
      toast.error('Benutzername und Passwort sind erforderlich');
      return;
    }

    setPasswordLoading(true);
    try {
      await tailorsApi.setPassword(showPasswordModal.id, passwordData.username, passwordData.password);
      toast.success('Login-Daten wurden gesetzt');
      setShowPasswordModal(null);
      setPasswordData({ username: '', password: '' });
      loadTailors();
    } catch (error: any) {
      const message = error.message || 'Fehler beim Setzen der Login-Daten';
      toast.error(message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-8">
      {/* Pending Registrations */}
      {!pendingLoading && pendingTailors.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-6 w-6 text-amber-600" />
            <h2 className="text-lg font-semibold text-amber-900">
              Ausstehende Registrierungen ({pendingTailors.length})
            </h2>
          </div>
          <div className="space-y-3">
            {pendingTailors.map((tailor) => (
              <div
                key={tailor.id}
                className="bg-white rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-800">{tailor.name}</h3>
                    <p className="text-sm text-gray-500">{tailor.contact_email}</p>
                    <p className="text-xs text-gray-400">
                      Registriert: {formatDate(tailor.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(tailor)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Freischalten
                  </button>
                  <button
                    onClick={() => handleReject(tailor)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    Ablehnen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-neutral-800">
            Schneider verwalten
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {tailors.length} Schneider ({tailors.filter(t => t.is_active).length} aktiv)
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-400 text-white rounded-lg hover:bg-primary-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Neuer Schneider
        </button>
      </div>

      {/* Tailors List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-400" />
          <p className="text-gray-500 mt-2">Lade Schneider...</p>
        </div>
      ) : tailors.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Noch keine Schneider angelegt</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-primary-500 hover:underline"
          >
            Ersten Schneider anlegen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tailors.map((tailor) => (
            <div
              key={tailor.id}
              className={`bg-white rounded-xl shadow-sm overflow-hidden border-2 ${
                tailor.is_active ? 'border-transparent' : 'border-gray-200 opacity-60'
              }`}
            >
              {/* Logo/Avatar Area */}
              <div className="h-24 bg-gradient-to-r from-primary-100 to-secondary-100 flex items-center justify-center relative">
                {tailor.logo_url ? (
                  <img
                    src={tailor.logo_url}
                    alt={tailor.name}
                    className="h-16 w-16 rounded-full object-cover border-4 border-white shadow"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center shadow">
                    <User className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                {/* Status Badge */}
                {!tailor.username && tailor.registration_status === 'approved' && (
                  <div className="absolute top-2 right-2">
                    <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Kein Login
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg text-neutral-800">
                      {tailor.name}
                    </h3>
                    <p className="text-xs text-gray-400">/{tailor.slug}</p>
                    {tailor.username && (
                      <p className="text-xs text-primary-500">@{tailor.username}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggleActive(tailor)}
                    className={`p-1 rounded transition-colors ${
                      tailor.is_active
                        ? 'text-green-500 hover:bg-green-50'
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title={tailor.is_active ? 'Aktiv - Klicken zum Deaktivieren' : 'Inaktiv - Klicken zum Aktivieren'}
                  >
                    {tailor.is_active ? (
                      <ToggleRight className="h-6 w-6" />
                    ) : (
                      <ToggleLeft className="h-6 w-6" />
                    )}
                  </button>
                </div>

                {tailor.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {tailor.description}
                  </p>
                )}

                {tailor.contact_email && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{tailor.contact_email}</span>
                  </div>
                )}

                <div className="text-xs text-gray-400 mb-3">
                  Erstellt: {formatDate(tailor.created_at)}
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center gap-2 border-t pt-3">
                  {!tailor.username && (
                    <button
                      onClick={() => {
                        setShowPasswordModal(tailor);
                        setPasswordData({
                          username: tailor.slug.replace(/-/g, '_'),
                          password: '',
                        });
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors text-sm"
                      title="Login-Daten setzen"
                    >
                      <Key className="h-4 w-4" />
                      Login setzen
                    </button>
                  )}
                  <div className="flex gap-2 ml-auto">
                    <button
                      onClick={() => handleEdit(tailor)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Bearbeiten"
                    >
                      <Edit className="h-4 w-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(tailor)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Löschen"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">
                {editingTailor ? 'Schneider bearbeiten' : 'Neuer Schneider'}
              </h3>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="tailor-name" className="block text-sm font-medium mb-1">
                  Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="tailor-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    placeholder="z.B. Andrea Henke"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="tailor-slug" className="block text-sm font-medium mb-1">
                  Slug (URL-Pfad) *
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="tailor-slug"
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    placeholder="z.B. andrea-henke"
                    pattern="[a-z0-9-]+"
                    title="Nur Kleinbuchstaben, Zahlen und Bindestriche"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Wird automatisch aus dem Namen generiert. Nur Kleinbuchstaben, Zahlen und Bindestriche.
                </p>
              </div>

              <div>
                <label htmlFor="tailor-description" className="block text-sm font-medium mb-1">
                  Beschreibung
                </label>
                <textarea
                  id="tailor-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  rows={3}
                  placeholder="Kurze Beschreibung des Schneiders..."
                />
              </div>

              <div>
                <label htmlFor="tailor-email" className="block text-sm font-medium mb-1">
                  Kontakt-E-Mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="tailor-email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="tailor-logo" className="block text-sm font-medium mb-1">
                  Logo-URL
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="tailor-logo"
                    type="url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>
                {formData.logo_url && (
                  <div className="mt-2">
                    <img
                      src={formData.logo_url}
                      alt="Logo Vorschau"
                      className="h-16 w-16 rounded-full object-cover border"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <input
                  id="tailor-active"
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-5 w-5 text-primary-500 rounded border-gray-300"
                />
                <label htmlFor="tailor-active" className="text-sm">
                  Schneider ist aktiv (wird in Listen angezeigt)
                </label>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-400 text-white rounded-lg hover:bg-primary-500 disabled:opacity-50 font-semibold"
              >
                {formLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    {editingTailor ? 'Speichern' : 'Erstellen'}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">
                Login-Daten setzen
              </h3>
              <button
                onClick={() => {
                  setShowPasswordModal(null);
                  setPasswordData({ username: '', password: '' });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              Login-Daten für <strong>{showPasswordModal.name}</strong> setzen.
              Der Schneider kann sich damit unter /schneider/login anmelden.
            </p>

            <form onSubmit={handleSetPassword} className="space-y-4">
              <div>
                <label htmlFor="pw-username" className="block text-sm font-medium mb-1">
                  Benutzername *
                </label>
                <input
                  id="pw-username"
                  type="text"
                  value={passwordData.username}
                  onChange={(e) => setPasswordData({ ...passwordData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  placeholder="benutzername"
                  required
                />
              </div>

              <div>
                <label htmlFor="pw-password" className="block text-sm font-medium mb-1">
                  Passwort *
                </label>
                <input
                  id="pw-password"
                  type="text"
                  value={passwordData.password}
                  onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  placeholder="Passwort eingeben"
                  required
                  minLength={8}
                />
                <p className="text-xs text-gray-500 mt-1">Mindestens 8 Zeichen</p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(null);
                    setPasswordData({ username: '', password: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-400 text-white rounded-lg hover:bg-primary-500 disabled:opacity-50"
                >
                  {passwordLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Key className="h-4 w-4" />
                      Speichern
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
