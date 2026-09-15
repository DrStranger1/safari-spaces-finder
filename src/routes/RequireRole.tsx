import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type AppRole = 'admin' | 'landlord' | 'renter';

/**
 * Gates a route behind a specific role (or one of several). Assumes the parent
 * tree has already enforced authentication via RequireAuth.
 *
 * Not yet wired into the route tree — Step 5 will use this for landlord-only
 * routes like `/dashboard/new-listing`.
 */
export default function RequireRole({
  allow,
  children,
  fallback = '/',
}: {
  allow: AppRole | AppRole[];
  children: ReactNode;
  fallback?: string;
}) {
  const { role, isLoading } = useAuth();
  const allowed = Array.isArray(allow) ? allow : [allow];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!role || !allowed.includes(role)) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
