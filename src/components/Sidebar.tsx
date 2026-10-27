'use client';

import React from 'react';
import { 
  Sun, 
  LayoutDashboard, 
  FolderKanban, 
  AlertTriangle, 
  History, 
  Bell, 
  Settings,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  isOpenMobile,
  setIsOpenMobile,
}) => {
  const { notifications, shortages } = useApp();
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const criticalShortagesCount = shortages.filter(
    (s) => s.status !== 'resolved' && s.status !== 'received'
  ).length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: FolderKanban,
      badge: null,
    },
    {
      id: 'shortages',
      label: 'Material Shortages',
      icon: AlertTriangle,
      badge: criticalShortagesCount > 0 ? criticalShortagesCount : null,
      badgeColor: 'bg-rose-100 text-rose-700',
    },
    {
      id: 'historical',
      label: 'Historical Performance',
      icon: History,
      badge: null,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : null,
      badgeColor: 'bg-emerald-600 text-white',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800/80 bg-slate-950/40">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sun className="w-5 h-5 fill-emerald-400/20" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base text-white tracking-tight">SolarReady</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30 font-medium">EPC</span>
            </div>
            <p className="text-[11px] text-slate-400 font-normal">Readiness & Delay Prevention</p>
          </div>
        </div>

        {/* Navigation items */}
        <div className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Project Operations
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setIsOpenMobile(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {item.badge !== null && (
                    <span
                      className={`text-xs px-2 py-0.2 rounded-full font-bold ${
                        item.badgeColor || 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-400 opacity-80" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Demo Mode / Methodology Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/30">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3 text-xs text-slate-300 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Transparent Heuristic</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Calculates schedule buffer compression based on real-time purchasing ETA changes.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
