import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Loading from './Loading';

export default function ProtectedRoute() {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <Loading message="Authenticating session..." />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
