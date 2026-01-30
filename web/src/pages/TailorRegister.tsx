import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { User, Mail, Lock, FileText, Loader2, Check, ArrowLeft, Scissors } from 'lucide-react';
import toast from 'react-hot-toast';
import { tailorAuthApi } from '@/utils/api';

export function TailorRegister() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    passwordConfirm: '',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Benutzername ist erforderlich';
    } else if (!/^[a-z0-9_-]{3,30}$/.test(formData.username)) {
      newErrors.username = 'Nur Kleinbuchstaben, Zahlen, _ und - (3-30 Zeichen)';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-Mail ist erforderlich';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ungültige E-Mail-Adresse';
    }

    if (!formData.password) {
      newErrors.password = 'Passwort ist erforderlich';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Mindestens 8 Zeichen';
    }

    if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = 'Passwörter stimmen nicht überein';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      await tailorAuthApi.register({
        name: formData.name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        description: formData.description || undefined,
      });

      setSuccess(true);
      toast.success('Registrierung erfolgreich!');
    } catch (error: any) {
      const message = error.message || 'Fehler bei der Registrierung';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <Helmet>
          <title>Registrierung erfolgreich - Henkes Stoffzauber</title>
        </Helmet>

        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-800 mb-4">
              Registrierung erfolgreich!
            </h1>
            <p className="text-gray-600 mb-6">
              Vielen Dank für Ihre Registrierung. Ihre Anfrage wird nun von unserem Team geprüft.
              Sie erhalten eine E-Mail, sobald Ihr Konto freigeschaltet wurde.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-amber-800 text-sm">
                <strong>Hinweis:</strong> Die Freischaltung kann bis zu 24 Stunden dauern.
              </p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-600 font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück zur Startseite
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Als Verkäufer registrieren - Henkes Stoffzauber</title>
        <meta
          name="description"
          content="Registrieren Sie sich als Verkäufer bei Henkes Stoffzauber und verkaufen Sie Ihre handgefertigten Produkte und Schnittmuster."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Scissors className="h-8 w-8 text-primary-500" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-800 mb-2">
              Als Verkäufer registrieren
            </h1>
            <p className="text-gray-600">
              Werden Sie Teil von Henkes Stoffzauber und verkaufen Sie Ihre handgefertigten Produkte und Schnittmuster
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Ihr Name / Firmenname *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="z.B. Maria Mustermann"
                />
              </div>
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Benutzername *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                <input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent ${
                    errors.username ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="benutzername"
                />
              </div>
              {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
              <p className="text-gray-500 text-xs mt-1">
                Wird für den Login verwendet (nur Kleinbuchstaben, Zahlen, _ und -)
              </p>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-Mail-Adresse *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="ihre@email.de"
                />
              </div>
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Passwort *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Mindestens 8 Zeichen"
                />
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            {/* Password Confirm */}
            <div>
              <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 mb-1">
                Passwort wiederholen *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="passwordConfirm"
                  type="password"
                  value={formData.passwordConfirm}
                  onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent ${
                    errors.passwordConfirm ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Passwort erneut eingeben"
                />
              </div>
              {errors.passwordConfirm && <p className="text-red-500 text-sm mt-1">{errors.passwordConfirm}</p>}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Über Sie (optional)
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  rows={3}
                  placeholder="Erzählen Sie etwas über sich und Ihre Produkte..."
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary-400 text-white rounded-lg font-semibold hover:bg-primary-500 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Scissors className="h-5 w-5" />
                  Registrieren
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-gray-600 text-sm">
              Bereits registriert?{' '}
              <Link to="/verkaeufer/login" className="text-primary-500 hover:text-primary-600 font-medium">
                Hier anmelden
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück zur Startseite
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
