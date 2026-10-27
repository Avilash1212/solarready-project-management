import React from 'react';
import { calculateShortageDelay } from '@/lib/calculator';
import { StatusBadge } from './StatusBadge';
import { Calculator, Info, ShieldAlert } from 'lucide-react';

interface DelayCalculatorWidgetProps {
  expectedDeliveryDays: number;
  remainingInstallationDays: number;
  scheduleBufferDays: number;
  plannedCompletionDate?: string;
  showExplanation?: boolean;
  compact?: boolean;
}

export const DelayCalculatorWidget: React.FC<DelayCalculatorWidgetProps> = ({
  expectedDeliveryDays,
  remainingInstallationDays,
  scheduleBufferDays,
  plannedCompletionDate,
  showExplanation = true,
  compact = false,
}) => {
  const result = calculateShortageDelay(
    expectedDeliveryDays,
    remainingInstallationDays,
    scheduleBufferDays,
    plannedCompletionDate
  );

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span
          className={`font-semibold text-sm px-2 py-0.5 rounded ${
            result.estimatedDelayDays > 5
              ? 'bg-rose-100 text-rose-800'
              : result.estimatedDelayDays > 0
              ? 'bg-amber-100 text-amber-800'
              : 'bg-emerald-100 text-emerald-800'
          }`}
        >
          {result.estimatedDelayDays > 0 ? `+${result.estimatedDelayDays} days` : '0 days (Buffered)'}
        </span>
        <StatusBadge status={result.riskStatus} />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 text-sm space-y-3">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-slate-800">Delay Forecasting Model</span>
          <span className="text-xs bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">v1 Heuristic</span>
        </div>
        <StatusBadge status={result.riskStatus} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-1">
        <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500">Expected Delivery</div>
          <div className="text-lg font-bold text-slate-900 mt-0.5">{result.expectedDeliveryDays} <span className="text-xs font-normal text-slate-500">days</span></div>
        </div>
        <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500">Remaining Install</div>
          <div className="text-lg font-bold text-slate-900 mt-0.5">{result.remainingInstallationDays} <span className="text-xs font-normal text-slate-500">days</span></div>
        </div>
        <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500">Schedule Buffer</div>
          <div className="text-lg font-bold text-slate-900 mt-0.5">{result.scheduleBufferDays} <span className="text-xs font-normal text-slate-500">days</span></div>
        </div>
        <div className={`p-2.5 rounded-lg border shadow-xs ${
          result.estimatedDelayDays > 5 
            ? 'bg-rose-50 border-rose-200 text-rose-900' 
            : result.estimatedDelayDays > 0 
            ? 'bg-amber-50 border-amber-200 text-amber-900' 
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}>
          <div className="text-xs font-medium">Estimated Delay</div>
          <div className="text-lg font-extrabold mt-0.5">
            {result.estimatedDelayDays > 0 ? `+${result.estimatedDelayDays} days` : '0 days'}
          </div>
        </div>
      </div>

      {showExplanation && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-start gap-2 text-xs text-slate-600 bg-white/80 p-2.5 rounded-md border border-slate-200">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-800 font-mono text-[11px] mb-0.5">
                Formula: max(0, {result.expectedDeliveryDays}d ETA + {result.remainingInstallationDays}d Install - {result.scheduleBufferDays}d Buffer) = {result.estimatedDelayDays}d
              </p>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                {result.explanation}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50/70 px-2.5 py-1.5 rounded border border-amber-200/60">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-600" />
            <span>
              <strong>Notice:</strong> Simplified deterministic estimate. Actual EPC project completion may differ due to parallel stringing, workforce shifts, and site contingencies.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
