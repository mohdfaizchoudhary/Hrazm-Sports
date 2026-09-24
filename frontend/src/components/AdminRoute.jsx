import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Loading from './Loading';

export default function AdminRoute() {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <Loading message="Verifying permissions..." />;
  return user && user.is_staff ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
