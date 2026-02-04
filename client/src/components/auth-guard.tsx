import { useEffect } from "react";
import { useLocation } from "wouter";
import { useApp } from "@/context/AppContext";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export function AuthGuard({ children, requiredRoles }: AuthGuardProps) {
  const { user, isAuthenticated, isAuthLoading } = useApp();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      navigate("/login");
    } else if (!isAuthLoading && requiredRoles && user && !requiredRoles.includes(user.role)) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, isAuthLoading, user, requiredRoles, navigate]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
