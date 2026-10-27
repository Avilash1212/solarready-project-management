'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project, MaterialShortage, NotificationItem, HistoricalProject, ShortageStatus } from '@/types';
import { INITIAL_PROJECTS, INITIAL_SHORTAGES, INITIAL_NOTIFICATIONS, INITIAL_HISTORICAL_PROJECTS } from '@/lib/initialData';
import { calculateShortageDelay, calculateDaysBetween } from '@/lib/calculator';

interface AppContextType {
  projects: Project[];
  shortages: MaterialShortage[];
  notifications: NotificationItem[];
  historicalProjects: HistoricalProject[];
  currentUser: { name: string; role: string; email: string };
  
  // Project actions
  addProject: (project: Omit<Project, 'id'>) => Project;
  updateProject: (project: Project) => void;
  deleteProject: (id: string) => void;

  // Shortage actions
  addShortage: (shortageData: Omit<MaterialShortage, 'id' | 'dateReported' | 'estimateHistory'>) => MaterialShortage;
  updateShortageDeliveryEstimate: (shortageId: string, newDays: number, reason?: string) => void;
  updateShortageStatus: (shortageId: string, newStatus: ShortageStatus, notes?: string) => void;
  markMaterialReceived: (shortageId: string, quantityReceived: number) => void;
  deleteShortage: (shortageId: string) => void;

  // Notification actions
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotification: (id: string) => void;

  // Historical actions
  addHistoricalProject: (data: Omit<HistoricalProject, 'id' | 'totalDays'>) => HistoricalProject;
  updateHistoricalProject: (data: HistoricalProject) => void;
  deleteHistoricalProject: (id: string) => void;

  // State reset
  resetToDemoData: () => void;
}

