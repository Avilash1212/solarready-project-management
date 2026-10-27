'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  RotateCcw, 
  ShieldAlert, 
  Database, 
  User, 
  Info, 
  CheckCircle2, 
  Layers,
  Sparkles,
  HelpCircle
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { currentUser, resetToDemoData } = useApp();
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleReset = () => {
    if (confirm('Are you sure you want to restore all projects, shortages, and historical data to initial demo seeds? Any custom edits will be reset.')) {
      resetToDemoData();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Application Settings & Prototype Info</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Prototype environment configuration, demo profiles, and portfolio metadata.
        </p>
      </div>

      {resetSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Demo dataset successfully refreshed and restored to initial state!</span>
        </div>
      )}

      {/* User Persona & Simulation Profile */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">Current User Session</h3>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80 text-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Active Profile:</span>
            <span className="font-bold text-slate-900">{currentUser.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Role:</span>
            <span className="font-medium text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">{currentUser.role}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Demo Organization:</span>
            <span className="text-slate-700">SolarReady EPC Infrastructure Corp.</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-400">
          Simulated user context is used when logging delivery estimate changes in the audit history.
        </p>
      </div>

      {/* Data Management & Reset */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">Local Data Storage</h3>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          SolarReady prototype state is persisted in your browser via <strong>LocalStorage</strong>. Any added projects, reported shortages, or ETA updates survive browser reloads.
        </p>

        <div className="pt-2">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Demo Data to Initial Seeds</span>
          </button>
        </div>
      </div>

      {/* Product Methodology & Portfolio Notes */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3 text-xs">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">Methodology & Assumptions</h3>
        </div>

        <div className="space-y-2 text-slate-600 leading-relaxed">
          <p>
            • <strong>Delay Formula:</strong> <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">max(0, expected delivery days + remaining installation days - schedule buffer)</code>.
          </p>
          <p>
            • <strong>Critical Path Heuristic:</strong> To avoid double-counting parallel delays across multiple parts on the same project, the maximum critical shortage delay represents the primary project slip.
          </p>
          <p>
            • <strong>Limitations:</strong> This portfolio application utilizes transparent deterministic heuristics rather than an unpredictable black-box ML model. Real-world commercial EPC projects may involve parallel string work, subcontractor standby agreements, or crane re-mobilization fees.
          </p>
        </div>
      </div>

    </div>
  );
};
