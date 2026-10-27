'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { DashboardView } from '@/components/DashboardView';
import { ProjectsView } from '@/components/ProjectsView';
import { ProjectDetailView } from '@/components/ProjectDetailView';
import { ShortagesView } from '@/components/ShortagesView';
import { ShortageDetailModal } from '@/components/ShortageDetailModal';
import { ReportShortageModal } from '@/components/ReportShortageModal';
import { HistoricalPerformanceView } from '@/components/HistoricalPerformanceView';
import { NotificationsView } from '@/components/NotificationsView';
import { SettingsView } from '@/components/SettingsView';

export default function SolarReadyApp() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [globalSearch, setGlobalSearch] = useState<string>('');

  // Navigation targets
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedShortageId, setSelectedShortageId] = useState<string | null>(null);

  // Modal triggers
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [reportModalProjectId, setReportModalProjectId] = useState<string | undefined>(undefined);

  // Handlers
  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentTab('project-detail');
  };

  const handleSelectShortage = (shortageId: string) => {
    setSelectedShortageId(shortageId);
  };

  const handleOpenReportModal = (projectId?: string) => {
    setReportModalProjectId(projectId);
    setIsReportModalOpen(true);
  };

  const handleNavigateNotifications = () => {
    setCurrentTab('notifications');
  };

  const handleNotificationLink = (tab: string, id?: string) => {
    if (tab === 'projects' && id) {
      handleSelectProject(id);
    } else if (tab === 'shortages' && id) {
      handleSelectShortage(id);
    } else {
      setCurrentTab(tab);
    }
  };

  // Compute Page Title
  let pageTitle = 'Dashboard';
  let pageSubtitle = 'Solar EPC portfolio readiness and delay prevention';

  if (currentTab === 'projects') {
    pageTitle = 'Projects';
    pageSubtitle = 'Active installations and planned target milestones';
  } else if (currentTab === 'project-detail') {
    pageTitle = 'Project Details';
    pageSubtitle = 'Readiness diagnostics, bill of materials, and schedule forecast';
  } else if (currentTab === 'shortages') {
    pageTitle = 'Material Shortages';
    pageSubtitle = 'Open inventory shortages and supplier delivery tracking';
  } else if (currentTab === 'historical') {
    pageTitle = 'Historical Performance';
    pageSubtitle = 'Benchmarking completed projects and duration trends';
  } else if (currentTab === 'notifications') {
    pageTitle = 'Notifications';
    pageSubtitle = 'Alerts feed for schedule risks and delivery confirmations';
  } else if (currentTab === 'settings') {
    pageTitle = 'Settings';
    pageSubtitle = 'Prototype preferences and data management';
  }

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-800 antialiased flex flex-col">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab === 'project-detail' ? 'projects' : currentTab}
        setCurrentTab={(tab) => {
          setSelectedProjectId(null);
          setCurrentTab(tab);
        }}
        isOpenMobile={isMobileMenuOpen}
        setIsOpenMobile={setIsMobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex-1 flex flex-col min-h-screen">
        <Header
          title={pageTitle}
          subtitle={pageSubtitle}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onNavigateNotifications={handleNavigateNotifications}
          onReportShortageClick={() => handleOpenReportModal()}
          searchQuery={globalSearch}
          setSearchQuery={setGlobalSearch}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              onSelectProject={handleSelectProject}
              onSelectShortage={handleSelectShortage}
              onOpenReportModal={() => handleOpenReportModal()}
            />
          )}

          {currentTab === 'projects' && (
            <ProjectsView
              onSelectProject={handleSelectProject}
              onOpenReportModalWithProject={handleOpenReportModal}
            />
          )}

          {currentTab === 'project-detail' && selectedProjectId && (
            <ProjectDetailView
              projectId={selectedProjectId}
              onBack={() => {
                setSelectedProjectId(null);
                setCurrentTab('projects');
              }}
              onOpenReportModalWithProject={handleOpenReportModal}
              onSelectShortage={handleSelectShortage}
            />
          )}

          {currentTab === 'shortages' && (
            <ShortagesView
              onSelectShortage={handleSelectShortage}
              onOpenReportModal={() => handleOpenReportModal()}
            />
          )}

          {currentTab === 'historical' && <HistoricalPerformanceView />}

          {currentTab === 'notifications' && (
            <NotificationsView onNavigateTab={handleNotificationLink} />
          )}

          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Shortage Detail & ETA Update Modal */}
      <ShortageDetailModal
        shortageId={selectedShortageId}
        onClose={() => setSelectedShortageId(null)}
        onOpenProjectDetail={handleSelectProject}
      />

      {/* Report Shortage Modal */}
      <ReportShortageModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        defaultProjectId={reportModalProjectId}
      />
    </div>
  );
}
