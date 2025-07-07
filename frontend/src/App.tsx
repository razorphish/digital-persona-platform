import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LandingPage from "./components/landing/LandingPage";
import TestStyling from "./components/TestStyling";
import ModernLoginForm from "./components/auth/ModernLoginForm";
import ModernRegisterForm from "./components/auth/ModernRegisterForm";
import ModernDashboard from "./components/dashboard/ModernDashboard";
import ModernHomePage from "./components/dashboard/ModernHomePage";
import PersonasPage from "./components/personas/PersonasPage";
import ConversationsPage from "./components/conversations/ConversationsPage";
import ModernChatPage from "./components/chat/ModernChatPage";
import UploadPage from "./components/upload/UploadPage";
import StatsPage from "./components/stats/StatsPage";
import SettingsPage from "./components/settings/SettingsPage";

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public Route Component (redirects to dashboard if already authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return isAuthenticated ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <>{children}</>
  );
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Test Route - Remove this after testing */}
      <Route path="/test" element={<TestStyling />} />

      {/* Landing Page - Public */}
      <Route path="/" element={<LandingPage />} />

      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <ModernLoginForm />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <ModernRegisterForm />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <ModernDashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<ModernHomePage />} />
        <Route path="personas" element={<PersonasPage />} />
        <Route path="conversations" element={<ConversationsPage />} />
        <Route path="conversations/:id" element={<ModernChatPage />} />
        <Route path="upload" element={<UploadPage />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Catch all other routes and redirect to landing page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#363636",
              color: "#fff",
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: "#10B981",
                secondary: "#fff",
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: "#EF4444",
                secondary: "#fff",
              },
            },
          }}
        />
      </AuthProvider>
    </Router>
  );
};

export default App;
