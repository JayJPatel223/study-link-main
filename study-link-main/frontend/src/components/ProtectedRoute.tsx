import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/auth";

type ProtectedRouteProps = {
  children: ReactNode;
  requireAuth: boolean;
  redirectTo: string;
};

const ProtectedRoute = ({
  children,
  requireAuth,
  redirectTo,
}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();

  // While loading, show nothing to prevent flashing
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // For auth-required routes: redirect to login if not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // For non-auth routes (like login): redirect to dashboard if already authenticated
  if (!requireAuth && isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // If all conditions pass, render the children
  return <>{children}</>;
};

export default ProtectedRoute;
