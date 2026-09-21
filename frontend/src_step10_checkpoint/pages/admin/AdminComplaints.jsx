import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Eye,
  RotateCw,
  UserCheck,
  AlertCircle,
  Building2,
  MapPin,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import {
  fetchAdminComplaints,
  fetchAdminDepartments,
  fetchAdminLocations,
  fetchAdminUsers,
  adminAssignComplaint,
  adminUpdatePriority,
} from '../../services/admin';

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [assignModalData, setAssignModalData] = useState(null); // { complaint, selectedStaffId }
  const [priorityModalData, setPriorityModalData] = useState(null); // { complaint, selectedPriority }
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [complaintsData, deptsData, locsData, staffData] = await Promise.all([
        fetchAdminComplaints({
          status: statusFilter,
          priority: priorityFilter,
          category: categoryFilter,
          department_id: departmentFilter,
          search: searchTerm,
        }),
        fetchAdminDepartments(),
        fetchAdminLocations(),
        fetchAdminUsers({ role: 'staff' }),
      ]);
      setComplaints(complaintsData);
      setDepartments(deptsData);
      setLocations(locsData);
      setStaffUsers(staffData);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load complaints.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, categoryFilter, departmentFilter, searchTerm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers for quick actions
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignModalData?.selectedStaffId) return;
    setActionLoading(true);
    setErrorMsg('');
    try {
      await adminAssignComplaint(assignModalData.complaint.id, assignModalData.selectedStaffId);
      setSuccessMsg(`Complaint #${assignModalData.complaint.id} successfully assigned.`);
      setAssignModalData(null);
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to assign complaint.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrioritySubmit = async (e) => {
    e.preventDefault();
    if (!priorityModalData?.selectedPriority) return;
    setActionLoading(true);
    setErrorMsg('');
    try {
      await adminUpdatePriority(priorityModalData.complaint.id, priorityModalData.selectedPriority);
      setSuccessMsg(`Priority for #${priorityModalData.complaint.id} updated to ${priorityModalData.selectedPriority}.`);
      setPriorityModalData(null);
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update priority.');
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

  // Filter staff matching a complaint's department
  const getDepartmentStaff = (deptId) => {
    if (!deptId) return [];
    return staffUsers.filter((s) => s.department_id === deptId);
  };

  return (
    <AdminLayout
      title="Campus Complaints Management"
      subtitle="Comprehensive view and administrative routing for issues across all departments."
      action={
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
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

      {/* Filter Controls Bar */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-sm mb-6 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters &amp; Search</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title, student, or #ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 transition"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 transition"
            >
              <option value="All">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 transition"
            >
              <option value="All">All Categories</option>
              <option value="IT">IT</option>
              <option value="Electrical">Electrical</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Housekeeping">Housekeeping</option>
              <option value="Security">Security</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Furniture">Furniture</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 transition"
            >
              <option value="All">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <RotateCw className="w-8 h-8 text-purple-400 animate-spin mb-3" />
            <span className="text-sm">Loading complaints directory...</span>
          </div>
        ) : complaints.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No Complaints Found</h3>
            <p className="text-slate-400 text-xs max-w-sm mx-auto">
              No campus issues match your active search and filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700/70 bg-slate-900/40 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">#ID</th>
                  <th className="py-3 px-4">Issue Details</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Department &amp; Location</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Assigned Staff</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 text-xs">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-purple-300">
                      #{c.id}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-white truncate">{c.title}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className="px-1.5 py-0.2 rounded bg-slate-700/70 text-slate-300">
                          {c.category}
                        </span>
                        <span>&bull;</span>
                        <span>{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() =>
                          setPriorityModalData({ complaint: c, selectedPriority: c.priority })
                        }
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getPriorityBadge(
                          c.priority
                        )} hover:opacity-80 transition`}
                        title="Click to change priority"
                      >
                        {c.priority}
                      </button>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(
                          c.status
                        )}`}
                      >
                        {c.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-slate-200">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{c.department?.name || 'Unassigned'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400 text-[11px] mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{c.location?.name || 'Location N/A'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-200">{c.student?.name || 'Student'}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        @{c.student?.username}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {c.assigned_staff ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-200">{c.assigned_staff.name}</span>
                          <button
                            onClick={() =>
                              setAssignModalData({
                                complaint: c,
                                selectedStaffId: c.assigned_staff_id,
                              })
                            }
                            className="text-[10px] text-purple-400 hover:text-purple-300 underline"
                          >
                            Reassign
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() =>
                            setAssignModalData({ complaint: c, selectedStaffId: '' })
                          }
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-700/60 hover:bg-slate-700 text-purple-300 border border-slate-600 text-[11px] font-medium transition"
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>Assign</span>
                        </button>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/admin/complaints/${c.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-600 text-slate-200 text-xs font-medium border border-slate-600 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Assign Staff Modal */}
      {assignModalData && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-white mb-1">
              Assign Staff &bull; #{assignModalData.complaint.id}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Routing issue: <span className="text-slate-200 font-medium">{assignModalData.complaint.title}</span>
            </p>

            <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-3 mb-4 text-xs text-slate-300 space-y-1">
              <div>
                Department:{' '}
                <strong className="text-purple-300">
                  {assignModalData.complaint.department?.name || 'Unassigned'}
                </strong>
              </div>
              <div className="text-[11px] text-slate-400">
                Only staff assigned to this department are eligible for assignment.
              </div>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Select Department Staff Member:
                </label>
                {getDepartmentStaff(assignModalData.complaint.department_id).length === 0 ? (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span>
                      No staff members are assigned to{' '}
                      <strong>{assignModalData.complaint.department?.name}</strong>. Assign staff in User Management first.
                    </span>
                  </div>
                ) : (
                  <select
                    value={assignModalData.selectedStaffId || ''}
                    onChange={(e) =>
                      setAssignModalData({
                        ...assignModalData,
                        selectedStaffId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                    required
                  >
                    <option value="">-- Choose Staff Member --</option>
                    {getDepartmentStaff(assignModalData.complaint.department_id).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (@{s.username})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setAssignModalData(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    actionLoading ||
                    !assignModalData.selectedStaffId ||
                    getDepartmentStaff(assignModalData.complaint.department_id).length === 0
                  }
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition"
                >
                  {actionLoading ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Priority Modal */}
      {priorityModalData && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-white mb-1">
              Change Priority &bull; #{priorityModalData.complaint.id}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Current priority:{' '}
              <span className="font-semibold text-white">
                {priorityModalData.complaint.priority}
              </span>
            </p>

            <form onSubmit={handlePrioritySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Select Urgency Level:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Low', 'Medium', 'High'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() =>
                        setPriorityModalData({
                          ...priorityModalData,
                          selectedPriority: p,
                        })
                      }
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                        priorityModalData.selectedPriority === p
                          ? 'bg-purple-600 border-purple-500 text-white shadow-md'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setPriorityModalData(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition"
                >
                  {actionLoading ? 'Updating...' : 'Save Priority'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
