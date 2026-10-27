'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { X, AlertTriangle, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { calculateShortageDelay } from '@/lib/calculator';

interface ReportShortageModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: string;
}

export const ReportShortageModal: React.FC<ReportShortageModalProps> = ({
  isOpen,
  onClose,
  defaultProjectId,
}) => {
  const { projects, addShortage } = useApp();

  const [projectId, setProjectId] = useState(defaultProjectId || (projects[0]?.id ?? ''));
  const [materialName, setMaterialName] = useState('');
  const [category, setCategory] = useState<'Modules' | 'Inverters' | 'Mounting Structures' | 'DC/AC Cables' | 'Transformers & Switchgears' | 'Safety & Balance of System'>('DC/AC Cables');
  const [quantityRequired, setQuantityRequired] = useState<number | ''>(100);
  const [quantityAvailable, setQuantityAvailable] = useState<number | ''>(20);
  const [unit, setUnit] = useState('pcs');
  const [dateNeeded, setDateNeeded] = useState('2026-11-01');
  const [remainingInstallationDays, setRemainingInstallationDays] = useState<number | ''>(3);
  const [scheduleBufferDays, setScheduleBufferDays] = useState<number | ''>(2);
  const [expectedDeliveryDays, setExpectedDeliveryDays] = useState<number | ''>(5);
  const [responsiblePurchasing, setResponsiblePurchasing] = useState('Elena Rostova');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  // Selected project
  const selectedProj = projects.find((p) => p.id === (projectId || defaultProjectId || projects[0]?.id));

  // Calculations
  const reqQty = Number(quantityRequired) || 0;
  const availQty = Number(quantityAvailable) || 0;
  const missingQty = Math.max(0, reqQty - availQty);

  const deliveryDays = Number(expectedDeliveryDays) || 0;
  const installDays = Number(remainingInstallationDays) || 0;
  const bufferDays = Number(scheduleBufferDays) || 0;

  const delayForecast = calculateShortageDelay(
    deliveryDays,
    installDays,
    bufferDays,
    selectedProj?.plannedCompletionDate
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!projectId) {
      setErrorMsg('Please select a project.');
      return;
    }
    if (!materialName.trim()) {
      setErrorMsg('Material name is required.');
      return;
    }
    if (reqQty <= 0) {
      setErrorMsg('Quantity required must be greater than zero.');
      return;
    }
    if (availQty < 0) {
      setErrorMsg('Quantity available cannot be negative.');
      return;
    }
    if (missingQty <= 0) {
      setErrorMsg('Quantity available satisfies or exceeds requirement; no material shortage exists.');
      return;
    }
    if (deliveryDays < 0 || installDays < 0 || bufferDays < 0) {
      setErrorMsg('Day estimates cannot be negative.');
      return;
    }

    addShortage({
      projectId,
      materialName: materialName.trim(),
      category,
      quantityRequired: reqQty,
      quantityAvailable: availQty,
      unit,
      dateNeeded,
      remainingInstallationDays: installDays,
      scheduleBufferDays: bufferDays,
      expectedDeliveryDays: deliveryDays,
      responsiblePurchasing: responsiblePurchasing.trim() || 'Elena Rostova',
      status: 'reported',
      photoUrl: photoUrl.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-md bg-rose-100 text-rose-700">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-slate-900">Report Material Shortage</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Log missing EPC components, set delivery ETA, and compute immediate delay impacts.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isSuccess && (
            <div className="p-4 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Shortage reported successfully! Real-time notifications and dashboard metrics updated.</span>
            </div>
          )}

          {/* Section 1: Project & Component */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">1. Project & Material Identification</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Solar Project <span className="text-rose-500">*</span>
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.capacityDisplay})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Component Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="DC/AC Cables">DC/AC Cables & Connectors</option>
                  <option value="Modules">Photovoltaic Modules</option>
                  <option value="Inverters">Inverters & Optimization</option>
                  <option value="Mounting Structures">Mounting Racking & Clamps</option>
                  <option value="Transformers & Switchgears">Transformers & Switchgear</option>
                  <option value="Safety & Balance of System">Balance of System & Safety</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Material Name / Specification <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., 6mm² Solar PV UV-Resistant DC Cable (Red), 1000V rated"
                  value={materialName}
                  onChange={(e) => setMaterialName(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Quantities & Shortage Calculation */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">2. Quantity Assessment</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Required <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantityRequired}
                  onChange={(e) => setQuantityRequired(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Available on Site
                </label>
                <input
                  type="number"
                  min="0"
                  value={quantityAvailable}
                  onChange={(e) => setQuantityAvailable(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unit of Measure
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="meters">Meters (m)</option>
                  <option value="sets">Sets / Kits</option>
                  <option value="boxes">Boxes</option>
                  <option value="kg">Kilograms (kg)</option>
                </select>
              </div>
            </div>

            {/* Auto calculated missing qty callout */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">
                Auto-calculated Missing Quantity:
              </span>
              <span className={`text-sm font-bold ${missingQty > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {missingQty > 0 ? `${missingQty} ${unit} missing` : 'No shortage detected'}
              </span>
            </div>
          </div>

          {/* Section 3: Schedule, Buffer & Delay Forecasting Inputs */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">3. Schedule & Buffer Dynamics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date Needed
                </label>
                <input
                  type="date"
                  value={dateNeeded}
                  onChange={(e) => setDateNeeded(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Remaining Install (days)
                </label>
                <input
                  type="number"
                  min="0"
                  value={remainingInstallationDays}
                  onChange={(e) => setRemainingInstallationDays(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Schedule Buffer (days)
                </label>
                <input
                  type="number"
                  min="0"
                  value={scheduleBufferDays}
                  onChange={(e) => setScheduleBufferDays(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expected Delivery (days)
                </label>
                <input
                  type="number"
                  min="0"
                  value={expectedDeliveryDays}
                  onChange={(e) => setExpectedDeliveryDays(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Live Delay Forecast Preview */}
            <div className="mt-3 p-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Immediate Delay Impact Preview
                </span>
                <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wide text-[10px] ${
                  delayForecast.riskStatus === 'delayed'
                    ? 'bg-rose-100 text-rose-800'
                    : delayForecast.riskStatus === 'at_risk'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {delayForecast.riskStatus.replace('_', ' ')}
                </span>
              </div>
              <div className="text-xs text-slate-600 mt-1.5">
                Formula: max(0, {deliveryDays}d delivery + {installDays}d install - {bufferDays}d buffer) = <strong>{delayForecast.estimatedDelayDays} day(s) project completion slip</strong>
              </div>
            </div>
          </div>

          {/* Section 4: Responsibility & Logistics */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">4. Procurement Assignment & Context</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Responsible Purchasing Person <span className="text-rose-500">*</span>
                </label>
                <select
                  value={responsiblePurchasing}
                  onChange={(e) => setResponsiblePurchasing(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="Elena Rostova">Elena Rostova (Lead Purchasing)</option>
                  <option value="Tom Henders">Tom Henders (Procurement Specialist)</option>
                  <option value="Sara Lin">Sara Lin (Supply Chain Expediter)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Attachment / Photo URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="https://... or photo tag reference"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  On-Site Notes / Root Cause
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain reason for discrepancy (e.g. shipping damage, missing crates, count mismatch upon delivery)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Submit Shortage & Update Forecast</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
