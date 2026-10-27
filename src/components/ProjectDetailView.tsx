'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  ArrowLeft, 
  MapPin, 
  User, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Package, 
  CheckCircle2, 
  FileText, 
  History, 
  TrendingUp,
  Layers,
  Edit2
} from 'lucide-react';
import { calculateProjectMetrics, calculateShortageDelay } from '@/lib/calculator';
import { StatusBadge, ShortageStatusBadge } from './StatusBadge';
import { DelayCalculatorWidget } from './DelayCalculatorWidget';

interface ProjectDetailViewProps {
  projectId: string;
  onBack: () => void;
  onOpenReportModalWithProject: (projectId: string) => void;
  onSelectShortage: (shortageId: string) => void;
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  projectId,
  onBack,
  onOpenReportModalWithProject,
  onSelectShortage,
}) => {
  const { projects, shortages, notifications, updateProject } = useApp();

  const project = projects.find((p) => p.id === projectId);
  const [activeTab, setActiveTab] = useState<'shortages' | 'timeline' | 'notifications'>('shortages');

  if (!project) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Project not found.
        <button onClick={onBack} className="block mx-auto mt-2 text-emerald-600 underline">
          Back to Projects
        </button>
      </div>
    );
  }

  const projectShortages = shortages.filter((s) => s.projectId === project.id);
  const projectMetrics = calculateProjectMetrics(project, shortages);
  const projectNotifications = notifications.filter((n) => n.projectId === project.id);

  // Critical path shortage (causing max delay)
  const activeShortages = projectShortages.filter((s) => s.status !== 'resolved' && s.status !== 'received');
  let criticalShortage = activeShortages[0];
  let maxDelay = 0;
  activeShortages.forEach((s) => {
    const calc = calculateShortageDelay(
      s.expectedDeliveryDays,
      s.remainingInstallationDays,
      s.scheduleBufferDays,
      project.plannedCompletionDate
    );
    if (calc.estimatedDelayDays >= maxDelay) {
      maxDelay = calc.estimatedDelayDays;
      criticalShortage = s;
    }
  });

  return (
    <div className="space-y-6">
      
      {/* Back button and quick actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </button>

        <button
          onClick={() => onOpenReportModalWithProject(project.id)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Report Shortage for this Project</span>
        </button>
      </div>

      {/* Hero Overview Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                {project.capacityDisplay}
              </span>
              <StatusBadge status={projectMetrics.status} />
              {project.actualCompletionDate && (
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                  Finished on {project.actualCompletionDate}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{project.name}</h1>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{project.location}</span>
            </div>
          </div>

          {/* Quick Schedule KPI stats */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Planned Completion</span>
              <span className="font-mono text-xs font-bold text-slate-700">{project.plannedCompletionDate}</span>
            </div>
            <div className={`border rounded-xl p-3 text-right ${
              projectMetrics.maxEstimatedDelay > 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'
            }`}>
              <span className="text-[10px] uppercase font-semibold block text-slate-500">Projected Date</span>
              <span className={`font-mono text-xs font-extrabold ${
                projectMetrics.maxEstimatedDelay > 0 ? 'text-rose-700' : 'text-emerald-700'
              }`}>
                {projectMetrics.projectedCompletionDate}
              </span>
            </div>
          </div>
        </div>

        {/* Project Team & Description */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5 font-medium">Project Manager</span>
            <span className="font-semibold text-slate-800">{project.projectManager}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5 font-medium">Procurement Lead</span>
            <span className="font-semibold text-slate-800">{project.purchasingLead}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5 font-medium">Scope Description</span>
            <span className="text-slate-600 line-clamp-2">{project.description || 'Standard EPC deployment.'}</span>
          </div>
        </div>
      </div>

      {/* Critical Path Forecast Banner (if at risk or delayed) */}
      {criticalShortage && projectMetrics.maxEstimatedDelay > 0 && (
        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4.5 text-xs text-rose-950 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-bold text-sm text-rose-900">Critical Path Schedule Impact</span>
            </div>
            <button
              onClick={() => onSelectShortage(criticalShortage.id)}
              className="text-xs font-semibold text-rose-800 underline underline-offset-2 hover:text-rose-950 cursor-pointer"
            >
              Manage this Shortage →
            </button>
          </div>
          <p className="text-xs text-rose-800 leading-relaxed">
            The ongoing shortage of <strong>{criticalShortage.materialName}</strong> ({criticalShortage.quantityRequired - criticalShortage.quantityAvailable} {criticalShortage.unit} missing) has driven an estimated <strong>+{projectMetrics.maxEstimatedDelay} day delay</strong> beyond the project buffer.
          </p>
          <DelayCalculatorWidget
            expectedDeliveryDays={criticalShortage.expectedDeliveryDays}
            remainingInstallationDays={criticalShortage.remainingInstallationDays}
            scheduleBufferDays={criticalShortage.scheduleBufferDays}
            plannedCompletionDate={project.plannedCompletionDate}
            showExplanation={false}
          />
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('shortages')}
          className={`pb-2.5 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'shortages'
              ? 'text-emerald-700 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Material Shortages ({projectShortages.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`pb-2.5 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'timeline'
              ? 'text-emerald-700 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Activity Timeline</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`pb-2.5 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'notifications'
              ? 'text-emerald-700 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Notifications & Logs ({projectNotifications.length})</span>
        </button>
      </div>

      {/* Tab 1: Project Material Shortages List */}
      {activeTab === 'shortages' && (
        <div className="space-y-4">
          {projectShortages.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              No material shortages reported for this project. All BOM items are on-site or accounted for.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projectShortages.map((s) => {
                const calc = calculateShortageDelay(
                  s.expectedDeliveryDays,
                  s.remainingInstallationDays,
                  s.scheduleBufferDays,
                  project.plannedCompletionDate
                );
                const missingQty = Math.max(0, s.quantityRequired - s.quantityAvailable);

                return (
                  <div
                    key={s.id}
                    onClick={() => onSelectShortage(s.id)}
                    className="bg-white rounded-xl border border-slate-200 p-4.5 hover:border-emerald-400 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <ShortageStatusBadge status={s.status} />
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                          calc.estimatedDelayDays > 5
                            ? 'bg-rose-100 text-rose-800'
                            : calc.estimatedDelayDays > 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {calc.estimatedDelayDays > 0 ? `+${calc.estimatedDelayDays}d Delay` : 'Buffered (0d)'}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900">{s.materialName}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{s.category}</p>

                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Deficit</span>
                          <span className="font-bold text-rose-600">{missingQty} {s.unit}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Delivery ETA</span>
                          <span className="font-semibold text-slate-800">{s.expectedDeliveryDays} days</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Buffer</span>
                          <span className="font-semibold text-slate-800">{s.scheduleBufferDays} days</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 truncate max-w-[150px]">
                        Purchasing: {s.responsiblePurchasing}
                      </span>
                      <span className="text-emerald-700 font-semibold">
                        Update / Manage →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Activity Timeline */}
      {activeTab === 'timeline' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Project Milestone Timeline</h3>
          <div className="relative border-l-2 border-slate-200 ml-4 pl-5 space-y-6 text-xs">
            <div className="relative">
              <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
              <div className="font-bold text-slate-900">Project Mobilization & Groundwork</div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">{project.startDate}</div>
              <p className="text-slate-600 mt-1">Civil foundation work and baseline mounting structure anchor layouts initiated.</p>
            </div>

            {projectShortages.map((s) => (
              <div key={s.id} className="relative">
                <div className={`absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full ring-4 ${
                  s.status === 'resolved' 
                    ? 'bg-emerald-500 ring-emerald-50' 
                    : 'bg-rose-500 ring-rose-50'
                }`} />
                <div className="font-bold text-slate-900">
                  {s.status === 'resolved' ? 'Material Shortage Cleared' : 'Material Shortage Flagged'}: {s.materialName}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {new Date(s.dateReported).toLocaleDateString()}
                </div>
                <p className="text-slate-600 mt-1">
                  Deficit: {s.quantityRequired - s.quantityAvailable} {s.unit}. Delivery ETA set to {s.expectedDeliveryDays} days by {s.responsiblePurchasing}.
                </p>
              </div>
            ))}

            <div className="relative">
              <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-slate-300 ring-4 ring-slate-100" />
              <div className="font-bold text-slate-900">Target Project Interconnection & Commissioning</div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                Current Projected: {projectMetrics.projectedCompletionDate} (Planned: {project.plannedCompletionDate})
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Notifications & Logs */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Logged Alerts & Purchasing Dispatches</h3>
          {projectNotifications.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No notifications recorded for this project.</p>
          ) : (
            <div className="space-y-2">
              {projectNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className="p-3 rounded-lg border border-slate-200 text-xs flex items-start justify-between gap-3 bg-slate-50/50"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">{notif.title}</span>
                    <p className="text-slate-600 text-[11px] mt-0.5">{notif.message}</p>
                    <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                      {new Date(notif.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                    notif.type === 'critical' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {notif.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
