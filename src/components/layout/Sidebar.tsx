import React from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  Clock,
  CalendarDays,
  Users,
  Building2,
  BarChart3,
  ShieldCheck,
  Settings,
  Sparkles,
  ChevronRight,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { UserRole } from '../../types.js';

export type NavView =
  | 'dashboard'
  | 'leave'
  | 'attendance'
  | 'holidays'
  | 'employees'
  | 'departments'
  | 'analytics'
  | 'audit-logs'
  | 'settings';

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  pendingApprovalsCount?: number;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  pendingApprovalsCount = 0,
  mobileOpen,
  setMobileOpen,
}) => {
  const { user, logout, switchRole } = useAuth();

  const navItems: Array<{
    id: NavView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    roles?: UserRole[];
    badge?: number;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'leave',
      label: 'Leave Management',
      icon: CalendarCheck,
      badge: (user?.role === 'MANAGER' || user?.role === 'HR' || user?.role === 'ADMIN') ? pendingApprovalsCount : undefined,
    },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'holidays', label: 'Company Holidays', icon: CalendarDays },
    { id: 'employees', label: 'Employee Directory', icon: Users },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3, roles: ['MANAGER', 'HR', 'ADMIN'] },
    { id: 'audit-logs', label: 'Security & Audit Logs', icon: ShieldCheck, roles: ['HR', 'ADMIN'] },
    { id: 'settings', label: 'Policies & Settings', icon: Settings },
  ];

  const allowedNav = navItems.filter((item) => !item.roles || (user && item.roles.includes(user.role)));

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col shrink-0 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 flex items-center space-x-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-xs">
            <div className="w-4 h-4 border-2 border-white rounded-xs flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-xs"></div>
            </div>
          </div>
          <div>
            <span className="text-white font-bold text-xl tracking-tight">HRFlow</span>
          </div>
        </div>

        {/* Quick Role Switcher Persona Banner */}
        <div className="px-4 py-2.5 bg-slate-800/60 border-b border-slate-800">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-medium">
            <span className="flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-indigo-400" /> Switch Role:
            </span>
            <span className="text-[10px] text-indigo-400 font-semibold px-1.5 py-0.5 bg-indigo-950/80 rounded border border-indigo-500/30">
              {user?.role}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {(['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => switchRole(r)}
                className={`text-[10px] py-1 rounded font-semibold transition-all ${
                  user?.role === r
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {r === 'EMPLOYEE' ? 'Emp' : r === 'MANAGER' ? 'Mgr' : r}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-3 space-y-1 overflow-y-auto">
          {allowedNav.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectView(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-auto bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Card & Logout Footer */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0">
              <img
                src={user?.employee?.avatarUrl || 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80'}
                alt="Profile"
                className="w-8 h-8 rounded-full bg-slate-700 object-cover shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-white truncate">
                  {user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user?.email}
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold truncate">
                  {user?.employee?.position || (user?.role === 'ADMIN' ? 'HR Administrator' : user?.role)}
                </span>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
