import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Building2,
  User,
  CheckCircle2,
  UserCheck,
  RotateCw,
  History,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import {
  fetchAdminComplaintDetails,
  fetchAdminDepartments,
  fetchAdminUsers,
  adminAssignComplaint,
  adminUpdatePriority,
  adminUpdateDepartment,
  adminUpdateStatus,
} from '../../services/admin';

export default function AdminComplaintDetails() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form action states
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusComment, setStatusComment] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [c, d, s] = await Promise.all([
        fetchAdminComplaintDetails(id),
        fetchAdminDepartments(),
        fetchAdminUsers({ role: 'staff' }),
      ]);
      setComplaint(c);
      setDepartments(d);
      setStaffUsers(s);
      setSelectedPriority(c.priority);
      setSelectedDeptId(c.department_id || '');
      setSelectedStatus(c.status);
      setSelectedStaffId(c.assigned_staff_id || '');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load complaint details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Action handlers
  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedStaffId) return;
    setActionLoading(true);
    setErrorMsg('');
    try {
      await adminAssignComplaint(id, selectedStaffId);
      setSuccessMsg('Staff member assigned successfully.');
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to assign staff member.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePriority = async (e) => {
    e.preventDefault();
    if (!selectedPriority || selectedPriority === complaint.priority) return;
    setActionLoading(true);
    setErrorMsg('');
    try {
      await adminUpdatePriority(id, selectedPriority);
      setSuccessMsg(`Priority updated to ${selectedPriority}.`);
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update priority.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDepartment = async (e) => {
    e.preventDefault();
    if (!selectedDeptId || Number(selectedDeptId) === complaint.department_id) return;
    setActionLoading(true);
    setErrorMsg('');
    try {
      await adminUpdateDepartment(id, selectedDeptId);
      setSuccessMsg('Department rerouted successfully.');
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update department.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatus = async (e) => {
    e.preventDefault();
    if (!selectedStatus || selectedStatus === complaint.status) return;
    setActionLoading(true);
    setErrorMsg('');
    try {
      await adminUpdateStatus(id, selectedStatus, statusComment);
      setSuccessMsg(`Status updated to ${selectedStatus}.`);
      setStatusComment('');
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Assigned':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'In Progress':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'Resolved':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Closed':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'Medium':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Low':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const eligibleStaff = staffUsers.filter(
    (s) => s.department_id === complaint?.department_id
  );

  return (
    <AdminLayout
      title={`Complaint Detail #${id}`}
      subtitle="Complete lifecycle audit, department routing, and administrative control."
      action={
        <Link
          to="/admin/complaints"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Complaints</span>
        </Link>
      }
    >
      {/* Feedback Messages */}
      {errorMsg && (
        <div className="mb-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-xs hover:text-white ml-2">
            Dismiss
          </button>
        </div>
      )}
      {successMsg && (
        <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-xs hover:text-white ml-2">
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <RotateCw className="w-8 h-8 text-purple-400 animate-spin mb-3" />
          <span className="text-sm">Loading complete issue profile...</span>
        </div>
      ) : !complaint ? (
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-12 text-center">
          <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">Complaint Not Found</h3>
          <p className="text-slate-400 text-xs mb-4">The requested complaint ID does not exist.</p>
          <Link
            to="/admin/complaints"
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
          >
            Return to List
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Column (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header & Description Card */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-purple-400 font-bold text-base">#{complaint.id}</span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(
                      complaint.status
                    )}`}
                  >
                    {complaint.status}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getPriorityBadge(
                      complaint.priority
                    )}`}
                  >
                    {complaint.priority} Priority
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(complaint.created_at).toLocaleString()}</span>
                </div>
              </div>

              <h2 className="text-xl font-bold text-white tracking-tight mb-3">
                {complaint.title}
              </h2>

              <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {complaint.description}
              </div>

              {/* Resolution Banner if present */}
              {complaint.resolved_at && (
                <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div className="text-xs">
                    <div className="text-emerald-300 font-semibold">Resolved on</div>
                    <div className="text-slate-300 font-mono">
                      {new Date(complaint.resolved_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Audit History & Timeline */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold text-white mb-4">
                <History className="w-4 h-4 text-purple-400" />
                <span>Lifecycle History &amp; Audit Log</span>
              </div>

              {!complaint.updates || complaint.updates.length === 0 ? (
                <div className="text-slate-500 text-xs py-4 text-center">No history recorded yet.</div>
              ) : (
                <div className="space-y-4 border-l-2 border-slate-700 ml-3 pl-4">
                  {complaint.updates.map((update, idx) => (
                    <div key={update.id || idx} className="relative group">
                      {/* Timeline dot */}
                      <div className="w-3 h-3 rounded-full bg-purple-500 border-2 border-slate-800 absolute -left-[23px] top-1" />

                      <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-3.5">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-white">
                            Status: <span className="text-purple-300">{update.new_status}</span>
                            {update.old_status && (
                              <span className="text-slate-500 font-normal"> (from {update.old_status})</span>
                            )}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(update.created_at).toLocaleString()}
                          </span>
                        </div>

                        {update.comment && (
                          <p className="text-xs text-slate-300 mt-1">{update.comment}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Context Cards & Admin Controls */}
          <div className="space-y-6">
            {/* Meta Context Card */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Issue Metadata
              </h3>

              {/* Student */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Student</div>
                  <div className="text-sm font-semibold text-white">{complaint.student?.name || 'N/A'}</div>
                  <div className="text-[11px] text-slate-400 font-mono">@{complaint.student?.username}</div>
                </div>
              </div>

              {/* Department */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Department</div>
                  <div className="text-sm font-semibold text-white">
                    {complaint.department?.name || 'Unassigned'}
                  </div>
                  <div className="text-[11px] text-slate-400">{complaint.category} Category</div>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Location</div>
                  <div className="text-sm font-semibold text-white">
                    {complaint.location?.name || 'N/A'}
                  </div>
                  {complaint.location?.description && (
                    <div className="text-[11px] text-slate-400">{complaint.location.description}</div>
                  )}
                </div>
              </div>

              {/* Assigned Staff */}
              <div className="flex items-start gap-3 pt-2 border-t border-slate-700/60">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Assigned Staff</div>
                  {complaint.assigned_staff ? (
                    <>
                      <div className="text-sm font-semibold text-white">
                        {complaint.assigned_staff.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        @{complaint.assigned_staff.username}
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-amber-400 font-medium mt-0.5">Unassigned</div>
                  )}
                </div>
              </div>
            </div>

            {/* Admin Action Controls */}
            <div className="bg-slate-800/80 border border-purple-500/30 rounded-2xl p-5 shadow-sm space-y-5">
              <div className="flex items-center gap-2 text-sm font-bold text-purple-300">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>Admin Actions</span>
              </div>

              {/* 1. Assign Staff Form */}
              <form onSubmit={handleAssign} className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Assign / Reassign Staff:
                </label>
                <div className="space-y-2">
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">-- Select Department Staff --</option>
                    {eligibleStaff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (@{s.username})
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={actionLoading || !selectedStaffId || eligibleStaff.length === 0}
                    className="w-full py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-semibold transition"
                  >
                    Update Staff Assignment
                  </button>
                  {eligibleStaff.length === 0 && (
                    <div className="text-[11px] text-rose-300">
                      No staff members assigned to {complaint.department?.name}.
                    </div>
                  )}
                </div>
              </form>

              <hr className="border-slate-700/60" />

              {/* 2. Update Priority Form */}
              <form onSubmit={handlePriority} className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Update Priority:
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                  <button
                    type="submit"
                    disabled={actionLoading || selectedPriority === complaint.priority}
                    className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-semibold transition"
                  >
                    Save
                  </button>
                </div>
              </form>

              <hr className="border-slate-700/60" />

              {/* 3. Reroute Department Form */}
              <form onSubmit={handleDepartment} className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Reroute Department:
                </label>
                <div className="space-y-1.5">
                  <select
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={actionLoading || Number(selectedDeptId) === complaint.department_id}
                    className="w-full py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-semibold transition"
                  >
                    Change Department
                  </button>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    Notice: Rerouting department clears previous staff assignment if they belong to the old department.
                  </div>
                </div>
              </form>

              <hr className="border-slate-700/60" />

              {/* 4. Update Status Form */}
              <form onSubmit={handleStatus} className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Administrative Status Change:
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>

                <textarea
                  placeholder="Optional resolution or admin comment..."
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />

                <button
                  type="submit"
                  disabled={actionLoading || selectedStatus === complaint.status}
                  className="w-full py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-semibold transition"
                >
                  Update Status
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
