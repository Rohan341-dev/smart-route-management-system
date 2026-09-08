import { useStore } from '../store/useStore';
import { LogOut, User } from 'lucide-react';
import { useState } from 'react';

export default function UserMenu() {
  const { currentUser, logout } = useStore();
  const [open, setOpen] = useState(false);

  if (!currentUser) return null;

  const roleColors: Record<string, string> = {
    super_admin: 'from-red-500 to-red-700',
    admin: 'from-electric-500 to-purple-600',
    school_staff: 'from-blue-500 to-blue-700',
    teacher: 'from-emerald-500 to-emerald-700',
    driver: 'from-amber-500 to-orange-600',
    parent: 'from-purple-500 to-purple-700',
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2"
      >
        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${roleColors[currentUser.role]} flex items-center justify-center`}>
          <User className="w-4 h-4 text-white" />
        </div>
        <div className="hidden md:block text-left">
          <p className="text-xs font-medium dark:text-white text-surface-900">{currentUser.name}</p>
          <p className="text-[10px] dark:text-gray-400 text-surface-500 capitalize">{currentUser.role}</p>
        </div>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-48 glass-card p-2 z-50">
            <div className="px-3 py-2 border-b dark:border-white/5 border-surface-200 mb-1">
              <p className="text-xs font-bold dark:text-white text-surface-900">{currentUser.name}</p>
              <p className="text-[10px] dark:text-gray-400 text-surface-500">{currentUser.email}</p>
              <span className="inline-block mt-1 text-[9px] px-2 py-0.5 rounded-full bg-electric-500/20 text-electric-400 font-bold capitalize">
                {currentUser.role}
              </span>
            </div>
            <button
              onClick={() => { logout(); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs dark:text-red-400 text-red-600 dark:hover:bg-red-500/10 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </>
      )}
    </div>
  );
}
