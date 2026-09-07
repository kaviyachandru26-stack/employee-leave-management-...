import React, { useState, useEffect } from 'react';
import { Calendar, Plus, AlertCircle, CheckCircle2, Clock, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { holidaysApi } from '../services/api.js';
import { Holiday } from '../types.js';
import { Modal } from '../components/common/Modal.js';
import { Badge } from '../components/common/Badge.js';

export const HolidaysView: React.FC = () => {
  const { user } = useAuth();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isOptional, setIsOptional] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadHolidays = async () => {
    try {
      const res = await holidaysApi.list();
      setHolidays(res.data || []);
    } catch (err) {
      console.warn('Holidays fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHolidays();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await holidaysApi.create({
        name,
        date,
        description,
        isOptional,
      });
      setIsAddOpen(false);
      setName('');
      setDate('');
      setDescription('');
      setIsOptional(false);
      loadHolidays();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create holiday');
    } finally {
      setSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const canManage = user?.role === 'HR' || user?.role === 'ADMIN';

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Company Holiday Calendar</h2>
          <p className="text-xs text-slate-500">
            Mandatory and optional public holidays for timesheet and leave calculation
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-2 shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Holiday</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Annual Calendar (2025 – 2026)</h3>
          <p className="text-xs text-slate-500">Scheduled non-working corporate days</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Holiday Name</th>
                <th className="px-6 py-3.5">Classification</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {holidays.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-xs">
                    No holidays listed in the current schedule.
                  </td>
                </tr>
              ) : (
                holidays.map((h) => {
                  const isUpcoming = h.date >= todayStr;
                  return (
                    <tr key={h.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {new Date(h.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">{h.name}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            h.isOptional
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-indigo-100 text-indigo-700'
                          }`}
                        >
                          {h.isOptional ? 'Optional / Floating' : 'Mandatory Public'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={isUpcoming ? 'success' : 'neutral'}>
                          {isUpcoming ? 'Upcoming' : 'Past'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-slate-400 max-w-xs truncate">
                        {h.description || 'Observed company-wide'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Company Holiday"
        subtitle="Schedule an official non-working holiday"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Holiday Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Labor Day"
              className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-hidden text-slate-800 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-hidden text-slate-800 font-medium"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="optionalCheck"
              checked={isOptional}
              onChange={(e) => setIsOptional(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300"
            />
            <label htmlFor="optionalCheck" className="text-xs text-slate-700 font-medium">
              Floating / Optional Holiday (Employee choice)
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Regional observation notes..."
              className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3 text-slate-800 outline-hidden"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add Holiday'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
