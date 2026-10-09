import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function ProtectedRoute(props: { children: ReactNode }) {
  const { user, token, loading } = useAuth();
  if (loading) return null;
  if (!token || !user) return <Navigate to="/auth" replace />;
  return props.children;
}