const STORAGE_KEYS = {
  PROJECTS: 'solarready_projects_v1',
  SHORTAGES: 'solarready_shortages_v1',
  NOTIFICATIONS: 'solarready_notifications_v1',
  HISTORICAL: 'solarready_historical_v1',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser] = useState({
    name: 'Marcus Vance',
    role: 'Lead Project Manager (EPC)',
    email: 'marcus.v@solarready-demo.com',
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [shortages, setShortages] = useState<MaterialShortage[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [historicalProjects, setHistoricalProjects] = useState<HistoricalProject[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from LocalStorage or seed data
  useEffect(() => {
    try {
      const storedProj = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      const storedShort = localStorage.getItem(STORAGE_KEYS.SHORTAGES);
      const storedNotif = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      const storedHist = localStorage.getItem(STORAGE_KEYS.HISTORICAL);

      setProjects(storedProj ? JSON.parse(storedProj) : INITIAL_PROJECTS);
      setShortages(storedShort ? JSON.parse(storedShort) : INITIAL_SHORTAGES);
      setNotifications(storedNotif ? JSON.parse(storedNotif) : INITIAL_NOTIFICATIONS);
      setHistoricalProjects(storedHist ? JSON.parse(storedHist) : INITIAL_HISTORICAL_PROJECTS);
    } catch (e) {
      console.error('Error loading data from localStorage', e);
      setProjects(INITIAL_PROJECTS);
      setShortages(INITIAL_SHORTAGES);
      setNotifications(INITIAL_NOTIFICATIONS);
      setHistoricalProjects(INITIAL_HISTORICAL_PROJECTS);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save to LocalStorage whenever state changes (only after init)
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
      localStorage.setItem(STORAGE_KEYS.SHORTAGES, JSON.stringify(shortages));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
      localStorage.setItem(STORAGE_KEYS.HISTORICAL, JSON.stringify(historicalProjects));
    } catch (e) {
      console.error('Error saving data to localStorage', e);
    }
  }, [projects, shortages, notifications, historicalProjects, isInitialized]);

  // Project handlers
  const addProject = (projectData: Omit<Project, 'id'>): Project => {
    const newProject: Project = {
      ...projectData,
      id: `proj-${Date.now()}`,
    };
    setProjects((prev) => [newProject, ...prev]);

    // Add a system notification
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      projectId: newProject.id,
      projectName: newProject.name,
      title: 'New Solar EPC Project Created',
      message: `${newProject.name} (${newProject.capacityDisplay}) has been initialized by ${currentUser.name}.`,
      type: 'info',
      timestamp: new Date().toISOString(),
      isRead: false,
      linkTab: 'projects',
      linkId: newProject.id,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    return newProject;
  };

  const updateProject = (updated: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setShortages((prev) => prev.filter((s) => s.projectId !== id));
  };

  // Shortage handlers
  const addShortage = (
    data: Omit<MaterialShortage, 'id' | 'dateReported' | 'estimateHistory'>
  ): MaterialShortage => {
    const targetProject = projects.find((p) => p.id === data.projectId);
    const delayCalc = calculateShortageDelay(
      data.expectedDeliveryDays,
      data.remainingInstallationDays,
      data.scheduleBufferDays,
      targetProject?.plannedCompletionDate
    );

    const newShortage: MaterialShortage = {
      ...data,
      id: `short-${Date.now()}`,
      dateReported: new Date().toISOString(),
      estimateHistory: [
        {
          id: `hist-${Date.now()}`,
          previousDays: 0,
          newDays: data.expectedDeliveryDays,
          changedAt: new Date().toISOString(),
          changedBy: `${currentUser.name} (${currentUser.role})`,
          reason: 'Initial shortage report on site',
        },
      ],
    };

    setShortages((prev) => [newShortage, ...prev]);

    // Create automatic alert notification
    const notifType = delayCalc.estimatedDelayDays > 5 ? 'critical' : delayCalc.estimatedDelayDays > 0 ? 'warning' : 'info';
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      projectId: data.projectId,
      projectName: targetProject?.name || 'Solar Project',
      materialName: data.materialName,
      title: `Material Shortage Reported: ${data.materialName}`,
      message: `Shortage of ${data.quantityRequired - data.quantityAvailable} ${data.unit} logged. Expected delivery ${data.expectedDeliveryDays}d yields ${delayCalc.estimatedDelayDays}d estimated project delay.`,
      type: notifType,
      newEstimate: data.expectedDeliveryDays,
      estimatedDelay: delayCalc.estimatedDelayDays,
      timestamp: new Date().toISOString(),
      isRead: false,
      linkTab: 'shortages',
      linkId: newShortage.id,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    return newShortage;
  };

  const updateShortageDeliveryEstimate = (shortageId: string, newDays: number, reason?: string) => {
    setShortages((prev) => {
      return prev.map((shortage) => {
        if (shortage.id !== shortageId) return shortage;

        const previousDays = shortage.expectedDeliveryDays;
        if (previousDays === newDays) return shortage;

        const targetProject = projects.find((p) => p.id === shortage.projectId);
        const newDelayCalc = calculateShortageDelay(
          newDays,
          shortage.remainingInstallationDays,
          shortage.scheduleBufferDays,
          targetProject?.plannedCompletionDate
        );

        const historyEntry = {
          id: `hist-${Date.now()}`,
          previousDays,
          newDays,
          changedAt: new Date().toISOString(),
          changedBy: `${currentUser.name} (${currentUser.role})`,
          reason: reason || 'Delivery ETA updated in schedule coordination',
        };

        // Create alert notification
        const isIncreased = newDays > previousDays;
        const notif: NotificationItem = {
          id: `notif-${Date.now()}`,
          projectId: shortage.projectId,
          projectName: targetProject?.name || 'Project',
          materialName: shortage.materialName,
          title: isIncreased
            ? `Delivery ETA Pushed Back: ${shortage.materialName}`
            : `Delivery ETA Improved: ${shortage.materialName}`,
          message: `Delivery time changed from ${previousDays}d to ${newDays}d. New calculated delay is ${newDelayCalc.estimatedDelayDays} days.`,
          type: newDelayCalc.estimatedDelayDays > 5 ? 'critical' : isIncreased ? 'warning' : 'info',
          previousEstimate: previousDays,
          newEstimate: newDays,
          estimatedDelay: newDelayCalc.estimatedDelayDays,
          timestamp: new Date().toISOString(),
          isRead: false,
          linkTab: 'shortages',
          linkId: shortage.id,
        };
        setNotifications((nPrev) => [notif, ...nPrev]);

        return {
          ...shortage,
          expectedDeliveryDays: newDays,
          estimateHistory: [historyEntry, ...shortage.estimateHistory],
        };
      });
    });
  };

  const updateShortageStatus = (shortageId: string, newStatus: ShortageStatus, notes?: string) => {
    setShortages((prev) => {
      return prev.map((s) => {
        if (s.id !== shortageId) return s;
        const targetProject = projects.find((p) => p.id === s.projectId);

        const updated = {
          ...s,
          status: newStatus,
          notes: notes ? `${s.notes ? s.notes + ' | ' : ''}${notes}` : s.notes,
          resolvedAt: newStatus === 'resolved' ? new Date().toISOString() : s.resolvedAt,
        };

        if (newStatus === 'resolved' || newStatus === 'received') {
          const notif: NotificationItem = {
            id: `notif-${Date.now()}`,
            projectId: s.projectId,
            projectName: targetProject?.name,
            materialName: s.materialName,
            title: newStatus === 'resolved' ? 'Material Shortage Resolved' : 'Material Received On-Site',
            message: `${s.materialName} status marked as "${newStatus.replace('_', ' ')}". Delay risk cleared.`,
            type: 'success',
            timestamp: new Date().toISOString(),
            isRead: false,
            linkTab: 'shortages',
            linkId: s.id,
          };
          setNotifications((nPrev) => [notif, ...nPrev]);
        }

        return updated;
      });
    });
  };

  const markMaterialReceived = (shortageId: string, quantityReceived: number) => {
    setShortages((prev) => {
      return prev.map((s) => {
        if (s.id !== shortageId) return s;
        const newAvailable = Math.min(s.quantityRequired, s.quantityAvailable + quantityReceived);
        const isFullySatisfied = newAvailable >= s.quantityRequired;
        const newStatus: ShortageStatus = isFullySatisfied ? 'resolved' : 'received';

        const targetProject = projects.find((p) => p.id === s.projectId);
        const notif: NotificationItem = {
          id: `notif-${Date.now()}`,
          projectId: s.projectId,
          projectName: targetProject?.name,
          materialName: s.materialName,
          title: isFullySatisfied ? 'Shortage Fully Cleared' : 'Partial Delivery Received',
          message: `Received ${quantityReceived} ${s.unit} of ${s.materialName}. (Available: ${newAvailable}/${s.quantityRequired})`,
          type: isFullySatisfied ? 'success' : 'info',
          timestamp: new Date().toISOString(),
          isRead: false,
          linkTab: 'shortages',
          linkId: s.id,
        };
        setNotifications((nPrev) => [notif, ...nPrev]);

        return {
          ...s,
          quantityAvailable: newAvailable,
          status: newStatus,
          resolvedAt: isFullySatisfied ? new Date().toISOString() : s.resolvedAt,
        };
      });
    });
  };

  const deleteShortage = (shortageId: string) => {
    setShortages((prev) => prev.filter((s) => s.id !== shortageId));
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Historical projects
  const addHistoricalProject = (data: Omit<HistoricalProject, 'id' | 'totalDays'>): HistoricalProject => {
    const totalDays = calculateDaysBetween(data.startDate, data.completionDate);
    const newProj: HistoricalProject = {
      ...data,
      id: `hist-proj-${Date.now()}`,
      totalDays,
    };
    setHistoricalProjects((prev) => [newProj, ...prev]);
    return newProj;
  };

  const updateHistoricalProject = (data: HistoricalProject) => {
    const totalDays = calculateDaysBetween(data.startDate, data.completionDate);
    setHistoricalProjects((prev) =>
      prev.map((p) => (p.id === data.id ? { ...data, totalDays } : p))
    );
  };

  const deleteHistoricalProject = (id: string) => {
    setHistoricalProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const resetToDemoData = () => {
    localStorage.removeItem(STORAGE_KEYS.PROJECTS);
    localStorage.removeItem(STORAGE_KEYS.SHORTAGES);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.HISTORICAL);
    setProjects(INITIAL_PROJECTS);
    setShortages(INITIAL_SHORTAGES);
    setNotifications(INITIAL_NOTIFICATIONS);
    setHistoricalProjects(INITIAL_HISTORICAL_PROJECTS);
  };

  return (
    <AppContext.Provider
      value={{
        projects,
        shortages,
        notifications,
        historicalProjects,
        currentUser,
        addProject,
        updateProject,
        deleteProject,
        addShortage,
        updateShortageDeliveryEstimate,
        updateShortageStatus,
        markMaterialReceived,
        deleteShortage,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotification,
        addHistoricalProject,
        updateHistoricalProject,
        deleteHistoricalProject,
        resetToDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
