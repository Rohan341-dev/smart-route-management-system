import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Users, Search, Plus, Edit2, UserX, UserCheck, Shield, Bus, Route, GraduationCap, X, ChevronDown } from 'lucide-react';
import { User, UserRole, UserStatus } from '../../data/types';

const roleLabels: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  school_staff: 'School Staff',
  teacher: 'Teacher',
  driver: 'Driver',
  parent: 'Parent',
};

const roleColors: Record<UserRole, string> = {
  super_admin: 'bg-red-500/20 text-red-400 border-red-500/30',
  admin: 'bg-electric-500/20 text-electric-400 border-electric-500/30',
  school_staff: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  teacher: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  driver: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  parent: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const roleIcons: Record<UserRole, typeof Users> = {
  super_admin: Shield,
  admin: Shield,
  school_staff: Users,
  teacher: GraduationCap,
  driver: Bus,
  parent: Users,
};

export default function UserManagement() {
  const { users, vehicles, routes, students, addUser, updateUser } = useStore();
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'driver' as UserRole,
    status: 'active' as UserStatus,
    assignedVehicleId: '',
    assignedRouteId: '',
    studentIds: [] as string[],
  });

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const openAddForm = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', phone: '', role: 'driver', status: 'active', assignedVehicleId: '', assignedRouteId: '', studentIds: [] });
    setShowForm(true);
  };

  const openEditForm = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      status: user.status,
      assignedVehicleId: user.assignedVehicleId || '',
      assignedRouteId: user.assignedRouteId || '',
      studentIds: user.studentIds || [],
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.email) return;

    if (editingUser) {
      updateUser(editingUser.id, {
        ...formData,
        phone: formData.phone || undefined,
        assignedVehicleId: formData.assignedVehicleId || undefined,
        assignedRouteId: formData.assignedRouteId || undefined,
        studentIds: formData.studentIds.length > 0 ? formData.studentIds : undefined,
      });
    } else {
      addUser({
        id: `USR-${Date.now()}`,
        ...formData,
        phone: formData.phone || undefined,
        assignedVehicleId: formData.assignedVehicleId || undefined,
        assignedRouteId: formData.assignedRouteId || undefined,
        studentIds: formData.studentIds.length > 0 ? formData.studentIds : undefined,
        createdAt: new Date().toISOString(),
      });
    }
    setShowForm(false);
    setEditingUser(null);
  };

  const toggleUserStatus = (user: User) => {
    updateUser(user.id, {
      status: user.status === 'active' ? 'inactive' : 'active',
    });
  };

  const drivers = users.filter(u => u.role === 'driver');
  const parents = users.filter(u => u.role === 'parent');
  const assignedStudentIds = users.flatMap(u => u.studentIds || []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold dark:text-white text-surface-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-electric-400" />
            User Management
          </h1>
          <p className="text-xs dark:text-gray-400 text-surface-500 mt-0.5">Manage all system users, roles, and assignments.</p>
        </div>
        <button onClick={openAddForm} className="btn-primary text-xs py-2 px-4 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {(['super_admin', 'admin', 'school_staff', 'teacher', 'driver', 'parent'] as UserRole[]).map(role => {
          const count = users.filter(u => u.role === role).length;
          const Icon = roleIcons[role];
          return (
            <div key={role} className="glass-card p-3 text-center">
              <Icon className="w-4 h-4 mx-auto mb-1 text-gray-400" />
              <p className="text-lg font-bold dark:text-white text-surface-900">{count}</p>
              <p className="text-[9px] dark:text-gray-400 text-surface-500">{roleLabels[role]}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-400 text-surface-500" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10 text-xs"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterRole('all')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
              filterRole === 'all' ? 'bg-electric-600 text-white' : 'dark:bg-navy-700/50 bg-surface-100 dark:text-gray-400 text-surface-500'
            }`}
          >All</button>
          {(['driver', 'parent', 'teacher', 'school_staff'] as UserRole[]).map(role => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                filterRole === role ? 'bg-electric-600 text-white' : 'dark:bg-navy-700/50 bg-surface-100 dark:text-gray-400 text-surface-500'
              }`}
            >{roleLabels[role]}</button>
          ))}
        </div>
      </div>

      {/* User Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-white/5 border-surface-200">
                <th className="text-left text-[10px] font-bold dark:text-gray-400 text-surface-500 uppercase px-4 py-3">Name</th>
                <th className="text-left text-[10px] font-bold dark:text-gray-400 text-surface-500 uppercase px-4 py-3">Role</th>
                <th className="text-left text-[10px] font-bold dark:text-gray-400 text-surface-500 uppercase px-4 py-3">Phone</th>
                <th className="text-left text-[10px] font-bold dark:text-gray-400 text-surface-500 uppercase px-4 py-3">Assigned Bus</th>
                <th className="text-left text-[10px] font-bold dark:text-gray-400 text-surface-500 uppercase px-4 py-3">Route</th>
                <th className="text-left text-[10px] font-bold dark:text-gray-400 text-surface-500 uppercase px-4 py-3">Status</th>
                <th className="text-left text-[10px] font-bold dark:text-gray-400 text-surface-500 uppercase px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => {
                const RoleIcon = roleIcons[user.role];
                return (
                  <tr key={user.id} className="border-b dark:border-white/5 border-surface-200 dark:hover:bg-white/5 hover:bg-surface-50 transition-all">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-electric-600/20 flex items-center justify-center">
                          <RoleIcon className="w-4 h-4 text-electric-400" />
                        </div>
                        <div>
                          <p className="text-xs font-bold dark:text-white text-surface-900">{user.name}</p>
                          <p className="text-[10px] dark:text-gray-400 text-surface-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${roleColors[user.role]}`}>
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[10px] dark:text-gray-400 text-surface-500">{user.phone || '--'}</td>
                    <td className="px-4 py-3 text-[10px] dark:text-gray-400 text-surface-500">{user.assignedVehicleId || '--'}</td>
                    <td className="px-4 py-3 text-[10px] dark:text-gray-400 text-surface-500">{user.assignedRouteId || '--'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                        user.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      }`}>
                        {user.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditForm(user)} className="p-1.5 rounded-lg hover:bg-electric-600/20 transition-all" title="Edit">
                          <Edit2 className="w-3.5 h-3.5 text-electric-400" />
                        </button>
                        <button onClick={() => toggleUserStatus(user)} className="p-1.5 rounded-lg hover:bg-amber-600/20 transition-all" title={user.status === 'active' ? 'Deactivate' : 'Activate'}>
                          {user.status === 'active' ? <UserX className="w-3.5 h-3.5 text-amber-400" /> : <UserCheck className="w-3.5 h-3.5 text-emerald-400" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-xs dark:text-gray-400 text-surface-500">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowForm(false)}>
          <div className="dark:bg-navy-800 bg-white dark:border-white/10 border-surface-200 border rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b dark:border-white/5 border-surface-200">
              <h3 className="text-sm font-bold dark:text-white text-surface-900">{editingUser ? 'Edit User' : 'Add New User'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg dark:hover:bg-white/10 hover:bg-surface-100"><X className="w-4 h-4 dark:text-gray-400 text-surface-500" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] dark:text-gray-400 text-surface-500 uppercase tracking-wider">Full Name *</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field text-xs" placeholder="John Doe" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] dark:text-gray-400 text-surface-500 uppercase tracking-wider">Email *</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="input-field text-xs" placeholder="john@school.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] dark:text-gray-400 text-surface-500 uppercase tracking-wider">Phone</label>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="input-field text-xs" placeholder="+977-9841234567" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] dark:text-gray-400 text-surface-500 uppercase tracking-wider">Role *</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})} className="input-field text-xs">
                    {(['super_admin', 'admin', 'school_staff', 'teacher', 'driver', 'parent'] as UserRole[]).map(r => (
                      <option key={r} value={r}>{roleLabels[r]}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Role-specific assignments */}
              {(formData.role === 'driver') && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] dark:text-gray-400 text-surface-500 uppercase tracking-wider">Assigned Bus</label>
                    <select value={formData.assignedVehicleId} onChange={e => setFormData({...formData, assignedVehicleId: e.target.value})} className="input-field text-xs">
                      <option value="">-- None --</option>
                      {vehicles.map(v => <option key={v.id} value={v.id}>{v.id} - {v.routeName}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] dark:text-gray-400 text-surface-500 uppercase tracking-wider">Assigned Route</label>
                    <select value={formData.assignedRouteId} onChange={e => setFormData({...formData, assignedRouteId: e.target.value})} className="input-field text-xs">
                      <option value="">-- None --</option>
                      {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {formData.role === 'parent' && (
                <div className="space-y-1">
                  <label className="text-[10px] dark:text-gray-400 text-surface-500 uppercase tracking-wider">Children (Students)</label>
                  <div className="dark:bg-navy-700/50 bg-surface-100 rounded-lg p-2 max-h-32 overflow-y-auto space-y-1">
                    {students.map(s => (
                      <label key={s.id} className="flex items-center gap-2 text-[10px] dark:text-gray-300 text-surface-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.studentIds.includes(s.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setFormData({...formData, studentIds: [...formData.studentIds, s.id]});
                            } else {
                              setFormData({...formData, studentIds: formData.studentIds.filter(id => id !== s.id)});
                            }
                          }}
                          className="rounded"
                        />
                        {s.fullName} ({s.studentId})
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {(formData.role === 'teacher' || formData.role === 'school_staff') && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] dark:text-gray-400 text-surface-500 uppercase tracking-wider">Assigned Bus (Attendant)</label>
                    <select value={formData.assignedVehicleId} onChange={e => setFormData({...formData, assignedVehicleId: e.target.value})} className="input-field text-xs">
                      <option value="">-- None --</option>
                      {vehicles.map(v => <option key={v.id} value={v.id}>{v.id} - {v.routeName}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] dark:text-gray-400 text-surface-500 uppercase tracking-wider">Assigned Route</label>
                    <select value={formData.assignedRouteId} onChange={e => setFormData({...formData, assignedRouteId: e.target.value})} className="input-field text-xs">
                      <option value="">-- None --</option>
                      {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button onClick={handleSave} className="flex-1 btn-primary text-xs py-2.5">
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2.5 dark:bg-navy-700 bg-surface-200 dark:text-gray-300 text-surface-600 rounded-xl text-xs">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
