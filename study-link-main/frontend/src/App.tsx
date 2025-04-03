import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@components/Layout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./hooks/auth";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "@components/ui/toaster";

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Layout wrapper for all pages */}
          <Route path="/" element={<Layout />}>
            {/* Public route, redirect to dashboard if already logged in */}
            <Route
              index
              element={
                <ProtectedRoute requireAuth={false} redirectTo="/dashboard">
                  <Auth />
                </ProtectedRoute>
              }
            />

            {/* Profile page - requires auth */}
            <Route
              path="profile"
              element={
                <ProtectedRoute requireAuth={true} redirectTo="/">
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Dashboard - requires auth */}
            <Route
              path="dashboard"
              element={
                <ProtectedRoute requireAuth={true} redirectTo="/">
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
        <Toaster />
      </AuthProvider>
    </Router>
  );
};

export default App;
