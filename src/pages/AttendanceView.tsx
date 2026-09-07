import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Plus,
  Play,
  Square,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { attendanceApi, employeesApi } from '../services/api.js';
import { Attendance, AttendanceStatus } from '../types.js';
import { Modal } from '../components/common/Modal.js';
import { Badge } from '../components/common/Badge.js';

interface AttendanceViewProps {
  manualModalOpen: boolean;
  setManualModalOpen: (open: boolean) => void;
  onRefreshAttendance: () => void;
  todayAttendance: Attendance | null;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  manualModalOpen,
  setManualModalOpen,
  onRefreshAttendance,
  todayAttendance,
}) => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [punchLoading, setPunchLoading] = useState<boolean>(false);
  const [punchNote, setPunchNote] = useState<string>('');

  // Manual Check-in Form
  const [employees, setEmployees] = useState<any[]>([]);
  const [manualEmployeeId, setManualEmployeeId] = useState<string>('');
  const [manualDate, setManualDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [manualCheckIn, setManualCheckIn] = useState<string>('09:00');
  const [manualCheckOut, setManualCheckOut] = useState<string>('17:30');
  const [manualStatus, setManualStatus] = useState<AttendanceStatus>('PRESENT');
  const [manualNotes, setManualNotes] = useState<string>('Manual check-in override');
  const [manualSubmitting, setManualSubmitting] = useState<boolean>(false);
  const [manualError, setManualError] = useState<string | null>(null);

  const loadAttendance = async () => {
    try {
      const res = await attendanceApi.list();
      setLogs(res.data || []);
      if (user?.role === 'HR' || user?.role === 'ADMIN' || user?.role === 'MANAGER') {
        const empRes = await employeesApi.list();
        setEmployees(empRes.data || []);
        if (empRes.data?.[0]) setManualEmployeeId(empRes.data[0].id);
      }
    } catch (err) {
      console.warn('Attendance load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [user]);

  const handlePunch = async (action: 'in' | 'out') => {
    setPunchLoading(true);
    try {
      if (action === 'in') {
        await attendanceApi.checkIn(punchNote || 'Standard punch in');
      } else {
        await attendanceApi.checkOut(punchNote || 'Standard punch out');
      }
      setPunchNote('');
      onRefreshAttendance();
      loadAttendance();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Punch operation failed');
    } finally {
      setPunchLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualSubmitting(true);
    setManualError(null);
    try {
      // Direct punch in/out with note or API call
      await attendanceApi.checkIn(
        `${manualNotes} (Check-in: ${manualCheckIn}, Check-out: ${manualCheckOut})`
      );
      setManualModalOpen(false);
      onRefreshAttendance();
      loadAttendance();
    } catch (err: any) {
      setManualError(err.response?.data?.message || 'Manual check-in failed');
    } finally {
      setManualSubmitting(false);
    }
  };

  const isCheckedIn = Boolean(todayAttendance?.checkIn);
  const isCheckedOut = Boolean(todayAttendance?.checkOut);

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Attendance & Timesheets</h2>
          <p className="text-xs text-slate-500">
            Real-time biometric & digital check-in records, working hours, and overrides
          </p>
        </div>
        <button
          onClick={() => setManualModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-2 shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Manual Attendance Check-in</span>
        </button>
      </div>

      {/* Hero Punch Card (Sleek 2-column or 3-column banner) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                Today's Punch Console
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Clock your arrival and departure times accurately to ensure automated timesheet compliance.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Punch In</span>
                <p className="text-lg font-bold text-slate-900 mt-0.5">
                  {todayAttendance?.checkIn
                    ? new Date(todayAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '--:--'}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Punch Out</span>
                <p className="text-lg font-bold text-slate-900 mt-0.5">
                  {todayAttendance?.checkOut
                    ? new Date(todayAttendance.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '--:--'}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Total Hours</span>
                <p className="text-lg font-bold text-indigo-600 mt-0.5">
                  {todayAttendance?.workingHours ? `${todayAttendance.workingHours.toFixed(1)} hrs` : '0.0 hrs'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-slate-100">
            <input
              type="text"
              placeholder="Optional notes (e.g., Working remotely / Client site)..."
              value={punchNote}
              onChange={(e) => setPunchNote(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-hidden text-slate-800"
            />
            {!isCheckedIn ? (
              <button
                onClick={() => handlePunch('in')}
                disabled={punchLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center space-x-2 shadow-xs disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{punchLoading ? 'Recording...' : 'Punch In Now'}</span>
              </button>
            ) : !isCheckedOut ? (
              <button
                onClick={() => handlePunch('out')}
                disabled={punchLoading}
                className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center space-x-2 shadow-xs disabled:opacity-50"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>{punchLoading ? 'Recording...' : 'Punch Out Now'}</span>
              </button>
            ) : (
              <div className="flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                <Check className="w-4 h-4" />
                <span>Today's Shift Finished</span>
              </div>
            )}
          </div>
        </div>

        {/* Shift Policy card */}
        <div className="bg-slate-900 p-6 rounded-2xl shadow-xl text-white flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Shift Policy
            </span>
            <p className="text-xl font-bold mt-1">General Office Shift</p>
            <p className="text-xs text-slate-400 mt-1">09:00 AM – 05:30 PM (8.5 hrs)</p>
          </div>
          <div className="space-y-2.5 border-t border-slate-800 pt-4 mt-4">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Grace period:</span>
              <span className="font-semibold text-slate-200">15 mins</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Half-day threshold:</span>
              <span className="font-semibold text-slate-200">4.5 hrs</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Overtime eligibility:</span>
              <span className="font-semibold text-emerald-400">Enabled (&gt;9 hrs)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Attendance Logs</h3>
            <p className="text-xs text-slate-500">Chronological employee punch records</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Employee</th>
                <th className="px-6 py-3.5">Check-In</th>
                <th className="px-6 py-3.5">Check-Out</th>
                <th className="px-6 py-3.5">Working Hours</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-xs">
                    No attendance logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const empName = log.employee
                    ? `${log.employee.firstName} ${log.employee.lastName}`
                    : 'Employee';
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">{log.date}</td>
                      <td className="px-6 py-4 flex items-center space-x-2">
                        <img
                          src={log.employee?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&auto=format&fit=crop&q=80'}
                          alt={empName}
                          className="w-6 h-6 rounded-full object-cover shrink-0"
                        />
                        <span className="font-medium text-slate-800">{empName}</span>
                      </td>
                      <td className="px-6 py-4">
                        {log.checkIn
                          ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </td>
                      <td className="px-6 py-4">
                        {log.checkOut
                          ? new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {log.workingHours ? `${log.workingHours.toFixed(1)}h` : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            log.status === 'PRESENT'
                              ? 'success'
                              : log.status === 'LATE'
                              ? 'warning'
                              : log.status === 'ON_LEAVE'
                              ? 'info'
                              : 'danger'
                          }
                        >
                          {log.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-slate-400 max-w-xs truncate">
                        {log.notes || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Check-in Modal */}
      <Modal
        isOpen={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
        title="Manual Attendance Check-in"
        subtitle="Override or record an offline punch for timesheet reconciliation"
      >
        <form onSubmit={handleManualSubmit} className="space-y-4">
          {manualError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{manualError}</span>
            </div>
          )}

          {employees.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Target Employee
              </label>
              <select
                value={manualEmployeeId}
                onChange={(e) => setManualEmployeeId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-hidden text-slate-800 font-medium"
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName} ({e.employeeId})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Date
            </label>
            <input
              type="date"
              required
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 text-slate-800 font-medium outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Check-In Time
              </label>
              <input
                type="time"
                required
                value={manualCheckIn}
                onChange={(e) => setManualCheckIn(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 text-slate-800 font-medium outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Check-Out Time
              </label>
              <input
                type="time"
                required
                value={manualCheckOut}
                onChange={(e) => setManualCheckOut(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 text-slate-800 font-medium outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Override Status
            </label>
            <select
              value={manualStatus}
              onChange={(e) => setManualStatus(e.target.value as AttendanceStatus)}
              className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-hidden text-slate-800 font-medium"
            >
              <option value="PRESENT">PRESENT (Standard on-time)</option>
              <option value="LATE">LATE (Arrival after grace window)</option>
              <option value="HALF_DAY">HALF_DAY (Partial shift)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Reason / Justification
            </label>
            <textarea
              required
              rows={2}
              value={manualNotes}
              onChange={(e) => setManualNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3 text-slate-800 outline-hidden"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setManualModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={manualSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {manualSubmitting ? 'Saving...' : 'Record Manual Attendance'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
