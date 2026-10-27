'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  History, 
  Package, 
  CheckCircle, 
  Send,
  AlertOctagon,
  ArrowRight,
  TrendingUp,
  FileText
} from 'lucide-react';
import { ShortageStatusBadge } from './StatusBadge';
import { DelayCalculatorWidget } from './DelayCalculatorWidget';
import { ShortageStatus } from '@/types';

interface ShortageDetailModalProps {
  shortageId: string | null;
  onClose: () => void;
  onOpenProjectDetail?: (projectId: string) => void;
}

export const ShortageDetailModal: React.FC<ShortageDetailModalProps> = ({
  shortageId,
  onClose,
  onOpenProjectDetail,
}) => {
  const { 
    shortages, 
    projects, 
    updateShortageDeliveryEstimate, 
    updateShortageStatus, 
    markMaterialReceived 
  } = useApp();

  const shortage = shortages.find((s) => s.id === shortageId);
  const project = projects.find((p) => p.id === shortage?.projectId);

  // Form states for delivery ETA update
  const [newDeliveryDays, setNewDeliveryDays] = useState<number>(shortage ? shortage.expectedDeliveryDays : 0);
  const [reason, setReason] = useState<string>('');
  const [isUpdatingETA, setIsUpdatingETA] = useState<boolean>(false);

  // Form state for receiving material
  const [receiveQty, setReceiveQty] = useState<number>(0);
  const [isReceiving, setIsReceiving] = useState<boolean>(false);

  if (!shortage || !project) return null;

  const missingQty = Math.max(0, shortage.quantityRequired - shortage.quantityAvailable);

  const handleUpdateETA = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDeliveryDays < 0) return;
    updateShortageDeliveryEstimate(shortage.id, newDeliveryDays, reason.trim() || undefined);
    setIsUpdatingETA(false);
    setReason('');
  };

  const handleReceiveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (receiveQty <= 0) return;
    markMaterialReceived(shortage.id, receiveQty);
    setIsReceiving(false);
    setReceiveQty(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShortageStatusBadge status={shortage.status} />
              <span className="text-xs font-mono text-slate-400">ID: {shortage.id}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 leading-snug">{shortage.materialName}</h2>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
              <span>Project:</span>
              <button
                onClick={() => {
                  onClose();
                  if (onOpenProjectDetail) onOpenProjectDetail(project.id);
                }}
                className="font-semibold text-emerald-700 hover:text-emerald-800 underline underline-offset-2 cursor-pointer"
              >
                {project.name} ({project.capacityDisplay})
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div>
              <div className="text-[11px] font-medium text-slate-500">Missing Quantity</div>
              <div className="text-base font-bold text-rose-600 mt-0.5">
                {missingQty} <span className="text-xs font-normal text-slate-600">{shortage.unit}</span>
              </div>
              <div className="text-[10px] text-slate-400">
                {shortage.quantityAvailable} of {shortage.quantityRequired} available
              </div>
            </div>

            <div>
              <div className="text-[11px] font-medium text-slate-500">Expected Delivery</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {shortage.expectedDeliveryDays} <span className="text-xs font-normal text-slate-600">days</span>
              </div>
              <div className="text-[10px] text-slate-400">
                Remaining Work: {shortage.remainingInstallationDays}d
              </div>
            </div>

            <div>
              <div className="text-[11px] font-medium text-slate-500">Schedule Buffer</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {shortage.scheduleBufferDays} <span className="text-xs font-normal text-slate-600">days</span>
              </div>
              <div className="text-[10px] text-slate-400">
                Date needed: {shortage.dateNeeded}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-medium text-slate-500">Procurement Owner</div>
              <div className="text-sm font-semibold text-slate-800 mt-0.5 truncate">
                {shortage.responsiblePurchasing}
              </div>
              <div className="text-[10px] text-slate-400">Purchasing Team</div>
            </div>
          </div>

          {/* Real-time Delay Forecasting Breakdown */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Schedule Impact & Delay Forecast
            </h3>
            <DelayCalculatorWidget
              expectedDeliveryDays={shortage.expectedDeliveryDays}
              remainingInstallationDays={shortage.remainingInstallationDays}
              scheduleBufferDays={shortage.scheduleBufferDays}
              plannedCompletionDate={project.plannedCompletionDate}
              showExplanation={true}
            />
          </div>

          {/* Action Tools: Update ETA & Receive Materials */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Delivery Estimate Updater Card */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase">Update Delivery ETA</h4>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">Current: {shortage.expectedDeliveryDays} days</span>
              </div>

              {!isUpdatingETA ? (
                <div>
                  <p className="text-xs text-slate-500 mb-3">
                    Have vendor transit times changed? Update the delivery days to immediately recalculate the delay forecast and notify the PM team.
                  </p>
                  <button
                    onClick={() => {
                      setNewDeliveryDays(shortage.expectedDeliveryDays);
                      setIsUpdatingETA(true);
                    }}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Change Delivery Estimate
                  </button>
                </div>
              ) : (
                <form onSubmit={handleUpdateETA} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      New Delivery ETA (Days)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newDeliveryDays}
                      onChange={(e) => setNewDeliveryDays(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full text-xs border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Reason for Change (Logged in Audit History)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Port customs hold / Carrier expedited dispatch"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="submit"
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Save & Recalculate
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsUpdatingETA(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Status & Material Receipt Card */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase">Receive & Resolve</h4>
                </div>
                <ShortageStatusBadge status={shortage.status} />
              </div>

              {shortage.status === 'resolved' ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs">
                  <p className="font-semibold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Shortage Fully Cleared
                  </p>
                  <p className="text-[11px] mt-1 text-emerald-700">
                    All required quantities are on-site and verified. This item no longer induces any schedule delay.
                  </p>
                </div>
              ) : !isReceiving ? (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-500 font-medium">Quick Status:</label>
                    <select
                      value={shortage.status}
                      onChange={(e) => updateShortageStatus(shortage.id, e.target.value as ShortageStatus)}
                      className="flex-1 text-xs border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 bg-white"
                    >
                      <option value="reported">Reported</option>
                      <option value="procurement_in_progress">Procurement in progress</option>
                      <option value="delivery_confirmed">Delivery confirmed</option>
                      <option value="received">Received on site</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      setReceiveQty(missingQty);
                      setIsReceiving(true);
                    }}
                    className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Record Material Receipt
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReceiveMaterial} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Quantity Received ({shortage.unit})
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={missingQty}
                      value={receiveQty}
                      onChange={(e) => setReceiveQty(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-full text-xs border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      required
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Remaining deficit: {missingQty} {shortage.unit}</p>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="submit"
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Confirm Delivery
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsReceiving(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Audit History Log of ETA Changes */}
          <div className="border border-slate-200 rounded-xl p-4.5 bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              Delivery Estimate Audit Log
            </h3>
            {shortage.estimateHistory.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No delivery changes recorded yet.</p>
            ) : (
              <div className="space-y-2.5">
                {shortage.estimateHistory.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3 bg-white rounded-lg border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">
                          {item.previousDays}d → {item.newDays} days
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                          item.newDays > item.previousDays 
                            ? 'bg-rose-100 text-rose-700' 
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {item.newDays > item.previousDays ? `+${item.newDays - item.previousDays}d pushback` : `${item.newDays - item.previousDays}d improvement`}
                        </span>
                      </div>
                      {item.reason && (
                        <p className="text-[11px] text-slate-600 mt-1">"{item.reason}"</p>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 sm:text-right shrink-0">
                      <div>{item.changedBy}</div>
                      <div>{new Date(item.changedAt).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes & Root Cause */}
          {shortage.notes && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Engineering & Procurement Notes:
              </span>
              <p className="text-slate-600">{shortage.notes}</p>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Reported on {new Date(shortage.dateReported).toLocaleDateString()}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
