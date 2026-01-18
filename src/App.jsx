import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth.jsx";
import { Toaster } from "react-hot-toast";
import { useNotifications } from "./hooks/useNotifications";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Marketplace from "./pages/Marketplace";
import SellItem from "./pages/SellItem";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import DeleteAccount from "./pages/DeleteAccount";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="flex h-screen items-center justify-center dark:bg-gray-900 dark:text-gray-200">
        Loading...
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function AppRoutes() {
  useNotifications(); // Activate global notifications here inside Auth context

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Marketplace />} />
        <Route
          path="/sell"
          element={
            <ProtectedRoute>
              <SellItem />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="/item/:id" element={<Marketplace />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route
          path="/delete-account"
          element={
            <ProtectedRoute>
              <DeleteAccount />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" />
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
