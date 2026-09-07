import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Check,
  X,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { leaveApi } from '../services/api.js';
import { LeaveBalance, LeaveRequest, LeaveType } from '../types.js';
import { Modal } from '../components/common/Modal.js';
import { Badge } from '../components/common/Badge.js';

export const LeaveManagementView: React.FC = () => {
  const { user } = useAuth();
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Apply Modal state
  const [isApplyOpen, setIsApplyOpen] = useState<boolean>(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [calculatedDays, setCalculatedDays] = useState<number>(0);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Review (Approve/Reject) Modal
  const [reviewRequest, setReviewRequest] = useState<LeaveRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewLoading, setReviewLoading] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const [balRes, typesRes, reqRes] = await Promise.all([
        leaveApi.getMyBalances(),
        leaveApi.getTypes(),
        leaveApi.listRequests(),
      ]);
      setBalances(balRes.data || []);
      setLeaveTypes(typesRes.data || []);
      if (typesRes.data?.[0]) {
        setSelectedType(typesRes.data[0].id);
      }
      setRequests(reqRes.data || []);
    } catch (err) {
      console.warn('Failed to load leave data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Recalculate working days when dates change
  useEffect(() => {
    if (startDate && endDate && startDate <= endDate) {
      leaveApi
        .calculateDays({ startDate, endDate })
        .then((res) => {
          setCalculatedDays(res.data?.workingDays || 0);
        })
        .catch(() => {
          setCalculatedDays(0);
        });
    } else {
      setCalculatedDays(0);
    }
  }, [startDate, endDate]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyError(null);
    if (!startDate || !endDate || !reason.trim()) {
      setApplyError('Please complete all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      await leaveApi.apply({
        leaveTypeId: selectedType,
        startDate,
        endDate,
        reason,
      });
      setIsApplyOpen(false);
      setStartDate('');
      setEndDate('');
      setReason('');
      loadData();
    } catch (err: any) {
      setApplyError(err.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!reviewRequest) return;
    setReviewLoading(true);
    try {
      if (reviewAction === 'approve') {
        await leaveApi.approve(reviewRequest.id, reviewComment);
      } else {
        await leaveApi.reject(reviewRequest.id, reviewComment || 'Requirements not met');
      }
      setReviewRequest(null);
      setReviewComment('');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setReviewLoading(false);
    }
  };

  const filteredRequests = requests.filter((r) =>
    filterStatus === 'ALL' ? true : r.status === filterStatus
  );

  const canReview = user?.role === 'MANAGER' || user?.role === 'HR' || user?.role === 'ADMIN';

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Banner with Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Leave Management</h2>
          <p className="text-xs text-slate-500">
            Track allowance balances, request time off, and manage department approvals
          </p>
        </div>
        <button
          onClick={() => setIsApplyOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-2 shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* Leave Balances Grid (Sleek 4-column cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {balances.length === 0 ? (
          <div className="col-span-4 bg-white p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
            Loading leave balance policies...
          </div>
        ) : (
          balances.map((bal) => {
            const pctUsed = bal.allocatedDays > 0 ? (bal.usedDays / bal.allocatedDays) * 100 : 0;
            return (
              <div
                key={bal.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                    {bal.leaveType?.name || 'Leave'}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                    {bal.year}
                  </span>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-slate-900">{bal.remainingDays}</span>
                  <span className="text-slate-400 text-sm">/ {bal.allocatedDays} left</span>
                </div>
                <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${Math.min(100, pctUsed)}%` }}
                  />
                </div>
                <div className="mt-3 flex justify-between text-[11px] text-slate-500 font-medium">
                  <span>Used: {bal.usedDays}d</span>
                  <span>Pending: {bal.pendingDays}d</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Leave Requests Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Leave Requests</h3>
            <p className="text-xs text-slate-500">History and incoming approvals</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium">Filter:</span>
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
                  filterStatus === st
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Employee</th>
                <th className="px-6 py-3.5">Leave Type</th>
                <th className="px-6 py-3.5">Dates & Duration</th>
                <th className="px-6 py-3.5">Reason</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs">
                    No leave requests found for this filter.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const empName = req.employee
                    ? `${req.employee.firstName} ${req.employee.lastName}`
                    : 'Current Employee';
                  return (
                    <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900 flex items-center space-x-2.5">
                        <img
                          src={req.employee?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&auto=format&fit=crop&q=80'}
                          alt={empName}
                          className="w-7 h-7 rounded-full object-cover shrink-0"
                        />
                        <span>{empName}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-800">{req.leaveType?.name || 'Leave'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-900 font-medium">
                          {req.startDate} to {req.endDate}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {req.workingDays} working {req.workingDays === 1 ? 'day' : 'days'}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate text-slate-600" title={req.reason}>
                        {req.reason}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            req.status === 'APPROVED'
                              ? 'success'
                              : req.status === 'PENDING'
                              ? 'warning'
                              : req.status === 'REJECTED'
                              ? 'danger'
                              : 'neutral'
                          }
                        >
                          {req.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {canReview && req.status === 'PENDING' ? (
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => {
                                setReviewRequest(req);
                                setReviewAction('approve');
                              }}
                              className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-[11px] transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setReviewRequest(req);
                                setReviewAction('reject');
                              }}
                              className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold text-[11px] transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      <Modal
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        title="Apply for Leave"
        subtitle="Submit your time-off request for manager review"
      >
        <form onSubmit={handleApply} className="space-y-4">
          {applyError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{applyError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Leave Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-hidden text-slate-800 font-medium"
            >
              {leaveTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.defaultDays} days allocated)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 text-slate-800 font-medium outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                End Date
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 text-slate-800 font-medium outline-hidden"
              />
            </div>
          </div>

          {calculatedDays > 0 && (
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-700 font-medium flex items-center justify-between">
              <span>Estimated Working Days:</span>
              <span className="font-bold text-sm text-indigo-900">{calculatedDays} days</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Reason for Absence
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide context for your team lead..."
              className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3 text-slate-800 outline-hidden"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsApplyOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Review Request Modal */}
      {reviewRequest && (
        <Modal
          isOpen={Boolean(reviewRequest)}
          onClose={() => setReviewRequest(null)}
          title={reviewAction === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
          subtitle={`Reviewing request from ${reviewRequest.employee?.firstName || 'Employee'}`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Period:</span>
                <span className="font-semibold text-slate-800">
                  {reviewRequest.startDate} to {reviewRequest.endDate} ({reviewRequest.workingDays}d)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reason:</span>
                <span className="font-medium text-slate-800">{reviewRequest.reason}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Decision Comments (Optional)
              </label>
              <textarea
                rows={2}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Add note for the employee..."
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3 text-slate-800 outline-hidden"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReviewRequest(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReviewSubmit}
                disabled={reviewLoading}
                className={`px-4 py-2 rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-50 ${
                  reviewAction === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {reviewLoading ? 'Processing...' : reviewAction === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
