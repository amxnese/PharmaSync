import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DoctorHome from './pages/DoctorHome';
import PharmacistHome from './pages/PharmacistHome';
import ProtectedRoute from './components/ProtectedRoute';
import { isAuthenticated, getRole } from './api/auth';
import ChangePasswordPage from './pages/ChangePasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

function RootRedirect() {
  // if already logged in, skip login page
  if (isAuthenticated()) {
    const role = getRole();
    if (role === 'doctor') return <Navigate to="/doctor" replace />;
    if (role === 'pharmacist') return <Navigate to="/pharmacist" replace />;
  }
  return <LoginPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />

        <Route path="/doctor" element={
          <ProtectedRoute requiredRole="doctor">
            <DoctorHome />
          </ProtectedRoute>
        } />

        <Route path="/pharmacist" element={
          <ProtectedRoute requiredRole="pharmacist">
            <PharmacistHome />
          </ProtectedRoute>
        } />

        <Route path="/change-password" element={
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        } />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

      </Routes>
    </BrowserRouter>
  );
}

