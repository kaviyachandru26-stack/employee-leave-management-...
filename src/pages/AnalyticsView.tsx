import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Download,
  Calendar,
  Building,
  Users,
  PieChart,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';
import { analyticsApi } from '../services/api.js';

export const AnalyticsView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRange, setSelectedRange] = useState<string>('30d');

  useEffect(() => {
    analyticsApi
      .getDashboardSummary()
      .then((res) => setData(res.data))
      .catch(console.warn)
      .finally(() => setLoading(false));
  }, []);

  const departmentMetrics = [
    { name: 'Engineering', rate: 96, count: 48, leaveRate: 4 },
    { name: 'Product & Design', rate: 93, count: 24, leaveRate: 7 },
    { name: 'Human Resources', rate: 98, count: 12, leaveRate: 2 },
    { name: 'Sales & BD', rate: 89, count: 36, leaveRate: 11 },
    { name: 'Operations', rate: 95, count: 30, leaveRate: 5 },
  ];

  const leaveBreakdown = [
    { type: 'Casual Leave', days: 142, color: 'bg-indigo-500' },
    { type: 'Sick Leave', days: 88, color: 'bg-emerald-500' },
    { type: 'Annual Leave', days: 210, color: 'bg-amber-500' },
    { type: 'Parental Leave', days: 45, color: 'bg-purple-500' },
  ];

  const handleExport = (type: 'csv' | 'json') => {
    const jsonStr = JSON.stringify(departmentMetrics, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hrflow-analytics-${selectedRange}.${type}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Workforce Analytics & Reporting
          </h2>
          <p className="text-xs text-slate-500">
            Cross-departmental attendance patterns, leave consumption, and operational efficiency
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedRange}
            onChange={(e) => setSelectedRange(e.target.value)}
            className="bg-white border border-slate-200 text-xs rounded-lg px-3 py-2 outline-hidden text-slate-700 font-medium shadow-xs"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Year to Date</option>
          </select>

          <button
            onClick={() => handleExport('csv')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-2 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* 4 Sleek Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">
            Overall Attendance Rate
          </span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-bold text-slate-900">94.8%</span>
            <span className="text-emerald-500 text-xs font-bold">+1.2%</span>
          </div>
          <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 w-[94.8%]" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">
            Average Working Hours
          </span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-bold text-slate-900">8.2 hrs</span>
            <span className="text-slate-400 text-xs">/ day</span>
          </div>
          <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 w-[82%]" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">
            Leave Utilization
          </span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-bold text-slate-900">62.4%</span>
            <span className="text-slate-400 text-xs">of annual pool</span>
          </div>
          <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 w-[62.4%]" />
          </div>
        </div>

        <div className="bg-indigo-600 text-white p-5 rounded-2xl border border-indigo-700 shadow-xs">
          <span className="text-indigo-100 text-xs font-bold uppercase tracking-wider">
            Overtime Recorded
          </span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-bold">142.5 hrs</span>
          </div>
          <div className="mt-4 flex items-center space-x-2 text-[10px] text-indigo-100">
            <span>Engineering: 68h</span>
            <span>•</span>
            <span>Operations: 54h</span>
          </div>
        </div>
      </div>

      {/* Department Breakdown & Leave Pool */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Departmental Compliance</h3>
              <p className="text-xs text-slate-500">Attendance percentages and headcount comparison</p>
            </div>
          </div>

          <div className="space-y-4">
            {departmentMetrics.map((dept) => (
              <div key={dept.name} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>{dept.name} ({dept.count} members)</span>
                  <span className="text-indigo-600 font-bold">{dept.rate}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${dept.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Leave Category Pool</h3>
            <p className="text-xs text-slate-500 mb-6">Days consumed across leave classifications</p>

            <div className="space-y-4">
              {leaveBreakdown.map((item) => (
                <div key={item.type} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5">
                    <span className={`w-3 h-3 rounded-md ${item.color}`} />
                    <span className="text-slate-700 font-medium">{item.type}</span>
                  </div>
                  <span className="font-bold text-slate-900">{item.days} days</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
            Total leave days claimed this period: <span className="font-bold text-slate-900">485 days</span>
          </div>
        </div>
      </div>
    </div>
  );
};
