import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Shield, Bus, Users, Eye, EyeOff, Mail, Lock, ArrowRight, Zap } from 'lucide-react';
import type { UserRole } from '../data/types';

const roles: { id: UserRole; label: string; sublabel: string; icon: typeof Shield; color: string }[] = [
  { id: 'admin', label: 'Admin', sublabel: 'School Administrator', icon: Shield, color: 'from-electric-500 to-electric-700' },
  { id: 'parent', label: 'Parent', sublabel: 'Student Transportation Portal', icon: Users, color: 'from-emerald-500 to-emerald-700' },
  { id: 'driver', label: 'Driver', sublabel: 'Driver Operations Portal', icon: Bus, color: 'from-amber-500 to-orange-600' },
];

const demoAccounts: { role: UserRole; email: string; password: string; label: string; color: string }[] = [
  { role: 'admin', email: 'admin@smartbus.demo', password: 'admin123', label: 'Login as Admin', color: 'bg-electric-600 hover:bg-electric-700' },
  { role: 'parent', email: 'parent@smartbus.demo', password: 'parent123', label: 'Login as Parent', color: 'bg-emerald-600 hover:bg-emerald-700' },
  { role: 'driver', email: 'driver@smartbus.demo', password: 'driver123', label: 'Login as Driver', color: 'bg-amber-600 hover:bg-orange-600' },
];

export default function Login() {
  const { login } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    const success = login(email, password, selectedRole);
    setLoading(false);
    if (!success) setError('Invalid email or password. Try a demo account below.');
  };

  const handleDemoLogin = async (account: typeof demoAccounts[0]) => {
    setSelectedRole(account.role);
    setEmail(account.email);
    setPassword(account.password);
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    const success = login(account.email, account.password, account.role);
    setLoading(false);
    if (!success) setError('Demo login failed.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 dark:bg-navy-950 bg-surface-50 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 dark:bg-electric-500/10 bg-electric-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 dark:bg-purple-500/10 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-electric-500 to-electric-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-electric-500/30">
            <Bus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black dark:text-white text-surface-900 tracking-tight">SMARTBUS</h1>
          <p className="text-sm dark:text-gray-400 text-surface-500 mt-1">Smart School Transportation Management</p>
        </div>

        <div className="glass-card p-6 md:p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-medium dark:text-gray-300 text-surface-600 mb-1.5 block">Email / Username</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-surface-400" />
                <input
                  type="text"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl dark:bg-navy-700/50 bg-surface-100 dark:border-white/10 border-surface-200 border dark:text-white text-surface-900 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500/50 transition-all"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium dark:text-gray-300 text-surface-600 mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-surface-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl dark:bg-navy-700/50 bg-surface-100 dark:border-white/10 border-surface-200 border dark:text-white text-surface-900 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500/50 transition-all"
                  placeholder="Enter your password"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-gray-500 text-surface-400 hover:text-electric-400 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-3.5 h-3.5 rounded border-surface-300 dark:border-white/20 text-electric-500 focus:ring-electric-500/50" />
                <span className="text-xs dark:text-gray-400 text-surface-500">Remember Me</span>
              </label>
              <button type="button" className="text-xs text-electric-400 hover:text-electric-300 transition-colors">
                Forgot Password?
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <p className="text-xs text-red-400 text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-electric-600 to-electric-700 hover:from-electric-500 hover:to-electric-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-electric-500/25"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  LOGIN
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px dark:bg-white/10 bg-surface-200" />
              <span className="text-[10px] dark:text-gray-500 text-surface-400 font-medium">SELECT ROLE</span>
              <div className="flex-1 h-px dark:bg-white/10 bg-surface-200" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {roles.map(role => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'dark:bg-electric-500/20 bg-electric-50 border-electric-500/50 dark:border-electric-500/30'
                        : 'dark:bg-navy-700/30 bg-surface-50 dark:border-white/5 border-surface-200 hover:border-electric-500/30'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center mx-auto mb-1.5`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <p className={`text-xs font-bold ${isSelected ? 'text-electric-400' : 'dark:text-gray-300 text-surface-700'}`}>{role.label}</p>
                    <p className="text-[9px] dark:text-gray-500 text-surface-400 mt-0.5">{role.sublabel}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px dark:bg-white/10 bg-surface-200" />
              <span className="text-[10px] dark:text-gray-500 text-surface-400 font-medium">QUICK DEMO</span>
              <div className="flex-1 h-px dark:bg-white/10 bg-surface-200" />
            </div>

            <div className="space-y-2">
              {demoAccounts.map(account => (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => handleDemoLogin(account)}
                  disabled={loading}
                  className={`w-full py-2.5 ${account.color} text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2`}
                >
                  {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : account.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] dark:text-gray-500 text-surface-400 mt-6">
          Safe Drives. Smart Routes. Secure Futures.
        </p>
      </div>
    </div>
  );
}
