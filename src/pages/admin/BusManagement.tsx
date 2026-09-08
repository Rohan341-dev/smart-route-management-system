import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Bus, Search, Plus, Edit2, MapPin, Camera, Wifi, WifiOff, Users, Route, X, ChevronRight, Power, PowerOff } from 'lucide-react';
import { Vehicle, VehicleStatus } from '../../data/types';

const statusColors: Record<VehicleStatus, string> = {
  moving: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  stopped: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  idle: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  delayed: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  offline: 'bg-red-500/20 text-red-400 border-red-500/30',
  emergency: 'bg-red-600/20 text-red-500 border-red-600/30',
  route_deviation: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

export default function BusManagement() {
  const { vehicles, drivers, routes, students, users, updateVehicle } = useStore();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingBus, setEditingBus] = useState<Vehicle | null>(null);
  const [selectedBus, setSelectedBus] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    registrationNumber: '',
    type: 'School Bus',
    capacity: 40,
    plateNumber: '',
    routeName: '',
    assignedDriver: '',
    assignedRoute: '',
    gpsDeviceId: '',
    dashCameraId: '',
    status: 'idle' as VehicleStatus,
  });

  const filtered = vehicles.filter(v => {
    const matchSearch = v.id.toLowerCase().includes(search.toLowerCase()) || (v.plateNumber || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || v.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const openAddForm = () => {
    setEditingBus(null);
    setFormData({ id: '', registrationNumber: '', type: 'School Bus', capacity: 40, plateNumber: '', routeName: '', assignedDriver: '', assignedRoute: '', gpsDeviceId: '', dashCameraId: '', status: 'idle' as VehicleStatus });
    setShowForm(true);
  };

  const openEditForm = (bus: Vehicle) => {
    setEditingBus(bus);
    setFormData({
      id: bus.id,
      registrationNumber: bus.registrationNumber || '',
      type: bus.type,
      capacity: bus.capacity,
      plateNumber: bus.plateNumber || '',
      routeName: bus.routeName || '',
      assignedDriver: bus.assignedDriver || '',
      assignedRoute: bus.assignedRoute || '',
      gpsDeviceId: bus.gpsDeviceId || '',
      dashCameraId: bus.dashCameraId || '',
      status: bus.status,
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formData.id || !formData.plateNumber) return;

    if (editingBus) {
      updateVehicle(editingBus.id, {
        ...formData,
        registrationNumber: formData.registrationNumber || formData.plateNumber,
        routeName: routes.find(r => r.id === formData.assignedRoute)?.name || formData.routeName,
      });
    }
    setShowForm(false);
    setEditingBus(null);
  };

  const toggleBusStatus = (bus: Vehicle) => {
    updateVehicle(bus.id, {
      status: bus.status === 'offline' ? 'idle' : 'offline',
    });
  };

  const busStudents = selectedBus ? students.filter(s => s.assignedVehicleId === selectedBus) : [];
  const busDriver = selectedBus ? users.find(u => u.role === 'driver' && u.assignedVehicleId === selectedBus) : null;
  const busRoute = selectedBus ? routes.find(r => r.id === vehicles.find(v => v.id === selectedBus)?.assignedRoute) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold dark:text-white text-surface-900 flex items-center gap-2">
            <Bus className="w-5 h-5 text-electric-400" />
            Bus Management
          </h1>
          <p className="text-xs dark:text-gray-400 text-surface-500 mt-0.5">Manage fleet, assign drivers, routes, and devices.</p>
        </div>
        <button onClick={openAddForm} className="btn-primary text-xs py-2 px-4 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Bus
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card p-3 text-center">
          <Bus className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
          <p className="text-lg font-bold dark:text-white text-surface-900">{vehicles.filter(v => v.status === 'moving').length}</p>
          <p className="text-[9px] dark:text-gray-400 text-surface-500">Active</p>
        </div>
        <div className="glass-card p-3 text-center">
          <Bus className="w-4 h-4 mx-auto mb-1 text-amber-400" />
          <p className="text-lg font-bold dark:text-white text-surface-900">{vehicles.filter(v => v.status === 'stopped' || v.status === 'idle').length}</p>
          <p className="text-[9px] dark:text-gray-400 text-surface-500">Idle</p>
        </div>
        <div className="glass-card p-3 text-center">
          <Wifi className="w-4 h-4 mx-auto mb-1 text-green-400" />
          <p className="text-lg font-bold dark:text-white text-surface-900">{vehicles.filter(v => v.gpsDeviceId).length}</p>
          <p className="text-[9px] dark:text-gray-400 text-surface-500">GPS Online</p>
        </div>
        <div className="glass-card p-3 text-center">
          <Users className="w-4 h-4 mx-auto mb-1 text-electric-400" />
          <p className="text-lg font-bold dark:text-white text-surface-900">{vehicles.reduce((s, v) => s + v.currentStudents, 0)}</p>
          <p className="text-[9px] dark:text-gray-400 text-surface-500">Total Students</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bus List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-400 text-surface-500" />
              <input type="text" placeholder="Search buses..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10 text-xs" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'moving', 'stopped', 'idle', 'offline'].map(status => (
                <button key={status} onClick={() => setFilterStatus(status)} className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                  filterStatus === status ? 'bg-electric-600 text-white' : 'dark:bg-navy-700/50 bg-surface-100 dark:text-gray-400 text-surface-500'
                }`}>{status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map(bus => {
              const driver = users.find(u => u.role === 'driver' && u.assignedVehicleId === bus.id);
              const route = routes.find(r => r.id === bus.assignedRoute);
              const studentCount = students.filter(s => s.assignedVehicleId === bus.id).length;
              return (
                <div key={bus.id} onClick={() => setSelectedBus(bus.id)} className={`glass-card p-4 cursor-pointer transition-all hover:ring-2 hover:ring-electric-500/50 ${selectedBus === bus.id ? 'ring-2 ring-electric-500' : ''}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-bold dark:text-white text-surface-900">{bus.id}</h3>
                      <p className="text-[10px] dark:text-gray-400 text-surface-500">{bus.plateNumber}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusColors[bus.status]}`}>
                      {bus.status === 'moving' && <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>}
                      {bus.status}
                    </span>
                  </div>
                  <div className="space-y-2 text-[10px]">
                    <div className="flex items-center justify-between">
                      <span className="dark:text-gray-400 text-surface-500">Driver</span>
                      <span className="dark:text-white text-surface-900 font-medium">{driver?.name || 'Unassigned'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="dark:text-gray-400 text-surface-500">Route</span>
                      <span className="dark:text-white text-surface-900 font-medium">{route?.name || bus.routeName || 'Unassigned'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="dark:text-gray-400 text-surface-500">Students</span>
                      <span className="dark:text-white text-surface-900 font-medium">{studentCount}/{bus.capacity}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="dark:text-gray-400 text-surface-500">GPS</span>
                      <span className={`font-medium ${bus.gpsDeviceId ? 'text-emerald-400' : 'text-red-400'}`}>{bus.gpsDeviceId || 'None'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="dark:text-gray-400 text-surface-500">Dashcam</span>
                      <span className={`font-medium ${bus.dashCameraId ? 'text-emerald-400' : 'text-red-400'}`}>{bus.dashCameraId || 'None'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t dark:border-white/5 border-surface-200">
                    <button onClick={(e) => { e.stopPropagation(); openEditForm(bus); }} className="flex-1 py-1.5 rounded-lg dark:bg-navy-700/50 bg-surface-100 text-[10px] dark:text-gray-300 text-surface-600 font-medium hover:bg-electric-600/20 transition-all">
                      Edit
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); toggleBusStatus(bus); }} className="flex-1 py-1.5 rounded-lg dark:bg-navy-700/50 bg-surface-100 text-[10px] dark:text-gray-300 text-surface-600 font-medium hover:bg-amber-600/20 transition-all">
                      {bus.status === 'offline' ? 'Enable' : 'Disable'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bus Detail Panel */}
        <div className="space-y-4">
          {selectedBus ? (
            <>
              <div className="glass-card p-4">
                <h3 className="text-xs font-bold dark:text-white text-surface-900 mb-3">Bus Details</h3>
                {(() => {
                  const bus = vehicles.find(v => v.id === selectedBus);
                  if (!bus) return null;
                  const driver = users.find(u => u.role === 'driver' && u.assignedVehicleId === bus.id);
                  const attendant = users.find(u => (u.role === 'teacher' || u.role === 'school_staff') && u.assignedVehicleId === bus.id);
                  const route = routes.find(r => r.id === bus.assignedRoute);
                  return (
                    <div className="space-y-3 text-[10px]">
                      <div className="dark:bg-navy-700/50 bg-surface-100 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold dark:text-white text-surface-900">{bus.id}</p>
                        <p className="dark:text-gray-400 text-surface-500">{bus.plateNumber}</p>
                        <p className="dark:text-gray-400 text-surface-500">{bus.type} • Capacity: {bus.capacity}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 dark:bg-navy-700/30 bg-surface-50 rounded-lg p-2">
                          <span className="dark:text-gray-400 text-surface-500 w-16">Driver</span>
                          <span className="dark:text-white text-surface-900 font-medium">{driver?.name || 'Unassigned'}</span>
                        </div>
                        <div className="flex items-center gap-2 dark:bg-navy-700/30 bg-surface-50 rounded-lg p-2">
                          <span className="dark:text-gray-400 text-surface-500 w-16">Attendant</span>
                          <span className="dark:text-white text-surface-900 font-medium">{attendant?.name || 'Unassigned'}</span>
                        </div>
                        <div className="flex items-center gap-2 dark:bg-navy-700/30 bg-surface-50 rounded-lg p-2">
                          <span className="dark:text-gray-400 text-surface-500 w-16">Route</span>
                          <span className="dark:text-white text-surface-900 font-medium">{route?.name || bus.routeName || 'Unassigned'}</span>
                        </div>
                        <div className="flex items-center gap-2 dark:bg-navy-700/30 bg-surface-50 rounded-lg p-2">
                          <span className="dark:text-gray-400 text-surface-500 w-16">GPS</span>
                          <span className={`font-medium ${bus.gpsDeviceId ? 'text-emerald-400' : 'text-red-400'}`}>{bus.gpsDeviceId || 'Not assigned'}</span>
                        </div>
                        <div className="flex items-center gap-2 dark:bg-navy-700/30 bg-surface-50 rounded-lg p-2">
                          <span className="dark:text-gray-400 text-surface-500 w-16">Dashcam</span>
                          <span className={`font-medium ${bus.dashCameraId ? 'text-emerald-400' : 'text-red-400'}`}>{bus.dashCameraId || 'Not assigned'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="glass-card p-4">
                <h3 className="text-xs font-bold dark:text-white text-surface-900 mb-3">Assigned Students ({busStudents.length})</h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {busStudents.map(s => (
                    <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg dark:bg-navy-700/30 bg-surface-50">
                      <div className="w-7 h-7 rounded-lg bg-electric-600/20 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-electric-400">{s.fullName[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] dark:text-white text-surface-900 truncate">{s.fullName}</p>
                        <p className="text-[9px] dark:text-gray-400 text-surface-500">{s.studentId} • {s.class}-{s.section}</p>
                      </div>
                    </div>
                  ))}
                  {busStudents.length === 0 && (
                    <p className="text-[10px] dark:text-gray-400 text-surface-500 text-center py-4">No students assigned</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="glass-card p-8 text-center">
              <Bus className="w-8 h-8 mx-auto mb-2 dark:text-gray-500 text-surface-400" />
              <p className="text-xs dark:text-gray-400 text-surface-500">Select a bus to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowForm(false)}>
          <div className="dark:bg-navy-800 bg-white dark:border-white/10 border-surface-200 border rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b dark:border-white/5 border-surface-200">
              <h3 className="text-sm font-bold dark:text-white text-surface-900">{editingBus ? 'Edit Bus' : 'Add New Bus'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg dark:hover:bg-white/10 hover:bg-surface-100"><X className="w-4 h-4 dark:text-gray-400 text-surface-500" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] dark:text-gray-400 text-surface-500 uppercase tracking-wider">Bus ID *</label>
                  <input type="text" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} className="input-field text-xs" placeholder="BUS-109" disabled={!!editingBus} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] dark:text-gray-400 text-surface-500 uppercase tracking-wider">Plate Number *</label>
                  <input type="text" value={formData.plateNumber} onChange={e => setFormData({...formData, plateNumber: e.target.value})} className="input-field text-xs" placeholder="BA-1-KHA-1234" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] dark:text-gray-400 text-surface-500 uppercase tracking-wider">Type</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="input-field text-xs">
                    <option>School Bus</option><option>Mini Bus</option><option>VAN</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] dark:text-gray-400 text-surface-500 uppercase tracking-wider">Capacity</label>
                  <input type="number" value={formData.capacity} onChange={e => setFormData({...formData, capacity: parseInt(e.target.value) || 0})} className="input-field text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] dark:text-gray-400 text-surface-500 uppercase tracking-wider">Assign Driver</label>
                  <select value={formData.assignedDriver} onChange={e => setFormData({...formData, assignedDriver: e.target.value})} className="input-field text-xs">
                    <option value="">-- None --</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.fullName} ({d.id})</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] dark:text-gray-400 text-surface-500 uppercase tracking-wider">Assign Route</label>
                  <select value={formData.assignedRoute} onChange={e => setFormData({...formData, assignedRoute: e.target.value})} className="input-field text-xs">
                    <option value="">-- None --</option>
                    {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] dark:text-gray-400 text-surface-500 uppercase tracking-wider">GPS Device ID</label>
                  <input type="text" value={formData.gpsDeviceId} onChange={e => setFormData({...formData, gpsDeviceId: e.target.value})} className="input-field text-xs" placeholder="GPS-009" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] dark:text-gray-400 text-surface-500 uppercase tracking-wider">Dashcam ID</label>
                  <input type="text" value={formData.dashCameraId} onChange={e => setFormData({...formData, dashCameraId: e.target.value})} className="input-field text-xs" placeholder="CAM-009" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleSave} className="flex-1 btn-primary text-xs py-2.5">{editingBus ? 'Save Changes' : 'Add Bus'}</button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2.5 dark:bg-navy-700 bg-surface-200 dark:text-gray-300 text-surface-600 rounded-xl text-xs">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
