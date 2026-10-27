'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  AlertTriangle, 
  AlertOctagon, 
  Info, 
  CheckCircle2, 
  ArrowRight,
  Clock
} from 'lucide-react';

interface NotificationsViewProps {
  onNavigateTab: (tab: string, id?: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onNavigateTab }) => {
  const { 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    clearNotification 
  } = useApp();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Notification Center</h2>
            {unreadCount > 0 && (
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time procurement alerts, ETA revisions, and critical delay notifications for PM & Purchasing.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsAsRead}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* List */}
      {notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-500">
          <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          No notifications in your feed. All project procurement milestones are running smoothly.
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => {
            let Icon = Info;
            let iconBg = 'bg-slate-100 text-slate-600';

            if (item.type === 'critical') {
              Icon = AlertOctagon;
              iconBg = 'bg-rose-100 text-rose-600';
            } else if (item.type === 'warning') {
              Icon = AlertTriangle;
              iconBg = 'bg-amber-100 text-amber-600';
            } else if (item.type === 'success') {
              Icon = CheckCircle2;
              iconBg = 'bg-emerald-100 text-emerald-600';
            }

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (!item.isRead) markNotificationAsRead(item.id);
                  if (item.linkTab) onNavigateTab(item.linkTab, item.linkId);
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                  !item.isRead
                    ? 'bg-white border-emerald-300 shadow-xs'
                    : 'bg-white/70 border-slate-200 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`p-2 rounded-lg shrink-0 ${iconBg}`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{item.title}</span>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{item.message}</p>

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
                      {item.projectName && (
                        <span className="font-semibold text-slate-600">{item.projectName}</span>
                      )}
                      <span>•</span>
                      <span className="font-mono">{new Date(item.timestamp).toLocaleString()}</span>
                      {item.estimatedDelay !== undefined && item.estimatedDelay > 0 && (
                        <>
                          <span>•</span>
                          <span className="font-bold text-rose-600">
                            +{item.estimatedDelay}d Project Slip
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-center">
                  {item.linkTab && (
                    <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-0.5 hover:underline">
                      View <ArrowRight className="w-3 h-3" />
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearNotification(item.id);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
                    title="Dismiss"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
