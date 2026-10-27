'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { 
  History, 
  Plus, 
  Trash2, 
  Edit2, 
  TrendingDown, 
  Clock, 
  Layers, 
  Info, 
  ShieldCheck, 
  X,
  Scale
} from 'lucide-react';
import { HistoricalProject } from '@/types';
import { calculateDaysBetween } from '@/lib/calculator';

export const HistoricalPerformanceView: React.FC = () => {
  const { 
    historicalProjects, 
    addHistoricalProject, 
    updateHistoricalProject, 
    deleteHistoricalProject 
  } = useApp();

  const [capacityFilter, setCapacityFilter] = useState<'all' | '100' | '250' | '500' | '1000'>('all');
  
  // Comparison state
  const [compareIdA, setCompareIdA] = useState<string>(historicalProjects[1]?.id || historicalProjects[0]?.id || '');
  const [compareIdB, setCompareIdB] = useState<string>(historicalProjects[4]?.id || historicalProjects[0]?.id || '');

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HistoricalProject | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCapacityKw, setFormCapacityKw] = useState<number | ''>(250);
  const [formCapacityDisplay, setFormCapacityDisplay] = useState('250 kW');
  const [formLocation, setFormLocation] = useState('');
  const [formStartDate, setFormStartDate] = useState('2025-06-01');
  const [formCompletionDate, setFormCompletionDate] = useState('2025-07-20');
  const [formDaysLost, setFormDaysLost] = useState<number | ''>(8);
  const [formLessons, setFormLessons] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const openAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormCapacityKw(250);
    setFormCapacityDisplay('250 kW');
    setFormLocation('');
    setFormStartDate('2025-06-01');
    setFormCompletionDate('2025-07-20');
    setFormDaysLost(8);
    setFormLessons('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: HistoricalProject) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCapacityKw(item.capacityKw);
    setFormCapacityDisplay(item.capacityDisplay);
    setFormLocation(item.location);
    setFormStartDate(item.startDate);
    setFormCompletionDate(item.completionDate);
    setFormDaysLost(item.daysLostToShortages);
    setFormLessons(item.keyLessons || '');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setErrorMsg('Project name is required.');
      return;
    }
    const cap = Number(formCapacityKw) || 250;
    const daysLost = Number(formDaysLost) || 0;

    if (editingItem) {
      updateHistoricalProject({
        ...editingItem,
        name: formName.trim(),
        capacityKw: cap,
        capacityDisplay: formCapacityDisplay.trim() || `${cap} kW`,
        location: formLocation.trim() || 'Solar Site',
        startDate: formStartDate,
        completionDate: formCompletionDate,
        daysLostToShortages: daysLost,
        totalDays: calculateDaysBetween(formStartDate, formCompletionDate),
        keyLessons: formLessons.trim() || undefined,
      });
    } else {
      addHistoricalProject({
        name: formName.trim(),
        capacityKw: cap,
        capacityDisplay: formCapacityDisplay.trim() || `${cap} kW`,
        location: formLocation.trim() || 'Solar Site',
        startDate: formStartDate,
        completionDate: formCompletionDate,
        daysLostToShortages: daysLost,
        keyLessons: formLessons.trim() || undefined,
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Remove historical project record "${name}"?`)) {
      deleteHistoricalProject(id);
    }
  };

  // Filtered dataset
  const filteredProjects = historicalProjects.filter((item) => {
    if (capacityFilter === 'all') return true;
    return item.capacityKw.toString() === capacityFilter;
  });

  // Calculate aggregates
  const totalCompleted = filteredProjects.length;
  const avgCompletionDays = totalCompleted > 0
    ? Math.round(filteredProjects.reduce((acc, p) => acc + p.totalDays, 0) / totalCompleted)
    : 0;
  const avgDelayLostDays = totalCompleted > 0
    ? (filteredProjects.reduce((acc, p) => acc + p.daysLostToShortages, 0) / totalCompleted).toFixed(1)
    : '0';

  // Chart data
  const chartData = filteredProjects.map((p) => ({
    name: p.name.length > 18 ? p.name.substring(0, 16) + '...' : p.name,
    fullName: p.name,
    capacity: p.capacityDisplay,
    'Total Duration (Days)': p.totalDays,
    'Shortage Days Lost': p.daysLostToShortages,
    'Net Execution (Days)': Math.max(0, p.totalDays - p.daysLostToShortages),
  }));

  // Selected projects for direct comparison
  const projectA = historicalProjects.find((p) => p.id === compareIdA) || historicalProjects[0];
  const projectB = historicalProjects.find((p) => p.id === compareIdB) || historicalProjects[1] || historicalProjects[0];

  const durationDiff = projectA && projectB ? projectB.totalDays - projectA.totalDays : 0;
  const durationPctChange = projectA && projectB && projectA.totalDays > 0
    ? (((projectB.totalDays - projectA.totalDays) / projectA.totalDays) * 100).toFixed(1)
    : '0';
  const shortageDiff = projectA && projectB ? projectB.daysLostToShortages - projectA.daysLostToShortages : 0;

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Historical Performance & Benchmarks</h2>
            <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full border border-slate-200">
              Descriptive Analytics
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate past completed solar projects to benchmark completion velocity and quantify days lost to material bottlenecks.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Historical Project</span>
        </button>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white rounded-xl p-4.5 border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Total Completed Projects
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">{totalCompleted}</div>
          <div className="mt-1 text-[11px] text-slate-500">Benchmark dataset for capacity scaling</div>
        </div>

        <div className="bg-white rounded-xl p-4.5 border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Average Project Duration
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">
            {avgCompletionDays} <span className="text-sm font-normal text-slate-500">calendar days</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">From site mobilization to commissioning</div>
        </div>

        <div className="bg-white rounded-xl p-4.5 border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Avg Days Lost to Shortages
          </div>
          <div className="mt-2 text-2xl font-extrabold text-rose-600">
            {avgDelayLostDays} <span className="text-sm font-normal text-slate-500">days / project</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Schedule slip directly attributed to missing BOM</div>
        </div>

      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Project Duration vs Material-Shortage Delays</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Net installation execution versus days lost waiting for supplier shipments.
            </p>
          </div>

          {/* Filter by capacity */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Capacity Filter:</span>
            <select
              value={capacityFilter}
              onChange={(e) => setCapacityFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700"
            >
              <option value="all">All Capacities</option>
              <option value="100">100 kW Rooftops</option>
              <option value="250">250 kW Commercial</option>
              <option value="500">500 kW Industrial</option>
              <option value="1000">1 MW Ground Arrays</option>
            </select>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} label={{ value: 'Days', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                formatter={(value: any, name: any) => [`${value} days`, name]}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="Net Execution (Days)" stackId="a" fill="#059669" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Shortage Days Lost" stackId="a" fill="#e11d48" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cohort Comparison Tool */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Compare Cohort Projects</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Select two similar scale projects to evaluate variance in completion time and shortage loss.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Project A (Baseline)</label>
            <select
              value={compareIdA}
              onChange={(e) => setCompareIdA(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
            >
              {historicalProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.capacityDisplay}) — {p.totalDays}d
                </option>
              ))}
            </select>

            {projectA && (
              <div className="mt-3 text-xs space-y-1.5 pt-2 border-t border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Duration:</span>
                  <span className="font-bold text-slate-800">{projectA.totalDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Days lost to shortages:</span>
                  <span className="font-semibold text-rose-600">{projectA.daysLostToShortages} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Capacity:</span>
                  <span className="font-mono text-slate-700">{projectA.capacityDisplay}</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Project B (Comparison)</label>
            <select
              value={compareIdB}
              onChange={(e) => setCompareIdB(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
            >
              {historicalProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.capacityDisplay}) — {p.totalDays}d
                </option>
              ))}
            </select>

            {projectB && (
              <div className="mt-3 text-xs space-y-1.5 pt-2 border-t border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Duration:</span>
                  <span className="font-bold text-slate-800">{projectB.totalDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Days lost to shortages:</span>
                  <span className="font-semibold text-rose-600">{projectB.daysLostToShortages} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Capacity:</span>
                  <span className="font-mono text-slate-700">{projectB.capacityDisplay}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Delta Callout */}
        {projectA && projectB && (
          <div className="bg-slate-900 text-white rounded-xl p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[11px] text-slate-400 font-semibold uppercase">Comparative Variance</div>
              <div className="text-sm font-bold mt-0.5">
                Difference in completion time: {durationDiff > 0 ? `+${durationDiff}` : durationDiff} days ({durationPctChange}%)
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                Variance in material-shortage delays: {shortageDiff > 0 ? `+${shortageDiff}` : shortageDiff} days
              </div>
            </div>
            <div className="text-[11px] text-slate-400 italic max-w-xs border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-3">
              Descriptive comparison only. Does not demonstrate causality or isolate external environmental factors.
            </div>
          </div>
        )}
      </div>

      {/* Historical Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900">Historical Projects Log</h3>
          <p className="text-xs text-slate-500 mt-0.5">Complete record of past installations with lessons learned.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Project Name</th>
                <th className="px-4 py-3.5">Capacity</th>
                <th className="px-4 py-3.5">Dates</th>
                <th className="px-4 py-3.5">Total Duration</th>
                <th className="px-4 py-3.5">Shortage Loss</th>
                <th className="px-4 py-3.5">Lessons Learned</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-slate-900">
                    {p.name}
                    <div className="text-[10px] text-slate-400 font-normal">{p.location}</div>
                  </td>
                  <td className="px-4 py-3.5 font-mono">{p.capacityDisplay}</td>
                  <td className="px-4 py-3.5 text-slate-600 font-mono text-[11px]">
                    {p.startDate} → {p.completionDate}
                  </td>
                  <td className="px-4 py-3.5 font-bold text-slate-800">{p.totalDays} days</td>
                  <td className="px-4 py-3.5">
                    <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-mono">
                      {p.daysLostToShortages} days
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate">
                    {p.keyLessons || '—'}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md"
                        title="Edit project"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md"
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Historical Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[92vh] flex flex-col my-auto overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {editingItem ? 'Edit Historical Project' : 'Add Historical Completed Project'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto text-xs">
              {errorMsg && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Desert Ridge Commercial Rooftop 100kW"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Capacity (kW)</label>
                  <input
                    type="number"
                    min="1"
                    value={formCapacityKw}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseInt(e.target.value) || 0;
                      setFormCapacityKw(val);
                      if (typeof val === 'number') {
                        setFormCapacityDisplay(val >= 1000 ? `${(val / 1000).toFixed(1)} MW` : `${val} kW`);
                      }
                    }}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Capacity Label</label>
                  <input
                    type="text"
                    value={formCapacityDisplay}
                    onChange={(e) => setFormCapacityDisplay(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Site Location</label>
                <input
                  type="text"
                  placeholder="City, State"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Completion Date</label>
                  <input
                    type="date"
                    value={formCompletionDate}
                    onChange={(e) => setFormCompletionDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Days Lost to Material Shortages</label>
                <input
                  type="number"
                  min="0"
                  value={formDaysLost}
                  onChange={(e) => setFormDaysLost(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Key Lessons & Observations</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Inverter switchgear held up in customs..."
                  value={formLessons}
                  onChange={(e) => setFormLessons(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Save Benchmark
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
