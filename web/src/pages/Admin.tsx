import { useAuth } from '@/contexts/AuthContext';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';
import { Loader2 } from 'lucide-react';

export function Admin() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
      </div>
    );
  }

  return isAuthenticated ? <AdminDashboard /> : <AdminLogin />;
}
