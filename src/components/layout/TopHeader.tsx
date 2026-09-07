import React, { useState, useEffect } from 'react';
import {
  Menu,
  Bell,
  Clock,
  Search,
  Check,
  AlertCircle,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { notificationsApi, attendanceApi } from '../../services/api.js';
import { Notification, Attendance } from '../../types.js';

interface TopHeaderProps {
  title: string;
  onToggleMobileMenu: () => void;
  todayAttendance: Attendance | null;
  onRefreshAttendance: () => void;
  onOpenManualAttendance?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  title,
  onToggleMobileMenu,
  todayAttendance,
  onRefreshAttendance,
  onOpenManualAttendance,
  searchQuery = '',
  onSearchChange,
}) => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [punchLoading, setPunchLoading] = useState<boolean>(false);
  const [punchError, setPunchError] = useState<string | null>(null);

  // Live digital clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }) +
          ' • ' +
          now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch notifications
  const loadNotifications = async () => {
    try {
      const res = await notificationsApi.list();
      if (res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (e) {
      console.warn('Failed to load notifications:', e);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      loadNotifications();
    } catch (e) {
      console.warn('Mark read failed', e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      loadNotifications();
    } catch (e) {
      console.warn('Mark all read failed', e);
    }
  };

  const handleQuickPunch = async () => {
    setPunchLoading(true);
    setPunchError(null);
    try {
      if (!todayAttendance || !todayAttendance.checkIn) {
        await attendanceApi.checkIn('Quick punch from header');
      } else if (!todayAttendance.checkOut) {
        await attendanceApi.checkOut('Quick punch checkout from header');
      }
      onRefreshAttendance();
    } catch (err: any) {
      setPunchError(err.response?.data?.message || 'Punch action failed');
      setTimeout(() => setPunchError(null), 4000);
    } finally {
      setPunchLoading(false);
    }
  };

  const isCheckedIn = Boolean(todayAttendance?.checkIn);
  const isCheckedOut = Boolean(todayAttendance?.checkOut);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0 z-30">
      <div className="flex items-center space-x-3 sm:space-x-6">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Sleek Search Pill matching design */}
        <div className="flex items-center bg-slate-100 rounded-full px-4 py-1.5 w-60 sm:w-80">
          <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search employee, ID, or department..."
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-700 placeholder:text-slate-400 focus:outline-hidden"
          />
        </div>

        <span className="hidden xl:inline text-xs text-slate-400 font-medium">
          {currentTime}
        </span>
      </div>

      <div className="flex items-center space-x-4 sm:space-x-6">
        {/* Notification Bell with red indicator badge */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-slate-800 transition-colors rounded-lg hover:bg-slate-100"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-xs text-slate-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.read && handleMarkRead(n.id)}
                      className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                        !n.read ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1" />}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1.5">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                        {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Button: Manual Attendance Check-in or Punch In/Out */}
        {onOpenManualAttendance ? (
          <button
            onClick={onOpenManualAttendance}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-2 shadow-xs"
          >
            <span>Manual Attendance Check-in</span>
          </button>
        ) : user?.employee ? (
          <div className="relative">
            {!isCheckedIn ? (
              <button
                onClick={handleQuickPunch}
                disabled={punchLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-2 shadow-xs disabled:opacity-50"
              >
                <Clock className="w-4 h-4" />
                <span>{punchLoading ? 'Checking In...' : 'Attendance Check-in'}</span>
              </button>
            ) : !isCheckedOut ? (
              <button
                onClick={handleQuickPunch}
                disabled={punchLoading}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-2 shadow-xs disabled:opacity-50"
              >
                <Clock className="w-4 h-4" />
                <span>{punchLoading ? 'Checking Out...' : 'Check-out'}</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <Check className="w-3.5 h-3.5" />
                <span>Day Completed</span>
              </div>
            )}

            {punchError && (
              <div className="absolute right-0 top-12 w-64 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 shadow-lg z-50 flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{punchError}</span>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </header>
  );
};
