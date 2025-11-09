import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { RoleProvider, useRole } from './contexts/RoleContext';
import LoginPage from './pages/LoginPage';
import HRDashboard from './pages/HRDashboard';
import CandidateDashboard from './pages/CandidateDashboard';
import UploadPage from './pages/UploadPage';
import Navigation from './components/Navigation';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { role } = useRole();
  
  if (!role) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={role === 'hr' ? '/hr/dashboard' : '/candidate/dashboard'} replace />;
  }
  
  return children;
};

// Main App Routes
const AppRoutes = () => {
  const { role } = useRole();

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {role && <Navigation />}
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={role ? <Navigate to={role === 'hr' ? '/hr/dashboard' : '/candidate/dashboard'} replace /> : <LoginPage />} 
          />
          
          {/* HR Routes */}
          <Route
            path="/hr/dashboard"
            element={
              <ProtectedRoute allowedRoles={['hr']}>
                <HRDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/upload"
            element={
              <ProtectedRoute allowedRoles={['hr']}>
                <UploadPage />
              </ProtectedRoute>
            }
          />
          
          {/* Candidate Routes */}
          <Route
            path="/candidate/dashboard"
            element={
              <ProtectedRoute allowedRoles={['candidate']}>
                <CandidateDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Default Route */}
          <Route 
            path="/" 
            element={
              role 
                ? <Navigate to={role === 'hr' ? '/hr/dashboard' : '/candidate/dashboard'} replace />
                : <Navigate to="/login" replace />
            } 
          />
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

// Main App Component
function App() {
  return (
    <RoleProvider>
      <AppRoutes />
    </RoleProvider>
  );
}

export default App;

