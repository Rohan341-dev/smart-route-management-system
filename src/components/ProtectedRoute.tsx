import { useStore } from '../store/useStore';
import { Shield } from 'lucide-react';
import type { UserRole } from '../data/types';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export default function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const currentUser = useStore(s => s.currentUser);

  if (!currentUser) return null;

  if (!allowedRoles.includes(currentUser.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 dark:bg-navy-950 bg-surface-50">
        <div className="glass-card p-8 text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-lg font-bold dark:text-white text-surface-900 mb-2">Access Denied</h2>
          <p className="text-sm dark:text-gray-400 text-surface-500 mb-4">
            You do not have permission to access this page.
          </p>
          <p className="text-xs dark:text-gray-500 text-surface-400">
            Logged in as: <span className="font-medium dark:text-gray-300 text-surface-600">{currentUser.role}</span>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
