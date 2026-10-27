'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  FolderKanban, 
  Plus, 
  Search, 
  MapPin, 
  User, 
  Calendar, 
  Clock, 
  ArrowUpRight,
  Edit2,
  Trash2,
  CheckCircle2,
  Layers,
  X
} from 'lucide-react';
import { calculateProjectMetrics } from '@/lib/calculator';
import { StatusBadge } from './StatusBadge';
import { Project } from '@/types';

interface ProjectsViewProps {
  onSelectProject: (projectId: string) => void;
  onOpenReportModalWithProject?: (projectId: string) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  onSelectProject,
  onOpenReportModalWithProject,
}) => {
  const { projects, shortages, addProject, updateProject, deleteProject } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal for Add/Edit Project
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCapacity, setFormCapacity] = useState<number | ''>(250);
  const [formCapacityDisplay, setFormCapacityDisplay] = useState('250 kW');
  const [formLocation, setFormLocation] = useState('');
  const [formManager, setFormManager] = useState('Marcus Vance');
  const [formPurchasing, setFormPurchasing] = useState('Elena Rostova');
  const [formStartDate, setFormStartDate] = useState('2026-11-01');
  const [formPlannedDate, setFormPlannedDate] = useState('2026-12-31');
  const [formActualDate, setFormActualDate] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const openAddModal = () => {
    setEditingProject(null);
    setFormName('');
    setFormCapacity(250);
    setFormCapacityDisplay('250 kW');
    setFormLocation('');
    setFormManager('Marcus Vance');
    setFormPurchasing('Elena Rostova');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormPlannedDate(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setFormActualDate('');
    setFormDescription('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (proj: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProject(proj);
    setFormName(proj.name);
    setFormCapacity(proj.capacityKw);
    setFormCapacityDisplay(proj.capacityDisplay);
    setFormLocation(proj.location);
    setFormManager(proj.projectManager);
    setFormPurchasing(proj.purchasingLead);
    setFormStartDate(proj.startDate);
    setFormPlannedDate(proj.plannedCompletionDate);
    setFormActualDate(proj.actualCompletionDate || '');
    setFormDescription(proj.description || '');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleDelete = (proj: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${proj.name}"? Associated shortages will also be removed.`)) {
      deleteProject(proj.id);
    }
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setErrorMsg('Project name is required.');
      return;
    }
    const cap = Number(formCapacity) || 100;
    const capDisp = formCapacityDisplay.trim() || `${cap} kW`;

    if (editingProject) {
      updateProject({
        ...editingProject,
        name: formName.trim(),
        capacityKw: cap,
        capacityDisplay: capDisp,
        location: formLocation.trim() || 'Solar Site',
        projectManager: formManager.trim() || 'Marcus Vance',
        purchasingLead: formPurchasing.trim() || 'Elena Rostova',
        startDate: formStartDate,
        plannedCompletionDate: formPlannedDate,
        actualCompletionDate: formActualDate.trim() || undefined,
        description: formDescription.trim() || undefined,
      });
    } else {
      addProject({
        name: formName.trim(),
        capacityKw: cap,
        capacityDisplay: capDisp,
        location: formLocation.trim() || 'Solar Site',
        projectManager: formManager.trim() || 'Marcus Vance',
        purchasingLead: formPurchasing.trim() || 'Elena Rostova',
        startDate: formStartDate,
        plannedCompletionDate: formPlannedDate,
        actualCompletionDate: formActualDate.trim() || undefined,
        description: formDescription.trim() || undefined,
      });
    }

    setIsModalOpen(false);
  };

  // Compute metrics for display
  const enrichedProjects = projects.map((proj) => {
    const metrics = calculateProjectMetrics(proj, shortages);
    return {
      ...proj,
      metrics,
    };
  });

  const filtered = enrichedProjects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase()) ||
      p.projectManager.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || p.metrics.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Solar EPC Projects</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage installations, monitor procurement milestones, and track schedule buffer integrity.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Project</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects by name, location, or PM..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'all', label: 'All Statuses' },
            { id: 'on_track', label: 'On Track' },
            { id: 'at_risk', label: 'At Risk' },
            { id: 'delayed', label: 'Delayed' },
            { id: 'completed', label: 'Completed' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setStatusFilter(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === item.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-500">
          <FolderKanban className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          No solar projects match your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
          {filtered.map((proj) => (
            <div
              key={proj.id}
              onClick={() => onSelectProject(proj.id)}
              className="bg-white rounded-xl border border-slate-200/90 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-5">
                {/* Top Badge & Capacity */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                    {proj.capacityDisplay}
                  </span>
                  <StatusBadge status={proj.metrics.status} />
                </div>

                {/* Project Title */}
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                  {proj.name}
                </h3>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{proj.location}</span>
                </div>

                {/* Metrics Breakdown */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Open Shortages</span>
                    <span className={`font-bold text-sm ${proj.metrics.openShortagesCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                      {proj.metrics.openShortagesCount} items
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Estimated Slip</span>
                    <span className={`font-bold text-sm ${proj.metrics.maxEstimatedDelay > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {proj.metrics.maxEstimatedDelay > 0 ? `+${proj.metrics.maxEstimatedDelay} days` : '0 days'}
                    </span>
                  </div>
                </div>

                {/* Schedule timeline dates */}
                <div className="mt-3.5 space-y-1 text-[11px] text-slate-500">
                  <div className="flex items-center justify-between">
                    <span>Planned Target:</span>
                    <span className="font-mono font-medium text-slate-700">{proj.plannedCompletionDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Projected Target:</span>
                    <span className={`font-mono font-bold ${proj.metrics.maxEstimatedDelay > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                      {proj.metrics.projectedCompletionDate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer with actions */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500 truncate max-w-[140px]">
                  PM: {proj.projectManager}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => openEditModal(proj, e)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
                    title="Edit project details"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(proj, e)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    title="Delete project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-emerald-700 font-semibold flex items-center pl-1 text-[11px]">
                    Details <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[92vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {editingProject ? 'Edit Solar Project' : 'Add New Solar EPC Project'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="p-6 space-y-4 overflow-y-auto text-xs">
              {errorMsg && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Project Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Project F — 750 kW Ground Mount"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Capacity (kW)</label>
                  <input
                    type="number"
                    min="1"
                    value={formCapacity}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseInt(e.target.value) || 0;
                      setFormCapacity(val);
                      if (typeof val === 'number') {
                        setFormCapacityDisplay(val >= 1000 ? `${(val / 1000).toFixed(1)} MW` : `${val} kW`);
                      }
                    }}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Capacity Display</label>
                  <input
                    type="text"
                    value={formCapacityDisplay}
                    onChange={(e) => setFormCapacityDisplay(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                    placeholder="e.g. 250 kW, 1 MW"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Site Location</label>
                <input
                  type="text"
                  placeholder="City, State, Facility Name"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Project Manager</label>
                  <input
                    type="text"
                    value={formManager}
                    onChange={(e) => setFormManager(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Purchasing Lead</label>
                  <input
                    type="text"
                    value={formPurchasing}
                    onChange={(e) => setFormPurchasing(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
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
                  <label className="block font-semibold text-slate-700 mb-1">Planned Completion</label>
                  <input
                    type="date"
                    value={formPlannedDate}
                    onChange={(e) => setFormPlannedDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Actual Completion Date (Optional, if completed)</label>
                <input
                  type="date"
                  value={formActualDate}
                  onChange={(e) => setFormActualDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Project Scope</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="System details, racking configuration, utility interconnect notes..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors cursor-pointer"
                >
                  {editingProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
