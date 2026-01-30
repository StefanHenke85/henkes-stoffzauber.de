import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Loader2, ArrowLeft, Scissors, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { tailorAuthApi } from '@/utils/api';

export function TailorLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password) {
      toast.error('Bitte Benutzername und Passwort eingeben');
      return;
    }

    setLoading(true);

    try {
      const response = await tailorAuthApi.login(username, password);

      if (response.success && response.data) {
        toast.success(`Willkommen, ${response.data.tailor.name}!`);
        // Speichere Tailor-Daten in localStorage
        localStorage.setItem('tailor', JSON.stringify(response.data.tailor));
        localStorage.setItem('tailor_token', response.data.token);
        navigate('/verkaeufer/dashboard');
      }
    } catch (error: any) {
      const message = error.message || 'Fehler beim Anmelden';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Verkäufer Login - Henkes Stoffzauber</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Scissors className="h-8 w-8 text-primary-500" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-800 mb-2">
              Verkäufer Login
            </h1>
            <p className="text-gray-600">
              Melden Sie sich an, um Ihre Produkte und Schnittmuster zu verwalten
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Benutzername
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  placeholder="Ihr Benutzername"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Passwort
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  placeholder="Ihr Passwort"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary-400 text-white rounded-lg font-semibold hover:bg-primary-500 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Anmelden'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-gray-600 text-sm">
              Noch kein Konto?{' '}
              <Link to="/verkaeufer/registrieren" className="text-primary-500 hover:text-primary-600 font-medium">
                Jetzt registrieren
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
