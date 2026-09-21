import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Tag,
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
      // Reload history
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

      // Reload history
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
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">Loading complaint file...</p>
      </div>
    );
  }

  if (errorMsg && !complaint) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300">
          <ShieldAlert className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white mb-2">Access Restricted or Not Found</h2>
          <p className="text-sm mb-6">{errorMsg}</p>
          <Link
            to="/staff/dashboard"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          to="/staff/dashboard"
          className="inline-flex items-center space-x-2 text-xs font-medium text-slate-400 hover:text-indigo-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Staff Dashboard</span>
        </Link>

        {/* Dynamic Action Buttons based on status */}
        <div className="flex items-center space-x-2">
          {complaint.status === 'Pending' && (
            <button
              onClick={() => setActiveModal('assign')}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition"
            >
              <UserCheck className="w-4 h-4" />
              <span>Take Complaint</span>
            </button>
          )}

          {complaint.status === 'Assigned' && (
            <button
              onClick={() => setActiveModal('in_progress')}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Start Work</span>
            </button>
          )}

          {complaint.status === 'In Progress' && (
            <button
              onClick={() => setActiveModal('resolve')}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition"
            >
              <CheckSquare className="w-4 h-4" />
              <span>Mark as Resolved</span>
            </button>
          )}

          {complaint.status === 'Resolved' && (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Issue Resolved</span>
            </span>
          )}

          {complaint.status === 'Closed' && (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-500/10 border border-slate-500/20 text-slate-400 text-xs font-semibold">
              <span>Closed</span>
            </span>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center space-x-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs sm:text-sm flex items-center space-x-2.5">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Details + Sidebar Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Column: Complaint Data */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-7 shadow-xl backdrop-blur-md">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs font-mono font-bold text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700">
                Complaint #{complaint.id}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {complaint.status}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                {complaint.priority} Priority
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-4">
              {complaint.title}
            </h1>

            {/* Meta attributes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 text-xs mb-6">
              <div>
                <div className="text-slate-500 flex items-center space-x-1 mb-1">
                  <Tag className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Category</span>
                </div>
                <div className="font-semibold text-slate-200">{complaint.category}</div>
              </div>

              <div>
                <div className="text-slate-500 flex items-center space-x-1 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Location</span>
                </div>
                <div className="font-semibold text-slate-200">
                  {complaint.location?.name || 'Campus'}
                </div>
              </div>

              <div>
                <div className="text-slate-500 flex items-center space-x-1 mb-1">
                  <Building className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Department</span>
                </div>
                <div className="font-semibold text-slate-200">
                  {complaint.department?.name} Dept
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Problem Description
              </h3>
              <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap bg-slate-900/40 p-4 rounded-xl border border-slate-700/50">
                {complaint.description}
              </p>
            </div>

            {/* Attached Photo Evidence */}
            {complaint.image_url && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Student Attached Photo
                </h3>
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-700/60 inline-block">
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
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 shadow-xl backdrop-blur-md">
            <h2 className="text-sm font-bold text-white mb-4">Milestone Progress</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {STATUS_STEPS.map((step, idx) => {
                const isCompleted = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                return (
                  <div
                    key={step}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isCurrent
                        ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-md'
                        : isCompleted
                        ? 'bg-slate-900/60 border-indigo-500/40 text-indigo-300'
                        : 'bg-slate-900/30 border-slate-700/60 text-slate-500'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 mx-auto mb-1.5 rounded-full flex items-center justify-center text-xs font-bold ${
                        isCurrent
                          ? 'bg-indigo-500 text-white'
                          : isCompleted
                          ? 'bg-indigo-500/30 text-indigo-300'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isCompleted ? <Check className="w-3 h-3" /> : idx + 1}
                    </div>
                    <div className="text-[11px] font-bold">{step}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Student, Assignment & History */}
        <div className="space-y-6">
          {/* Student Info Card */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl backdrop-blur-md">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>Reported By Student</span>
            </h3>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/60 text-xs space-y-1.5">
              <div className="font-semibold text-white text-sm">
                {complaint.student?.name || 'Student'}
              </div>
              <div className="text-slate-400 font-mono">
                @{complaint.student?.username || 'unknown'}
              </div>
              <div className="text-slate-500 text-[11px] pt-1">
                Student Account ID: #{complaint.student_id}
              </div>
            </div>
          </div>

          {/* Assignment Card */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl backdrop-blur-md">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Assignment State</span>
            </h3>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/60 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Assigned Staff:</span>
                <span className="font-semibold text-white">
                  {complaint.assigned_staff?.name || 'Unassigned'}
                </span>
              </div>
              {complaint.assigned_staff?.username && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Username:</span>
                  <span className="font-mono text-slate-300">
                    @{complaint.assigned_staff.username}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1 border-t border-slate-700/50">
                <span className="text-slate-400">Responsible Dept:</span>
                <span className="text-indigo-300 font-medium">
                  {complaint.department?.name}
                </span>
              </div>
              {isAssignedToMe && (
                <div className="mt-2 text-center py-1 rounded bg-indigo-500/10 text-indigo-300 font-medium text-[11px] border border-indigo-500/20">
                  Assigned to you
                </div>
              )}
            </div>
          </div>

          {/* Activity / Audit Timeline */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl backdrop-blur-md">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Action History Log</span>
            </h3>

            {history.length === 0 ? (
              <p className="text-xs text-slate-500">No activity logged.</p>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 text-xs"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-200">
                      <span>{item.new_status}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(item.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {item.comment && (
                      <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                        {item.comment}
                      </p>
                    )}
                    <div className="text-slate-500 text-[10px] mt-1">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal: Take Complaint */}
            {activeModal === 'assign' && (
              <>
                <h3 className="text-lg font-bold text-white mb-2">Accept &amp; Take Complaint</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                  Assign this complaint to yourself? The status will transition from{' '}
                  <span className="text-amber-400 font-semibold">Pending</span> to{' '}
                  <span className="text-blue-400 font-semibold">Assigned</span>.
                </p>
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setActiveModal(null)}
                    disabled={isProcessing}
                    className="px-4 py-2 rounded-xl text-slate-300 hover:text-white text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignToSelf}
                    disabled={isProcessing}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow"
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
                <h3 className="text-lg font-bold text-white mb-2">Begin Diagnostic / Repair</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                  Mark this complaint as{' '}
                  <span className="text-purple-400 font-semibold">In Progress</span>? The student will
                  see that active maintenance has begun.
                </p>
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setActiveModal(null)}
                    disabled={isProcessing}
                    className="px-4 py-2 rounded-xl text-slate-300 hover:text-white text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('In Progress')}
                    disabled={isProcessing}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow"
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
                <h3 className="text-lg font-bold text-white mb-2">Mark Complaint as Resolved</h3>
                <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                  Provide a mandatory resolution comment detailing what actions were taken to fix the
                  problem.
                </p>

                {commentError && (
                  <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                    {commentError}
                  </div>
                )}

                <div className="mb-5">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Resolution Comment <span className="text-emerald-400">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={resolutionComment}
                    onChange={(e) => {
                      setResolutionComment(e.target.value);
                      if (commentError) setCommentError('');
                    }}
                    placeholder="Describe what was done to resolve this complaint (e.g. Replaced damaged ceiling fan capacitor and tested rotation speed)..."
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => {
                      setActiveModal(null);
                      setCommentError('');
                    }}
                    disabled={isProcessing}
                    className="px-4 py-2 rounded-xl text-slate-300 hover:text-white text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('Resolved')}
                    disabled={isProcessing}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow"
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
