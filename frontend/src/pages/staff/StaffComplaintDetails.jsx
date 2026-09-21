import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Building,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  User,
  UserCheck,
  Check,
  Play,
  CheckSquare,
  ShieldAlert,
} from 'lucide-react';
import { getUser } from '../../services/auth';
import {
  fetchStaffComplaintDetails,
  assignStaffComplaint,
  updateStaffComplaintStatus,
} from '../../services/staff';
import { fetchComplaintHistory } from '../../services/complaints';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import CategoryBadge from '../../components/ui/CategoryBadge';

const STATUS_STEPS = ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Closed'];

export default function StaffComplaintDetails() {
  const { id } = useParams();
  const currentUser = getUser();

  const [complaint, setComplaint] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State for Status Action
  const [activeModal, setActiveModal] = useState(null); // 'assign', 'in_progress', 'resolve'
  const [resolutionComment, setResolutionComment] = useState('');
  const [commentError, setCommentError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const [compData, histData] = await Promise.all([
        fetchStaffComplaintDetails(id),
        fetchComplaintHistory(id),
      ]);
      setComplaint(compData);
      setHistory(histData);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load complaint details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handler: Take Complaint (Assign to self)
  const handleAssignToSelf = async () => {
    try {
      setIsProcessing(true);
      setErrorMsg('');
      const updated = await assignStaffComplaint(id);
      setComplaint(updated);
      setActiveModal(null);
      setSuccessMsg('Complaint successfully assigned to you.');
      setTimeout(() => setSuccessMsg(''), 4000);
      const hist = await fetchComplaintHistory(id);
      setHistory(hist);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to assign complaint.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler: Update status (Start Work or Mark Resolved)
  const handleStatusUpdate = async (targetStatus) => {
    if (targetStatus === 'Resolved' && !resolutionComment.trim()) {
      setCommentError('Please describe the resolution details before marking as resolved.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMsg('');
      setCommentError('');

      const updated = await updateStaffComplaintStatus(
        id,
        targetStatus,
        targetStatus === 'Resolved'
          ? resolutionComment.trim()
          : targetStatus === 'In Progress'
          ? 'Staff technician started active diagnostic/repair work.'
          : null
      );

      setComplaint(updated);
      setActiveModal(null);
      setResolutionComment('');
      setSuccessMsg(`Complaint status successfully transitioned to ${targetStatus}.`);
      setTimeout(() => setSuccessMsg(''), 4000);

      const hist = await fetchComplaintHistory(id);
      setHistory(hist);
    } catch (err) {
      setErrorMsg(err.message || 'Status transition failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Loading ticket file...</p>
      </div>
    );
  }

  if (errorMsg && !complaint) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="p-8 rounded-2xl bg-white border border-rose-200 shadow-card">
          <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">Access Restricted or Not Found</h2>
          <p className="text-sm text-slate-600 mb-6">{errorMsg}</p>
          <Link
            to="/staff/dashboard"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Staff Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.indexOf(complaint.status);
  const isAssignedToMe = complaint.assigned_staff_id === currentUser?.id;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <Link
          to="/staff/dashboard"
          className="inline-flex items-center space-x-2 text-xs font-medium text-slate-500 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Operations Dashboard</span>
        </Link>

        {/* Dynamic Action Buttons based on status */}
        <div className="flex items-center space-x-2">
          {complaint.status === 'Pending' && (
            <button
              onClick={() => setActiveModal('assign')}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
            >
              <UserCheck className="w-4 h-4" />
              <span>Accept &amp; Take Ticket</span>
            </button>
          )}

          {complaint.status === 'Assigned' && (
            <button
              onClick={() => setActiveModal('in_progress')}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Start On-Site Work</span>
            </button>
          )}

          {complaint.status === 'In Progress' && (
            <button
              onClick={() => setActiveModal('resolve')}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition"
            >
              <CheckSquare className="w-4 h-4" />
              <span>Mark as Resolved</span>
            </button>
          )}

          {complaint.status === 'Resolved' && (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Issue Resolved</span>
            </span>
          )}

          {complaint.status === 'Closed' && (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold">
              <span>Ticket Closed</span>
            </span>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center space-x-2.5 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center space-x-2.5 shadow-sm">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Details + Sidebar Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Column: Complaint Data */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-card">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                Ticket #{complaint.id}
              </span>
              <StatusBadge status={complaint.status} />
              <PriorityBadge priority={complaint.priority} />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-4">
              {complaint.title}
            </h1>

            {/* Meta attributes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs mb-6">
              <div>
                <div className="text-slate-500 flex items-center space-x-1 mb-1">
                  <span>Category</span>
                </div>
                <CategoryBadge category={complaint.category} size="sm" />
              </div>

              <div>
                <div className="text-slate-500 flex items-center space-x-1 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Location</span>
                </div>
                <div className="font-semibold text-slate-800">
                  {complaint.location?.name || 'Campus'}
                </div>
              </div>

              <div>
                <div className="text-slate-500 flex items-center space-x-1 mb-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>Department</span>
                </div>
                <div className="font-semibold text-slate-800">
                  {complaint.department?.name} Dept
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Problem Description
              </h3>
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                {complaint.description}
              </p>
            </div>

            {/* Attached Photo Evidence */}
            {complaint.image_url && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Student Attached Photo
                </h3>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 inline-block">
                  <img
                    src={complaint.image_url}
                    alt="Complaint evidence"
                    className="max-h-72 max-w-full rounded-lg object-contain"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Status Progression Bar */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-card">
            <h2 className="text-sm font-bold text-slate-900 mb-4">Milestone Progress</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {STATUS_STEPS.map((step, idx) => {
                const isCompleted = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                return (
                  <div
                    key={step}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isCurrent
                        ? 'bg-blue-50 border-blue-400 text-blue-900 font-semibold shadow-xs'
                        : isCompleted
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 mx-auto mb-1.5 rounded-full flex items-center justify-center text-xs font-bold ${
                        isCurrent
                          ? 'bg-blue-600 text-white'
                          : isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                    </div>
                    <div className="text-[11px] font-medium">{step}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Student, Assignment & History */}
        <div className="space-y-6">
          {/* Student Info Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-card">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>Reported By Student</span>
            </h3>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1.5">
              <div className="font-semibold text-slate-900 text-sm">
                {complaint.student?.name || 'Student'}
              </div>
              <div className="text-slate-500 font-mono">
                @{complaint.student?.username || 'unknown'}
              </div>
              <div className="text-slate-400 text-[11px] pt-1">
                Student Account ID: #{complaint.student_id}
              </div>
            </div>
          </div>

          {/* Assignment Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-card">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center space-x-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Assignment State</span>
            </h3>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Assigned Staff:</span>
                <span className="font-semibold text-slate-800">
                  {complaint.assigned_staff?.name || 'Unassigned'}
                </span>
              </div>
              {complaint.assigned_staff?.username && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Username:</span>
                  <span className="font-mono text-slate-600">
                    @{complaint.assigned_staff.username}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Responsible Dept:</span>
                <span className="text-blue-700 font-medium">
                  {complaint.department?.name}
                </span>
              </div>
              {isAssignedToMe && (
                <div className="mt-2 text-center py-1 rounded-md bg-blue-50 text-blue-700 font-medium text-[11px] border border-blue-200">
                  Assigned directly to you
                </div>
              )}
            </div>
          </div>

          {/* Activity / Audit Timeline */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-card">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Action History Log</span>
            </h3>

            {history.length === 0 ? (
              <p className="text-xs text-slate-400">No activity logged.</p>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>{item.new_status}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(item.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {item.comment && (
                      <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                        {item.comment}
                      </p>
                    )}
                    <div className="text-slate-400 text-[10px] mt-1">
                      {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: Confirmation for status transitions */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-elevated animate-in fade-in zoom-in-95 duration-150">
            {/* Modal: Take Complaint */}
            {activeModal === 'assign' && (
              <>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Accept &amp; Take Ticket</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                  Assign this complaint to yourself? The status will transition from{' '}
                  <span className="text-amber-700 font-semibold">Pending</span> to{' '}
                  <span className="text-blue-700 font-semibold">Assigned</span>.
                </p>
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setActiveModal(null)}
                    disabled={isProcessing}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-800 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignToSelf}
                    disabled={isProcessing}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
                  >
                    {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Confirm Assignment</span>
                  </button>
                </div>
              </>
            )}

            {/* Modal: Start Work */}
            {activeModal === 'in_progress' && (
              <>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Begin Diagnostic / Repair</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                  Mark this complaint as{' '}
                  <span className="text-indigo-700 font-semibold">In Progress</span>? The student will
                  see that active maintenance has begun.
                </p>
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setActiveModal(null)}
                    disabled={isProcessing}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-800 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('In Progress')}
                    disabled={isProcessing}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
                  >
                    {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Confirm Start Work</span>
                  </button>
                </div>
              </>
            )}

            {/* Modal: Mark Resolved */}
            {activeModal === 'resolve' && (
              <>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Mark Complaint as Resolved</h3>
                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  Provide a mandatory resolution comment detailing what actions were taken to fix the
                  problem.
                </p>

                {commentError && (
                  <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    {commentError}
                  </div>
                )}

                <div className="mb-5">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Resolution Comment <span className="text-emerald-600">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={resolutionComment}
                    onChange={(e) => {
                      setResolutionComment(e.target.value);
                      if (commentError) setCommentError('');
                    }}
                    placeholder="Describe what was done to resolve this complaint (e.g. Replaced damaged ceiling fan capacitor and verified rotation speed)..."
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => {
                      setActiveModal(null);
                      setCommentError('');
                    }}
                    disabled={isProcessing}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-800 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('Resolved')}
                    disabled={isProcessing}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
                  >
                    {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Confirm Resolution</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
