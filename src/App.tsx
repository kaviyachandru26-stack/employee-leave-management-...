/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Sidebar, NavView } from './components/layout/Sidebar.js';
import { TopHeader } from './components/layout/TopHeader.js';
import { LoginView } from './pages/LoginView.js';
import { DashboardView } from './pages/DashboardView.js';
import { LeaveManagementView } from './pages/LeaveManagementView.js';
import { AttendanceView } from './pages/AttendanceView.js';
import { EmployeesView } from './pages/EmployeesView.js';
import { DepartmentsView } from './pages/DepartmentsView.js';
import { HolidaysView } from './pages/HolidaysView.js';
import { AnalyticsView } from './pages/AnalyticsView.js';
import { AuditLogsView } from './pages/AuditLogsView.js';
import { SettingsView } from './pages/SettingsView.js';
import { attendanceApi } from './services/api.js';
import { Attendance } from './types.js';

function MainLayout() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [manualModalOpen, setManualModalOpen] = useState<boolean>(false);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchTodayAttendance = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await attendanceApi.getTodayStatus();
      setTodayAttendance(res.data);
    } catch (err) {
      console.warn('Today attendance fetch failed:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTodayAttendance();
    }
  }, [isAuthenticated, user]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-400">Loading HRFlow Environment...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (q && currentView !== 'employees') {
      setCurrentView('employees');
    }
  };

  const getHeaderTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Overview Dashboard';
      case 'leave':
        return 'Leave Management';
      case 'attendance':
        return 'Attendance Tracking';
      case 'employees':
        return 'Employee Directory';
      case 'departments':
        return 'Departments';
      case 'holidays':
        return 'Company Holidays';
      case 'analytics':
        return 'Analytics & Reports';
      case 'audit-logs':
        return 'Security Audit Trail';
      case 'settings':
        return 'System Configuration';
      default:
        return 'HRFlow';
    }
  };

  return (
    <div className="h-screen w-full flex bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sleek Dark Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={(v) => {
          setCurrentView(v);
          setSearchQuery('');
        }}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main App Container */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <TopHeader
          title={getHeaderTitle()}
          onToggleMobileMenu={() => setMobileOpen(!mobileOpen)}
          todayAttendance={todayAttendance}
          onRefreshAttendance={fetchTodayAttendance}
          onOpenManualAttendance={() => {
            setCurrentView('attendance');
            setManualModalOpen(true);
          }}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
        />

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto">
          {currentView === 'dashboard' && (
            <DashboardView
              onNavigate={(v) => setCurrentView(v)}
              onOpenManualAttendance={() => {
                setCurrentView('attendance');
                setManualModalOpen(true);
              }}
            />
          )}
          {currentView === 'leave' && <LeaveManagementView />}
          {currentView === 'attendance' && (
            <AttendanceView
              manualModalOpen={manualModalOpen}
              setManualModalOpen={setManualModalOpen}
              onRefreshAttendance={fetchTodayAttendance}
              todayAttendance={todayAttendance}
            />
          )}
          {currentView === 'employees' && <EmployeesView searchQuery={searchQuery} />}
          {currentView === 'departments' && <DepartmentsView />}
          {currentView === 'holidays' && <HolidaysView />}
          {currentView === 'analytics' && <AnalyticsView />}
          {currentView === 'audit-logs' && <AuditLogsView />}
          {currentView === 'settings' && <SettingsView />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
