'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Calendar, 
  Clock, 
  Plus, 
  CheckCircle2, 
  ExternalLink,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { ShortageStatusBadge, StatusBadge } from './StatusBadge';
import { calculateShortageDelay } from '@/lib/calculator';
import { ShortageStatus } from '@/types';

interface ShortagesViewProps {
  onSelectShortage: (shortageId: string) => void;
  onOpenReportModal: () => void;
}

export const ShortagesView: React.FC<ShortagesViewProps> = ({
  onSelectShortage,
  onOpenReportModal,
}) => {
  const { shortages, projects } = useApp();

  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'delay' | 'date' | 'missingQty'>('delay');

  // Enrich shortages with project info and delay forecast
  const enriched = shortages.map((s) => {
    const proj = projects.find((p) => p.id === s.projectId);
    const delay = calculateShortageDelay(
      s.expectedDeliveryDays,
      s.remainingInstallationDays,
      s.scheduleBufferDays,
      proj?.plannedCompletionDate
    );
    const missingQty = Math.max(0, s.quantityRequired - s.quantityAvailable);

    return {
      ...s,
      project: proj,
      delay,
      missingQty,
    };
  });

  // Filter
  const filtered = enriched.filter((item) => {
    const matchesSearch =
      item.materialName.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase()) ||
      item.responsiblePurchasing.toLowerCase().includes(search.toLowerCase()) ||
      (item.project?.name.toLowerCase().includes(search.toLowerCase()) ?? false);

    const matchesProject = projectFilter === 'all' || item.projectId === projectFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesRisk = riskFilter === 'all' || item.delay.riskStatus === riskFilter;

    return matchesSearch && matchesProject && matchesStatus && matchesRisk;
  });

  // Sort
  filtered.sort((a, b) => {
    if (sortBy === 'delay') {
      return b.delay.estimatedDelayDays - a.delay.estimatedDelayDays;
    } else if (sortBy === 'missingQty') {
      return b.missingQty - a.missingQty;
    } else {
      return new Date(b.dateReported).getTime() - new Date(a.dateReported).getTime();
    }
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Material Shortages Tracker</h2>
            <span className="text-xs bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">
              {shortages.filter((s) => s.status !== 'resolved' && s.status !== 'received').length} Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor missing electrical and racking components, track supplier ETA revisions, and coordinate procurement.
          </p>
        </div>

        <button
          onClick={onOpenReportModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Report New Shortage</span>
        </button>
      </div>

      {/* Filter and Controls Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search field */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by material, part name, project or purchaser..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2 self-end md:self-auto text-xs">
            <span className="text-slate-400 font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
            >
              <option value="delay">Highest Schedule Delay</option>
              <option value="missingQty">Largest Missing Deficit</option>
              <option value="date">Most Recently Reported</option>
            </select>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Project:</span>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-700"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="reported">Reported</option>
              <option value="procurement_in_progress">Procurement in progress</option>
              <option value="delivery_confirmed">Delivery confirmed</option>
              <option value="received">Received on site</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Risk:</span>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-700"
            >
              <option value="all">All Risks</option>
              <option value="delayed">Delayed (&gt;5 days)</option>
              <option value="at_risk">At Risk (1-5 days)</option>
              <option value="on_track">On Track (0 days)</option>
            </select>
          </div>

          {(search || projectFilter !== 'all' || statusFilter !== 'all' || riskFilter !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setProjectFilter('all');
                setStatusFilter('all');
                setRiskFilter('all');
              }}
              className="ml-auto text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer underline text-[11px]"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Shortages Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Material & Component</th>
                <th className="px-4 py-3.5">Project</th>
                <th className="px-4 py-3.5">Deficit / Qty</th>
                <th className="px-4 py-3.5">ETA</th>
                <th className="px-4 py-3.5">Est. Delay</th>
                <th className="px-4 py-3.5">Procurement Owner</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Reported</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-slate-400">
                    No material shortages found matching the selected criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onSelectShortage(item.id)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-3.5 font-semibold text-slate-900 group-hover:text-emerald-700">
                      <div className="flex items-center gap-1.5">
                        <span className="line-clamp-1">{item.materialName}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal">{item.category}</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700">
                      <span className="line-clamp-1 font-medium">{item.project?.name || 'Project'}</span>
                    </td>
                    <td className="px-4 py-3.5 font-mono">
                      <span className="font-bold text-rose-600">
                        {item.missingQty} {item.unit}
                      </span>
                      <div className="text-[10px] text-slate-400">
                        ({item.quantityAvailable}/{item.quantityRequired})
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-900">{item.expectedDeliveryDays}d</span>
                      <div className="text-[10px] text-slate-400 font-mono">buffer: {item.scheduleBufferDays}d</div>
                    </td>
                    <td className="px-4 py-3.5">
                      {item.delay.estimatedDelayDays > 0 ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                          item.delay.estimatedDelayDays > 5 
                            ? 'bg-rose-100 text-rose-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          +{item.delay.estimatedDelayDays} days
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-semibold text-xs">
                          0 days (Buffered)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 truncate max-w-[140px]">
                      {item.responsiblePurchasing}
                    </td>
                    <td className="px-4 py-3.5">
                      <ShortageStatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 text-[11px] font-mono">
                      {new Date(item.dateReported).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-emerald-700 group-hover:text-emerald-800 font-semibold inline-flex items-center gap-0.5 text-xs">
                        Details <ChevronRight className="w-3.5 h-3.5" />
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
