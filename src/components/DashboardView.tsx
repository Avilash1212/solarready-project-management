'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  FolderKanban, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  ArrowUpRight, 
  CheckCircle2, 
  TrendingUp, 
  Filter,
  Plus,
  ArrowRight,
  ShieldAlert,
  Layers
} from 'lucide-react';
import { calculateProjectMetrics, calculateShortageDelay } from '@/lib/calculator';
import { StatusBadge, ShortageStatusBadge } from './StatusBadge';
import { ProjectStatus } from '@/types';

interface DashboardViewProps {
  onSelectProject: (projectId: string) => void;
  onSelectShortage: (shortageId: string) => void;
  onOpenReportModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectProject,
  onSelectShortage,
  onOpenReportModal,
}) => {
  const { projects, shortages } = useApp();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Compute metrics across all projects
  const activeProjects = projects.filter((p) => !p.actualCompletionDate);
  const completedProjects = projects.filter((p) => !!p.actualCompletionDate);

  const activeShortages = shortages.filter(
    (s) => s.status !== 'resolved' && s.status !== 'received'
  );

  // Calculate project metrics map
  const projectMetrics = projects.map((p) => {
    const metrics = calculateProjectMetrics(p, shortages);
    return {
      project: p,
      ...metrics,
    };
  });

  const projectsAtRisk = projectMetrics.filter(
    (pm) => pm.status === 'at_risk' || pm.status === 'delayed'
  ).length;

  // Total estimated delay across active projects (non-double counting project critical delays)
  const totalDelayDaysAcrossProjects = projectMetrics
    .filter((pm) => pm.status !== 'completed')
    .reduce((acc, curr) => acc + curr.maxEstimatedDelay, 0);

  // Filtered projects for the table
  const filteredProjects = projectMetrics.filter((pm) => {
    if (statusFilter === 'all') return true;
    return pm.status === statusFilter;
  });

  // Top critical risks across all shortages
  const sortedShortagesWithDelays = activeShortages
    .map((s) => {
      const proj = projects.find((p) => p.id === s.projectId);
      const delay = calculateShortageDelay(
        s.expectedDeliveryDays,
        s.remainingInstallationDays,
        s.scheduleBufferDays,
        proj?.plannedCompletionDate
      );
      return {
        shortage: s,
        project: proj,
        delay,
      };
    })
    .sort((a, b) => b.delay.estimatedDelayDays - a.delay.estimatedDelayDays);

  return (
    <div className="space-y-6">
      
      {/* Top Value Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-700/60 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded border border-emerald-500/30">
                EPC Schedule Sentinel
              </span>
              <span className="text-xs text-slate-400">Heuristic Engine v1.0</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Project Readiness & Delay Safeguard
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Detect missing components before installers arrive on site. Dynamic schedule buffer models prevent cascading contractor standby costs.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenReportModal}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Report Material Shortage</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Active Projects */}
        <div className="bg-white rounded-xl p-4.5 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Projects</span>
            <FolderKanban className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{activeProjects.length}</span>
            <span className="text-xs text-slate-500 font-medium">({completedProjects.length} completed)</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Across commercial & utility rooftop</span>
          </div>
        </div>

        {/* Projects At Risk */}
        <div className={`rounded-xl p-4.5 border shadow-2xs transition-colors ${
          projectsAtRisk > 0 
            ? 'bg-amber-50/50 border-amber-200' 
            : 'bg-white border-slate-200/90'
        }`}>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Projects At Risk</span>
            <AlertTriangle className={`w-4 h-4 ${projectsAtRisk > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-extrabold ${projectsAtRisk > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
              {projectsAtRisk}
            </span>
            <span className="text-xs text-slate-500">require procurement action</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-700 font-medium">
            Schedule buffer under compression
          </div>
        </div>

        {/* Open Material Shortages */}
        <div className={`rounded-xl p-4.5 border shadow-2xs transition-colors ${
          activeShortages.length > 0 
            ? 'bg-rose-50/40 border-rose-200' 
            : 'bg-white border-slate-200/90'
        }`}>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Open Shortages</span>
            <ShieldAlert className={`w-4 h-4 ${activeShortages.length > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-extrabold ${activeShortages.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {activeShortages.length}
            </span>
            <span className="text-xs text-slate-500">items missing on site</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {shortages.length - activeShortages.length} resolved to date
          </div>
        </div>

        {/* Total Estimated Delay Days */}
        <div className={`rounded-xl p-4.5 border shadow-2xs transition-colors ${
          totalDelayDaysAcrossProjects > 0 
            ? 'bg-slate-900 text-white border-slate-800' 
            : 'bg-white border-slate-200/90'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${totalDelayDaysAcrossProjects > 0 ? 'text-slate-300' : 'text-slate-500'}`}>
              Est. Schedule Slip
            </span>
            <Clock className={`w-4 h-4 ${totalDelayDaysAcrossProjects > 0 ? 'text-rose-400' : 'text-slate-400'}`} />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-extrabold ${totalDelayDaysAcrossProjects > 0 ? 'text-rose-400' : 'text-slate-900'}`}>
              {totalDelayDaysAcrossProjects} <span className="text-base font-normal">days</span>
            </span>
          </div>
          <div className={`mt-2 text-[11px] ${totalDelayDaysAcrossProjects > 0 ? 'text-slate-300' : 'text-slate-500'}`}>
            Aggregated critical-path schedule loss
          </div>
        </div>
      </div>

      {/* Critical Risks Highlight Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1 rounded bg-rose-100 text-rose-700">
                <AlertTriangle className="w-3.5 h-3.5" />
              </span>
              Top Critical Project Shortages & Delivery Risks
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Items causing direct installation delay or exceeding available schedule buffer.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500">
            Showing top {Math.min(3, sortedShortagesWithDelays.length)} of {sortedShortagesWithDelays.length}
          </span>
        </div>

        {sortedShortagesWithDelays.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-lg">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            No active material shortages detected. All project buffers are secure.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {sortedShortagesWithDelays.slice(0, 3).map(({ shortage, project, delay }) => (
              <div
                key={shortage.id}
                onClick={() => onSelectShortage(shortage.id)}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      delay.estimatedDelayDays > 5 
                        ? 'bg-rose-100 text-rose-800' 
                        : delay.estimatedDelayDays > 0 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {delay.estimatedDelayDays > 0 ? `+${delay.estimatedDelayDays}d Delay` : 'Buffered'}
                    </span>
                    <ShortageStatusBadge status={shortage.status} />
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                    {shortage.materialName}
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 truncate">
                    {project?.name || 'Project'}
                  </p>

                  <div className="mt-2.5 text-[11px] text-slate-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Deficit:</span>
                      <strong className="text-slate-800">{shortage.quantityRequired - shortage.quantityAvailable} {shortage.unit}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>ETA to Site:</span>
                      <span className="font-semibold text-slate-800">{shortage.expectedDeliveryDays} days</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 truncate max-w-[130px]">
                    Owner: {shortage.responsiblePurchasing.split(' ')[0]}
                  </span>
                  <span className="text-emerald-700 font-medium flex items-center gap-0.5">
                    View Impact <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Project Overview Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        
        {/* Table Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Solar EPC Projects Portfolio</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live status, projected completion dates, and critical shortage impacts.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Projects' },
              { id: 'on_track', label: 'On Track' },
              { id: 'at_risk', label: 'At Risk' },
              { id: 'delayed', label: 'Delayed' },
              { id: 'completed', label: 'Completed' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === f.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table Element */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Project Name</th>
                <th className="px-4 py-3.5">Capacity</th>
                <th className="px-4 py-3.5">Manager</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Open Shortages</th>
                <th className="px-4 py-3.5">Estimated Delay</th>
                <th className="px-4 py-3.5">Planned Date</th>
                <th className="px-5 py-3.5">Projected Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                    No projects found for the selected status filter.
                  </td>
                </tr>
              ) : (
                filteredProjects.map(({ project, status, maxEstimatedDelay, openShortagesCount, projectedCompletionDate }) => (
                  <tr
                    key={project.id}
                    onClick={() => onSelectProject(project.id)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-3.5 font-semibold text-slate-900 group-hover:text-emerald-700">
                      <div className="flex items-center gap-1.5">
                        <span>{project.name}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600" />
                      </div>
                      <div className="text-[11px] font-normal text-slate-400 truncate max-w-xs">{project.location}</div>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-700">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-800 font-mono text-[11px]">
                        {project.capacityDisplay}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{project.projectManager}</td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={status} />
                    </td>
                    <td className="px-4 py-3.5">
                      {openShortagesCount > 0 ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {openShortagesCount} open
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {maxEstimatedDelay > 0 ? (
                        <span className={`font-bold ${maxEstimatedDelay > 5 ? 'text-rose-600' : 'text-amber-600'}`}>
                          +{maxEstimatedDelay} days
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-medium">0 days (Buffered)</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 font-mono">{project.plannedCompletionDate}</td>
                    <td className="px-5 py-3.5 font-mono">
                      <span className={`font-bold ${maxEstimatedDelay > 0 ? 'text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded' : 'text-slate-800'}`}>
                        {projectedCompletionDate}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
