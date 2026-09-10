import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { GraduationCap, Search, Phone, MapPin, Bus, ChevronRight, QrCode, UserPlus, X, CheckCircle, Printer, AlertCircle } from 'lucide-react';
import StudentQRCode from '../components/StudentQRCode';
import { Student } from '../data/types';

export default function Students() {
  const { students, addStudent, fetchStudents, vehicles, routes } = useStore();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBus, setFilterBus] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdStudent, setCreatedStudent] = useState<Student | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    class: '',
    section: '',
    parentName: '',
    parentPhone: '',
    assignedBus: '',
    assignedRouteId: '',
    pickupStop: '',
    dropStop: '',
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const filtered = students.filter(s => {
    const matchSearch = s.fullName.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    const matchBus = filterBus === 'all' || s.assignedBus === filterBus;
    return matchSearch && matchStatus && matchBus;
  });

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      waiting: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      picked_up: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      on_bus: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      dropped: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      absent: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      emergency: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return colors[status] || colors.absent;
  };

  const statusCounts = {
    waiting: students.filter(s => s.status === 'waiting').length,
    on_bus: students.filter(s => s.status === 'on_bus').length,
    dropped: students.filter(s => s.status === 'dropped').length,
    total: students.length,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.class || !formData.parentName || !formData.parentPhone || !formData.assignedBus || !formData.assignedRouteId) return;
    setSubmitting(true);
    setError('');
    try {
      const student = await addStudent({
        fullName: formData.fullName,
        class: formData.class,
        section: formData.section,
        parentName: formData.parentName,
        parentPhone: formData.parentPhone,
        assignedBus: formData.assignedBus,
        route: formData.assignedRouteId,
        assignedVehicleId: formData.assignedBus,
        assignedRouteId: formData.assignedRouteId,
        pickupStop: formData.pickupStop,
        dropStop: formData.dropStop,
      });
      setCreatedStudent(student);
      setShowAddForm(false);
      setShowSuccess(true);
      setFormData({ fullName: '', class: '', section: '', parentName: '', parentPhone: '', assignedBus: '', assignedRouteId: '', pickupStop: '', dropStop: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to create student. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const assignedRoute = createdStudent ? routes.find(r => r.id === createdStudent.assignedRouteId) : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="kpi-card">
          <p className="text-xs dark:text-gray-400 text-surface-500">Total Students</p>
          <p className="text-2xl font-bold dark:text-white text-surface-900">{statusCounts.total}</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs dark:text-gray-400 text-surface-500">Waiting</p>
          <p className="text-2xl font-bold text-amber-400">{statusCounts.waiting}</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs dark:text-gray-400 text-surface-500">On Bus</p>
          <p className="text-2xl font-bold text-emerald-400">{statusCounts.on_bus}</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs dark:text-gray-400 text-surface-500">Dropped</p>
          <p className="text-2xl font-bold text-purple-400">{statusCounts.dropped}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-400 text-surface-500" />
            <input type="text" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field w-auto">
            <option value="all">All Status</option>
            <option value="waiting">Waiting</option>
            <option value="on_bus">On Bus</option>
            <option value="dropped">Dropped</option>
            <option value="absent">Absent</option>
          </select>
          <select value={filterBus} onChange={e => setFilterBus(e.target.value)} className="input-field w-auto">
            <option value="all">All Buses</option>
            {[...new Set(students.map(s => s.assignedBus))].map(bus => (
              <option key={bus} value={bus}>{bus}</option>
            ))}
          </select>
        </div>
        <button onClick={() => setShowAddForm(true)} className="btn-primary flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Add Student
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-white/5 border-surface-200">
                <th className="text-left text-xs font-bold dark:text-gray-400 text-surface-500 uppercase px-4 py-3">Student</th>
                <th className="text-left text-xs font-bold dark:text-gray-400 text-surface-500 uppercase px-4 py-3">Class</th>
                <th className="text-left text-xs font-bold dark:text-gray-400 text-surface-500 uppercase px-4 py-3">Bus</th>
                <th className="text-left text-xs font-bold dark:text-gray-400 text-surface-500 uppercase px-4 py-3">Pickup</th>
                <th className="text-left text-xs font-bold dark:text-gray-400 text-surface-500 uppercase px-4 py-3">Drop</th>
                <th className="text-left text-xs font-bold dark:text-gray-400 text-surface-500 uppercase px-4 py-3">Status</th>
                <th className="text-left text-xs font-bold dark:text-gray-400 text-surface-500 uppercase px-4 py-3">Parent</th>
                <th className="text-left text-xs font-bold dark:text-gray-400 text-surface-500 uppercase px-4 py-3">QR</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b dark:border-white/5 border-surface-200 dark:hover:bg-white/5 hover:bg-surface-50 transition-all">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-electric-600/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-electric-400">{s.fullName[0]}</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold dark:text-white text-surface-900">{s.fullName}</p>
                        <p className="text-[10px] dark:text-gray-400 text-surface-500">{s.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs dark:text-white text-surface-900">{s.class}-{s.section}</td>
                  <td className="px-4 py-3 text-xs dark:text-white text-surface-900">{s.assignedBus}</td>
                  <td className="px-4 py-3">
                    <p className="text-xs dark:text-white text-surface-900">{s.pickupStop}</p>
                    {s.pickupTime && <p className="text-[10px] dark:text-gray-400 text-surface-500">{s.pickupTime}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs dark:text-white text-surface-900">{s.dropStop}</p>
                    {s.dropTime && <p className="text-[10px] dark:text-gray-400 text-surface-500">{s.dropTime}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`status-badge border text-[10px] ${getStatusBadge(s.status)}`}>{s.status.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3 dark:text-gray-400 text-surface-500" />
                      <span className="text-[10px] dark:text-gray-400 text-surface-500">{s.parentPhone}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StudentQRCode student={s} compact />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowAddForm(false)}>
          <div className="dark:bg-navy-800 bg-white dark:border-white/10 border-surface-200 border rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b dark:border-white/5 border-surface-200 sticky top-0 dark:bg-navy-800 bg-white z-10">
              <h3 className="text-sm font-bold dark:text-white text-surface-900">Add New Student</h3>
              <button onClick={() => setShowAddForm(false)} className="p-1 rounded-lg dark:hover:bg-white/10 hover:bg-surface-100 transition-all">
                <X className="w-4 h-4 dark:text-gray-400 text-surface-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <h4 className="text-xs font-bold dark:text-gray-300 text-surface-600 mb-2 uppercase tracking-wider">Student Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs dark:text-gray-400 text-surface-500 mb-1 block">Full Name *</label>
                    <input type="text" required value={formData.fullName} onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))} className="input-field" placeholder="e.g. Aarav Sharma" />
                  </div>
                  <div>
                    <label className="text-xs dark:text-gray-400 text-surface-500 mb-1 block">Class *</label>
                    <select required value={formData.class} onChange={e => setFormData(p => ({ ...p, class: e.target.value }))} className="input-field">
                      <option value="">Select Class</option>
                      <option value="1">Class 1</option><option value="2">Class 2</option><option value="3">Class 3</option><option value="4">Class 4</option><option value="5">Class 5</option><option value="6">Class 6</option><option value="7">Class 7</option><option value="8">Class 8</option><option value="9">Class 9</option><option value="10">Class 10</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs dark:text-gray-400 text-surface-500 mb-1 block">Section</label>
                    <select value={formData.section} onChange={e => setFormData(p => ({ ...p, section: e.target.value }))} className="input-field">
                      <option value="">Select Section</option>
                      <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold dark:text-gray-300 text-surface-600 mb-2 uppercase tracking-wider">Parent Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs dark:text-gray-400 text-surface-500 mb-1 block">Parent/Guardian Name *</label>
                    <input type="text" required value={formData.parentName} onChange={e => setFormData(p => ({ ...p, parentName: e.target.value }))} className="input-field" placeholder="e.g. Ram Sharma" />
                  </div>
                  <div>
                    <label className="text-xs dark:text-gray-400 text-surface-500 mb-1 block">Parent Phone *</label>
                    <input type="tel" required value={formData.parentPhone} onChange={e => setFormData(p => ({ ...p, parentPhone: e.target.value }))} className="input-field" placeholder="+977-9841000000" />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold dark:text-gray-300 text-surface-600 mb-2 uppercase tracking-wider">Transportation</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs dark:text-gray-400 text-surface-500 mb-1 block">Assigned Vehicle *</label>
                    <select required value={formData.assignedBus} onChange={e => setFormData(p => ({ ...p, assignedBus: e.target.value }))} className="input-field">
                      <option value="">Select Vehicle</option>
                      {vehicles.map(v => <option key={v.id} value={v.id}>{v.id} - {v.routeName || v.type}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs dark:text-gray-400 text-surface-500 mb-1 block">Assigned Route *</label>
                    <select required value={formData.assignedRouteId} onChange={e => setFormData(p => ({ ...p, assignedRouteId: e.target.value }))} className="input-field">
                      <option value="">Select Route</option>
                      {routes.map(r => <option key={r.id} value={r.id}>{r.id} - {r.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs dark:text-gray-400 text-surface-500 mb-1 block">Pickup Location</label>
                    <input type="text" value={formData.pickupStop} onChange={e => setFormData(p => ({ ...p, pickupStop: e.target.value }))} className="input-field" placeholder="e.g. Thamel" />
                  </div>
                  <div>
                    <label className="text-xs dark:text-gray-400 text-surface-500 mb-1 block">Drop Location</label>
                    <input type="text" value={formData.dropStop} onChange={e => setFormData(p => ({ ...p, dropStop: e.target.value }))} className="input-field" placeholder="e.g. Baneshwor" />
                  </div>
                </div>
              </div>

              <div className="dark:bg-electric-600/10 bg-electric-50 rounded-xl p-3 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-electric-500" />
                <span className="text-xs dark:text-electric-400 text-electric-600 font-bold">QR Attendance: AUTO-ENABLED</span>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="text-xs text-red-400">{error}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-2.5 rounded-xl dark:bg-navy-700 bg-surface-100 dark:text-gray-300 text-surface-600 text-xs font-bold hover:dark:bg-navy-600 hover:bg-surface-200 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 btn-primary py-2.5 disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting ? 'Creating...' : 'Create Student & Generate QR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal with QR Card */}
      {showSuccess && createdStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => { setShowSuccess(false); setCreatedStudent(null); }}>
          <div className="dark:bg-navy-800 bg-white dark:border-white/10 border-surface-200 border rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold dark:text-white text-surface-900">Student Created Successfully</h3>

              <div className="text-center mt-4 mb-3">
                <h4 className="text-xs font-black tracking-wider text-electric-400">SMARTBUS</h4>
                <p className="text-[10px] dark:text-gray-400 text-surface-500">Student Bus Attendance</p>
              </div>

              <div className="bg-white p-4 rounded-2xl mb-4">
                <div className="w-[180px] h-[180px] flex items-center justify-center">
                  <div className="text-center">
                    <QrCode className="w-16 h-16 text-navy-800 mx-auto mb-2" />
                    <p className="text-[10px] text-gray-500 font-mono">{createdStudent.qrCode}</p>
                  </div>
                </div>
              </div>

              <div className="text-center space-y-1">
                <p className="text-sm font-bold dark:text-white text-surface-900">{createdStudent.fullName}</p>
                <p className="text-xs dark:text-gray-400 text-surface-500">Student ID: {createdStudent.studentId}</p>
                <p className="text-[10px] dark:text-gray-400 text-surface-500">QR ID: {createdStudent.qrId}</p>
              </div>

              <div className="w-full mt-4 grid grid-cols-2 gap-2 text-[10px]">
                <div className="dark:bg-navy-700/50 bg-surface-100 rounded-lg p-2 text-center">
                  <p className="dark:text-gray-400 text-surface-500">Bus</p>
                  <p className="dark:text-white text-surface-900 font-bold">{createdStudent.assignedVehicleId}</p>
                </div>
                <div className="dark:bg-navy-700/50 bg-surface-100 rounded-lg p-2 text-center">
                  <p className="dark:text-gray-400 text-surface-500">Route</p>
                  <p className="dark:text-white text-surface-900 font-bold">{assignedRoute?.name || createdStudent.assignedRouteId}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-4 w-full">
                <button onClick={() => { setShowSuccess(false); setCreatedStudent(null); }} className="flex-1 py-2.5 rounded-xl dark:bg-navy-700 bg-surface-100 dark:text-gray-300 text-surface-600 text-xs font-bold hover:dark:bg-navy-600 hover:bg-surface-200 transition-all">
                  Done
                </button>
                <button onClick={() => { setShowSuccess(false); setCreatedStudent(null); }} className="flex-1 btn-primary py-2.5 text-[10px] flex items-center justify-center gap-1">
                  <Printer className="w-3 h-3" /> Print QR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
