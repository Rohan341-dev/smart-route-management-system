import { useState } from 'react';
import { useStore } from '../store/useStore';
import { GraduationCap, Search, Phone, MapPin, Bus, ChevronRight } from 'lucide-react';

export default function Students() {
  const { students } = useStore();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBus, setFilterBus] = useState('all');

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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="kpi-card">
          <p className="text-xs text-gray-400">Total Students</p>
          <p className="text-2xl font-bold text-white">{statusCounts.total}</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs text-gray-400">Waiting</p>
          <p className="text-2xl font-bold text-amber-400">{statusCounts.waiting}</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs text-gray-400">On Bus</p>
          <p className="text-2xl font-bold text-emerald-400">{statusCounts.on_bus}</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs text-gray-400">Dropped</p>
          <p className="text-2xl font-bold text-purple-400">{statusCounts.dropped}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs font-bold text-gray-400 uppercase px-4 py-3">Student</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase px-4 py-3">Class</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase px-4 py-3">Bus</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase px-4 py-3">Pickup</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase px-4 py-3">Drop</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase px-4 py-3">Status</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase px-4 py-3">Parent</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-electric-600/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-electric-400">{s.fullName[0]}</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{s.fullName}</p>
                        <p className="text-[10px] text-gray-400">{s.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-white">{s.class}-{s.section}</td>
                  <td className="px-4 py-3 text-xs text-white">{s.assignedBus}</td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-white">{s.pickupStop}</p>
                    {s.pickupTime && <p className="text-[10px] text-gray-400">{s.pickupTime}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-white">{s.dropStop}</p>
                    {s.dropTime && <p className="text-[10px] text-gray-400">{s.dropTime}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`status-badge border text-[10px] ${getStatusBadge(s.status)}`}>{s.status.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <span className="text-[10px] text-gray-400">{s.parentPhone}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
