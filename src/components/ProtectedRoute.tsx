import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types';

/** Gates a route behind login, and optionally a specific account role. */
export function ProtectedRoute({ children, role }: { children: ReactNode; role?: UserRole }) {
  const { user, role: userRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p className="text-center text-sm text-gray-400 py-16">Checking your account…</p>;
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (role && userRole !== role) {
    return (
      <main className="max-w-md mx-auto px-4 py-16 text-center space-y-2">
        <p className="font-bold text-gray-900">This page is for {role} accounts.</p>
        <p className="text-sm text-gray-500">Your account is registered as a {userRole ?? 'farmer'}.</p>
      </main>
    );
  }
  return <>{children}</>;
}
