import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { ClipboardList, Bus, Users, Route, Wifi, Camera, Save, CheckCircle, AlertTriangle, ChevronDown } from 'lucide-react';

export default function AssignmentScreen() {
  const { vehicles, drivers, routes, users, students, updateVehicle, updateUser } = useStore();
  const [selectedBusId, setSelectedBusId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedAttendantId, setSelectedAttendantId] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [gpsDeviceId, setGpsDeviceId] = useState('');
  const [dashcamId, setDashcamId] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const selectedBus = vehicles.find(v => v.id === selectedBusId);
  const currentDriver = selectedBus ? users.find(u => u.role === 'driver' && u.assignedVehicleId === selectedBusId) : null;
  const currentAttendant = selectedBus ? users.find(u => (u.role === 'teacher' || u.role === 'school_staff') && u.assignedVehicleId === selectedBusId) : null;

  const handleBusSelect = (busId: string) => {
    setSelectedBusId(busId);
    setSaved(false);
    setError('');
    const bus = vehicles.find(v => v.id === busId);
    if (bus) {
      const driver = users.find(u => u.role === 'driver' && u.assignedVehicleId === busId);
      const attendant = users.find(u => (u.role === 'teacher' || u.role === 'school_staff') && u.assignedVehicleId === busId);
      setSelectedDriverId(driver?.id || '');
      setSelectedAttendantId(attendant?.id || '');
      setSelectedRouteId(bus.assignedRoute || '');
      setGpsDeviceId(bus.gpsDeviceId || '');
      setDashcamId(bus.dashCameraId || '');
    }
  };

  const validate = (): string | null => {
    if (!selectedBusId) return 'Select a bus';
    if (!selectedDriverId) return 'Assign a driver to this bus';

    // Check if driver is already assigned to another bus
    const driverAssignedBus = users.find(u => u.id === selectedDriverId && u.assignedVehicleId && u.assignedVehicleId !== selectedBusId);
    if (driverAssignedBus) return `Driver is already assigned to ${driverAssignedBus.assignedVehicleId}`;

    if (selectedAttendantId) {
      const attendantAssignedBus = users.find(u => u.id === selectedAttendantId && u.assignedVehicleId && u.assignedVehicleId !== selectedBusId);
      if (attendantAssignedBus) return `Attendant is already assigned to ${attendantAssignedBus.assignedVehicleId}`;
    }

    if (selectedRouteId) {
      const busUsingRoute = vehicles.find(v => v.assignedRoute === selectedRouteId && v.id !== selectedBusId);
      if (busUsingRoute) return `Route is already assigned to ${busUsingRoute.id}`;
    }

    return null;
  };

  const handleSave = () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Update bus assignments
    updateVehicle(selectedBusId, {
      assignedDriver: selectedDriverId,
      assignedRoute: selectedRouteId,
      gpsDeviceId: gpsDeviceId || undefined,
      dashCameraId: dashcamId || undefined,
      routeName: routes.find(r => r.id === selectedRouteId)?.name || '',
    });

    // Update driver's assigned bus
    if (selectedDriverId) {
      // Remove bus from old driver if different
      if (currentDriver && currentDriver.id !== selectedDriverId) {
        updateUser(currentDriver.id, { assignedVehicleId: undefined, assignedRouteId: undefined });
      }
      updateUser(selectedDriverId, { assignedVehicleId: selectedBusId, assignedRouteId: selectedRouteId });
    }

    // Update attendant's assigned bus
    if (selectedAttendantId) {
      if (currentAttendant && currentAttendant.id !== selectedAttendantId) {
        updateUser(currentAttendant.id, { assignedVehicleId: undefined });
      }
      updateUser(selectedAttendantId, { assignedVehicleId: selectedBusId });
    } else if (currentAttendant) {
      updateUser(currentAttendant.id, { assignedVehicleId: undefined });
    }

    // Update students assigned to this bus
    const busStudents = students.filter(s => s.assignedVehicleId === selectedBusId);
    busStudents.forEach(s => {
      // Student assignment stays with bus, route updates from bus
    });

    setSaved(true);
    setError('');
    setTimeout(() => setSaved(false), 3000);
  };

  const assignedStudents = students.filter(s => s.assignedVehicleId === selectedBusId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold dark:text-white text-surface-900 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-electric-400" />
          Bus Assignment
        </h1>
        <p className="text-xs dark:text-gray-400 text-surface-500 mt-0.5">Assign driver, attendant, route, and devices to a bus.</p>
      </div>

      {saved && (
        <div className="glass-card p-3 border-l-4 border-l-emerald-500 bg-emerald-500/5 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <p className="text-xs text-emerald-400 font-bold">Assignment saved successfully</p>
        </div>
      )}

      {error && (
        <div className="glass-card p-3 border-l-4 border-l-red-500 bg-red-500/5 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <p className="text-xs text-red-400 font-bold">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assignment Form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Bus Selection */}
          <div className="glass-card p-4">
            <h3 className="text-xs font-bold dark:text-white text-surface-900 mb-3 flex items-center gap-2">
              <Bus className="w-4 h-4 text-electric-400" />
              Select Bus
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {vehicles.map(bus => (
                <button
                  key={bus.id}
                  onClick={() => handleBusSelect(bus.id)}
                  className={`p-3 rounded-xl text-left transition-all ${
                    selectedBusId === bus.id
                      ? 'bg-electric-600/20 border-2 border-electric-500'
                      : 'dark:bg-navy-700/50 bg-surface-100 border-2 border-transparent hover:border-electric-500/30'
                  }`}
                >
                  <p className="text-xs font-bold dark:text-white text-surface-900">{bus.id}</p>
                  <p className="text-[10px] dark:text-gray-400 text-surface-500">{bus.plateNumber}</p>
                  <span className={`inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded-full ${
                    bus.status === 'moving' ? 'bg-emerald-500/20 text-emerald-400' : bus.status === 'offline' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>{bus.status}</span>
                </button>
              ))}
            </div>
          </div>

          {selectedBusId && (
            <>
              {/* Driver Assignment */}
              <div className="glass-card p-4">
                <h3 className="text-xs font-bold dark:text-white text-surface-900 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  Assign Driver
                </h3>
                <select
                  value={selectedDriverId}
                  onChange={e => { setSelectedDriverId(e.target.value); setSaved(false); setError(''); }}
                  className="input-field text-xs"
                >
                  <option value="">-- Select Driver --</option>
                  {drivers.map(d => {
                    const assignedBus = users.find(u => u.id === d.id)?.assignedVehicleId;
                    return (
                      <option key={d.id} value={d.id}>
                        {d.fullName} ({d.id}) {assignedBus && assignedBus !== selectedBusId ? `- Assigned to ${assignedBus}` : ''}
                      </option>
                    );
                  })}
                </select>
                {selectedDriverId && (
                  <div className="mt-2 dark:bg-navy-700/30 bg-surface-50 rounded-lg p-2 text-[10px] dark:text-gray-300 text-surface-600">
                    Driver will see: {selectedBusId} • {routes.find(r => r.id === selectedRouteId)?.name || 'No route'} • {assignedStudents.length} students
                  </div>
                )}
              </div>

              {/* Attendant Assignment */}
              <div className="glass-card p-4">
                <h3 className="text-xs font-bold dark:text-white text-surface-900 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  Assign Bus Attendant (Optional)
                </h3>
                <select
                  value={selectedAttendantId}
                  onChange={e => { setSelectedAttendantId(e.target.value); setSaved(false); setError(''); }}
                  className="input-field text-xs"
                >
                  <option value="">-- None --</option>
                  {users.filter(u => u.role === 'teacher' || u.role === 'school_staff').map(u => {
                    const assignedBus = u.assignedVehicleId;
                    return (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role}) {assignedBus && assignedBus !== selectedBusId ? `- Assigned to ${assignedBus}` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Route Assignment */}
              <div className="glass-card p-4">
                <h3 className="text-xs font-bold dark:text-white text-surface-900 mb-3 flex items-center gap-2">
                  <Route className="w-4 h-4 text-blue-400" />
                  Assign Route
                </h3>
                <select
                  value={selectedRouteId}
                  onChange={e => { setSelectedRouteId(e.target.value); setSaved(false); setError(''); }}
                  className="input-field text-xs"
                >
                  <option value="">-- Select Route --</option>
                  {routes.map(r => {
                    const busOnRoute = vehicles.find(v => v.assignedRoute === r.id && v.id !== selectedBusId);
                    return (
                      <option key={r.id} value={r.id}>
                        {r.name} {busOnRoute ? `- Used by ${busOnRoute.id}` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Device Assignment */}
              <div className="glass-card p-4">
                <h3 className="text-xs font-bold dark:text-white text-surface-900 mb-3 flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-green-400" />
                  Device Assignment
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] dark:text-gray-400 text-surface-500 uppercase tracking-wider">GPS Device</label>
                    <input type="text" value={gpsDeviceId} onChange={e => { setGpsDeviceId(e.target.value); setSaved(false); }} className="input-field text-xs" placeholder="GPS-009" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] dark:text-gray-400 text-surface-500 uppercase tracking-wider">Dashcam</label>
                    <input type="text" value={dashcamId} onChange={e => { setDashcamId(e.target.value); setSaved(false); }} className="input-field text-xs" placeholder="CAM-009" />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <button onClick={handleSave} className="w-full btn-primary text-sm py-3 flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> Save Assignment
              </button>
            </>
          )}
        </div>

        {/* Summary Panel */}
        <div className="space-y-4">
          {selectedBusId ? (
            <>
              <div className="glass-card p-4">
                <h3 className="text-xs font-bold dark:text-white text-surface-900 mb-3">Assignment Summary</h3>
                <div className="space-y-3">
                  <div className="dark:bg-navy-700/50 bg-surface-100 rounded-xl p-3 text-center">
                    <p className="text-xl font-black dark:text-white text-surface-900">{selectedBusId}</p>
                    <p className="text-[10px] dark:text-gray-400 text-surface-500">{selectedBus?.plateNumber}</p>
                  </div>
                  <div className="space-y-2 text-[10px]">
                    <div className="flex items-center justify-between dark:bg-navy-700/30 bg-surface-50 rounded-lg p-2">
                      <span className="dark:text-gray-400 text-surface-500">Driver</span>
                      <span className="dark:text-white text-surface-900 font-bold">{drivers.find(d => d.id === selectedDriverId)?.fullName || 'Not set'}</span>
                    </div>
                    <div className="flex items-center justify-between dark:bg-navy-700/30 bg-surface-50 rounded-lg p-2">
                      <span className="dark:text-gray-400 text-surface-500">Attendant</span>
                      <span className="dark:text-white text-surface-900 font-bold">{users.find(u => u.id === selectedAttendantId)?.name || 'None'}</span>
                    </div>
                    <div className="flex items-center justify-between dark:bg-navy-700/30 bg-surface-50 rounded-lg p-2">
                      <span className="dark:text-gray-400 text-surface-500">Route</span>
                      <span className="dark:text-white text-surface-900 font-bold">{routes.find(r => r.id === selectedRouteId)?.name || 'Not set'}</span>
                    </div>
                    <div className="flex items-center justify-between dark:bg-navy-700/30 bg-surface-50 rounded-lg p-2">
                      <span className="dark:text-gray-400 text-surface-500">GPS</span>
                      <span className={`font-bold ${gpsDeviceId ? 'text-emerald-400' : 'text-red-400'}`}>{gpsDeviceId || 'None'}</span>
                    </div>
                    <div className="flex items-center justify-between dark:bg-navy-700/30 bg-surface-50 rounded-lg p-2">
                      <span className="dark:text-gray-400 text-surface-500">Dashcam</span>
                      <span className={`font-bold ${dashcamId ? 'text-emerald-400' : 'text-red-400'}`}>{dashcamId || 'None'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card p-4">
                <h3 className="text-xs font-bold dark:text-white text-surface-900 mb-3">Students on Bus ({assignedStudents.length})</h3>
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {assignedStudents.map(s => (
                    <div key={s.id} className="flex items-center gap-2 p-1.5 rounded-lg dark:bg-navy-700/30 bg-surface-50 text-[10px]">
                      <span className="dark:text-white text-surface-900 font-medium">{s.fullName}</span>
                      <span className="dark:text-gray-400 text-surface-500 ml-auto">{s.studentId}</span>
                    </div>
                  ))}
                  {assignedStudents.length === 0 && (
                    <p className="text-[10px] dark:text-gray-400 text-surface-500 text-center py-4">No students on this bus</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="glass-card p-8 text-center">
              <ClipboardList className="w-8 h-8 mx-auto mb-2 dark:text-gray-500 text-surface-400" />
              <p className="text-xs dark:text-gray-400 text-surface-500">Select a bus to begin assignment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
