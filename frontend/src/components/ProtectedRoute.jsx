import { Navigate } from 'react-router-dom';
import { isAuthenticated, getRole } from '../api/auth';

export default function ProtectedRoute({ children, requiredRole }) {
  if (!isAuthenticated()) {
    // not logged in → back to login
    return <Navigate to="/" replace />;
  }

  if (requiredRole && getRole() !== requiredRole) {
    // logged in but wrong role → back to login
    return <Navigate to="/" replace />;
  }

  return children;
}