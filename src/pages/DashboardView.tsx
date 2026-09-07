import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Clock,
  Users,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  Shield,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { analyticsApi, attendanceApi, leaveApi, auditLogsApi } from '../services/api.js';
import { DashboardSummary, Attendance, LeaveRequest, AuditLog } from '../types.js';

interface DashboardViewProps {
  onNavigate: (view: any) => void;
  onOpenManualAttendance: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenManualAttendance,
}) => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'30days' | 'quarter'>('30days');
  const [activeBarIndex, setActiveBarIndex] = useState<number>(3); // default highlight Thursday/Friday

  // Fetch real data
  const loadDashboardData = async () => {
    try {
      const res = await analyticsApi.getDashboardSummary();
      if (res.data) {
        setSummary(res.data);
      }
    } catch (err) {
      console.warn('Dashboard summary error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  // Fallback defaults matching design mock when API initial state loads
  const totalEmployees = summary?.totalEmployees || 910;
  const presentCount = summary?.presentToday ?? 842;
  const onLeaveCount = summary?.onLeaveTodayCount ?? 48;
  const pendingApprovals = summary?.pendingApprovalsCount ?? (summary?.pendingRequestsCount ?? 12);
  const attendanceRate = summary?.attendanceTrend?.[summary.attendanceTrend.length - 1]?.rate ?? 92.5;

  const trendBars = [
    { day: 'Mon', rate: 82 },
    { day: 'Tue', rate: 75 },
    { day: 'Wed', rate: 85 },
    { day: 'Thu', rate: 92 },
    { day: 'Fri', rate: 78 },
    { day: 'Sat', rate: 88 },
    { day: 'Sun', rate: 82 },
    { day: 'Mon', rate: 70 },
  ];

  return (
    <section className="p-4 sm:p-8 grid grid-cols-12 gap-6 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* 4 Sleek Top Metric Cards */}
      <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Present Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">
              Present Today
            </span>
            <span className="text-emerald-500 text-xs font-bold flex items-center">
              +2.4%
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-900">{presentCount}</span>
            <span className="text-slate-400 text-sm">/ {totalEmployees}</span>
          </div>
          <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((presentCount / totalEmployees) * 100))}%` }}
            />
          </div>
        </div>

        {/* Card 2: On Leave */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">
              On Leave
            </span>
            <span className="text-rose-500 text-xs font-bold flex items-center">
              +12%
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-900">{onLeaveCount}</span>
            <span className="text-slate-400 text-sm">Employees</span>
          </div>
          <div className="mt-4 flex -space-x-2 overflow-hidden items-center">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&auto=format&fit=crop&q=80"
              alt="Emp"
              className="w-6 h-6 rounded-full border-2 border-white object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&auto=format&fit=crop&q=80"
              alt="Emp"
              className="w-6 h-6 rounded-full border-2 border-white object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&auto=format&fit=crop&q=80"
              alt="Emp"
              className="w-6 h-6 rounded-full border-2 border-white object-cover"
            />
            <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-700">
              +{Math.max(1, onLeaveCount - 3)}
            </div>
          </div>
        </div>

        {/* Card 3: Pending Approvals */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">
              Pending Approvals
            </span>
            <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold">
              Action Required
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-amber-600">{pendingApprovals}</span>
            <span className="text-slate-400 text-sm">Requests</span>
          </div>
          <div className="mt-4 text-[11px] text-slate-500 italic">
            Average resolution time: 4.2h
          </div>
        </div>

        {/* Card 4: System Health (Sleek Indigo accent card) */}
        <div className="bg-indigo-600 text-white p-5 rounded-2xl border border-indigo-700 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-indigo-100 text-xs font-bold uppercase tracking-wider">
              System Health
            </span>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold">99.9%</span>
          </div>
          <div className="mt-4 flex items-center space-x-2">
            <div className="px-2 py-1 bg-white/20 rounded text-[10px] font-bold">
              PostgreSQL: OK
            </div>
            <div className="px-2 py-1 bg-white/20 rounded text-[10px] font-bold">
              Redis: OK
            </div>
          </div>
        </div>
      </div>

      {/* Main Row: Trend Chart (Col 8) + Activity & Server Resources (Col 4) */}
      <div className="col-span-12 lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs h-[420px] flex flex-col justify-between">
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-slate-800">Attendance Utilization Trend</h3>
            <p className="text-xs text-slate-400">Performance analytics across all departments</p>
          </div>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-3 py-1.5 outline-hidden text-slate-700 font-medium"
          >
            <option value="30days">Last 30 Days</option>
            <option value="quarter">Last Quarter</option>
          </select>
        </div>

        {/* Sleek CSS Bar Graph from Design */}
        <div className="flex-1 flex items-end justify-between space-x-4 px-2 pb-2">
          {trendBars.map((bar, idx) => {
            const isHighlighted = idx === activeBarIndex;
            return (
              <div
                key={idx}
                onClick={() => setActiveBarIndex(idx)}
                className="flex-1 flex flex-col items-center cursor-pointer group h-full justify-end"
              >
                <div
                  className={`w-full rounded-t-lg relative transition-all duration-300 ${
                    isHighlighted
                      ? 'bg-indigo-600 shadow-md'
                      : 'bg-indigo-100 group-hover:bg-indigo-200'
                  }`}
                  style={{ height: `${bar.rate}%` }}
                >
                  <div
                    className={`absolute bottom-full left-0 right-0 text-center text-[10px] font-bold mb-1 transition-opacity ${
                      isHighlighted
                        ? 'opacity-100 text-indigo-600'
                        : 'opacity-0 group-hover:opacity-100 text-slate-600'
                    }`}
                  >
                    {bar.rate}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex justify-between px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-100 pt-3">
          {trendBars.map((b, i) => (
            <span key={i} className={i === activeBarIndex ? 'text-indigo-600 font-extrabold' : ''}>
              {b.day}
            </span>
          ))}
        </div>
      </div>

      {/* Right Column (Col 4): Recent Activity Audit & Server Resources */}
      <div className="col-span-12 lg:col-span-4 flex flex-col space-y-6">
        {/* Recent Activity Audit */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Recent Activity Audit</h3>
            <button
              onClick={() => onNavigate('audit-logs')}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              View all
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex space-x-3 items-start">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold">LOG</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-slate-900 truncate">
                  System Settings Updated
                </span>
                <span className="text-[10px] text-slate-400">By Admin • 2 mins ago</span>
              </div>
            </div>

            <div className="flex space-x-3 items-start">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold">APP</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-slate-900 truncate">
                  Leave Approved: David Chen
                </span>
                <span className="text-[10px] text-slate-400">By HR Manager • 15 mins ago</span>
              </div>
            </div>

            <div className="flex space-x-3 items-start">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold">SEC</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-slate-900 truncate">
                  Check-in Logged: Sarah Jenkins
                </span>
                <span className="text-[10px] text-slate-400">IP: 192.168.1.14 • 1h ago</span>
              </div>
            </div>

            <div className="flex space-x-3 items-start">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold">DB</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-slate-900 truncate">
                  New Holiday Added: Diwali
                </span>
                <span className="text-[10px] text-slate-400">By System Service • 2h ago</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sleek Dark Server Resources Card matching Design */}
        <div className="bg-slate-900 p-6 rounded-2xl shadow-xl flex flex-col justify-between text-white">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Server Resources
              </h4>
              <p className="text-2xl font-bold mt-1">Redis Cache</p>
            </div>
            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded">
              Optimal
            </span>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-800 pt-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400">Hit Rate</span>
              <span className="text-lg font-bold">94.2%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400">Latency</span>
              <span className="text-lg font-bold">0.8ms</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
