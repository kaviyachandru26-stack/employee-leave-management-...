import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Clock,
  Database,
  Save,
  CheckCircle2,
  RefreshCw,
  Server,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [saved, setSaved] = useState<boolean>(false);
  const [companyName, setCompanyName] = useState<string>('HRFlow Enterprise Inc.');
  const [workStart, setWorkStart] = useState<string>('09:00');
  const [workEnd, setWorkEnd] = useState<string>('17:30');
  const [gracePeriod, setGracePeriod] = useState<number>(15);
  const [halfDayThreshold, setHalfDayThreshold] = useState<number>(4.5);
  const [managerApprovalRequired, setManagerApprovalRequired] = useState<boolean>(true);
  const [autoApproveSingleDay, setAutoApproveSingleDay] = useState<boolean>(false);
  const [cacheFlushed, setCacheFlushed] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleFlushCache = () => {
    setCacheFlushed(true);
    setTimeout(() => setCacheFlushed(false), 3000);
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Organization & Policy Settings</h2>
          <p className="text-xs text-slate-500">
            Configure working hours, automated leave policies, attendance grace parameters, and telemetry
          </p>
        </div>

        {saved && (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings saved successfully</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Settings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">General Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Organization Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-hidden text-slate-800 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Corporate Timezone
              </label>
              <select className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-hidden text-slate-800 font-medium">
                <option>America/New_York (UTC-05:00)</option>
                <option>America/Los_Angeles (UTC-08:00)</option>
                <option>Europe/London (UTC+00:00)</option>
                <option>Asia/Tokyo (UTC+09:00)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Working Hours & Shift Rules */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Shift & Attendance Rules</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Shift Start Time
              </label>
              <input
                type="time"
                value={workStart}
                onChange={(e) => setWorkStart(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-hidden text-slate-800 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Shift End Time
              </label>
              <input
                type="time"
                value={workEnd}
                onChange={(e) => setWorkEnd(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-hidden text-slate-800 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Arrival Grace Window (Minutes)
              </label>
              <input
                type="number"
                value={gracePeriod}
                onChange={(e) => setGracePeriod(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-hidden text-slate-800 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Half-Day Threshold (Hours)
              </label>
              <input
                type="number"
                step="0.5"
                value={halfDayThreshold}
                onChange={(e) => setHalfDayThreshold(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-hidden text-slate-800 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Workflow & Approval Automation */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Leave Approval Workflow</h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={managerApprovalRequired}
                onChange={(e) => setManagerApprovalRequired(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-800 block">Direct Manager Approval Required</span>
                <span className="text-slate-500">Require supervisor sign-off before routing to HR department</span>
              </div>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoApproveSingleDay}
                onChange={(e) => setAutoApproveSingleDay(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-800 block">Auto-Approve 1-Day Casual Leave</span>
                <span className="text-slate-500">Automatically grant requests of ≤ 1 working day if balance is sufficient</span>
              </div>
            </label>
          </div>
        </div>

        {/* Server & Infrastructure Telemetry */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Server className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold">Infrastructure Maintenance</h3>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold">
              All Systems Nominal
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Database</span>
              <p className="text-sm font-bold text-white mt-1">PostgreSQL 15 (Active)</p>
              <p className="text-[11px] text-slate-400">Connection pool: 10/20</p>
            </div>
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Cache Store</span>
              <p className="text-sm font-bold text-white mt-1">Redis 7 (In-Memory)</p>
              <p className="text-[11px] text-slate-400">94.2% Hit Rate • 0.8ms</p>
            </div>
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Audit Engine</span>
              <p className="text-sm font-bold text-white mt-1">Encrypted Audit Trail</p>
              <p className="text-[11px] text-slate-400">Real-time sync enabled</p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handleFlushCache}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{cacheFlushed ? 'Cache Flushed!' : 'Flush Redis Cache'}</span>
            </button>
            <span className="text-xs text-slate-400">HRFlow Core v1.0.4</span>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center space-x-2 shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
