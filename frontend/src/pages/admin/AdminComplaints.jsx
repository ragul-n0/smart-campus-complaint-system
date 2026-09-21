import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  RotateCw,
  UserCheck,
  AlertCircle,
  ChevronRight,
  ShieldAlert,
  X,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import {
  fetchAdminComplaints,
  fetchAdminDepartments,
  fetchAdminUsers,
  adminAssignComplaint,
  adminUpdatePriority,
} from '../../services/admin';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import CategoryBadge from '../../components/ui/CategoryBadge';
import EmptyState from '../../components/ui/EmptyState';

const CATEGORIES = [
  'All',
  'IT',
  'Electrical',
  'Maintenance',
  'Housekeeping',
  'Security',
  'Plumbing',
  'Furniture',
  'Other',
];

const STATUSES = ['All', 'Pending', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
const PRIORITIES = ['All', 'High', 'Medium', 'Low'];

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
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

  // Modals
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
      setSuccessMsg(
        `Priority for #${priorityModalData.complaint.id} updated to ${priorityModalData.selectedPriority}.`
      );
      setPriorityModalData(null);
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update priority.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout
      title="Complaint Management"
      subtitle="Review all student submissions, assign to department staff, and update priorities."
      action={
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-subtle transition"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      }
    >
      {/* Alerts */}
      {successMsg && (
        <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg('')}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-2"
          >
            &times;
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            className="text-rose-700 hover:text-rose-900 font-bold ml-2"
          >
            &times;
          </button>
        </div>
      )}

      {/* Filter Control Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-card mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-sm"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white shadow-sm"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === 'All' ? 'All Statuses' : `Status: ${s}`}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white shadow-sm"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p === 'All' ? 'All Priorities' : `Priority: ${p}`}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white shadow-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Categories' : `Category: ${c}`}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white shadow-sm"
            >
              <option value="All">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  Dept: {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Total complaints found: <strong className="text-slate-900">{complaints.length}</strong>
          </span>
          {(searchTerm ||
            statusFilter !== 'All' ||
            priorityFilter !== 'All' ||
            categoryFilter !== 'All' ||
            departmentFilter !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
                setPriorityFilter('All');
                setCategoryFilter('All');
                setDepartmentFilter('All');
              }}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Complaints Table Container */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading complaints table...</p>
          </div>
        ) : complaints.length === 0 ? (
          <EmptyState
            title="No complaints match filters"
            description="Try changing your search keywords or filter criteria to see results."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                  <th className="py-3 px-4">Complaint</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complaints.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 max-w-xs truncate">
                        <span className="font-mono text-slate-400 mr-1.5 font-normal">#{item.id}</span>
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {item.description}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <CategoryBadge category={item.category} size="xs" />
                    </td>

                    <td className="py-3.5 px-3">
                      <PriorityBadge priority={item.priority} size="xs" />
                    </td>

                    <td className="py-3.5 px-3">
                      <StatusBadge status={item.status} size="xs" />
                    </td>

                    <td className="py-3.5 px-3 text-slate-600 font-medium">
                      {item.department?.name || 'Unassigned'}
                    </td>

                    <td className="py-3.5 px-3 text-slate-500">
                      {item.location?.name || 'Campus'}
                    </td>

                    <td className="py-3.5 px-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          to={`/admin/complaints/${item.id}`}
                          title="View Details"
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            setAssignModalData({
                              complaint: item,
                              selectedStaffId: item.assigned_staff_id || '',
                            })
                          }
                          title="Assign Staff"
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setPriorityModalData({
                              complaint: item,
                              selectedPriority: item.priority || 'Medium',
                            })
                          }
                          title="Change Priority"
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition"
                        >
                          <ShieldAlert className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Staff Assignment */}
      {assignModalData && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-md w-full shadow-elevated">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Assign Department Staff</h3>
              <button
                type="button"
                onClick={() => setAssignModalData(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Select an authorized staff member to resolve complaint{' '}
              <strong className="text-slate-800">#{assignModalData.complaint.id}</strong> (
              {assignModalData.complaint.title}).
            </p>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Staff Member
                </label>
                <select
                  value={assignModalData.selectedStaffId}
                  onChange={(e) =>
                    setAssignModalData((prev) => ({
                      ...prev,
                      selectedStaffId: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                  required
                >
                  <option value="">Select staff member...</option>
                  {staffUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} (@{u.username})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssignModalData(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Assignment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Priority Adjustment */}
      {priorityModalData && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-md w-full shadow-elevated">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Adjust Urgency &amp; Priority</h3>
              <button
                type="button"
                onClick={() => setPriorityModalData(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Update severity level for complaint{' '}
              <strong className="text-slate-800">#{priorityModalData.complaint.id}</strong>.
            </p>

            <form onSubmit={handlePrioritySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Priority Level
                </label>
                <select
                  value={priorityModalData.selectedPriority}
                  onChange={(e) =>
                    setPriorityModalData((prev) => ({
                      ...prev,
                      selectedPriority: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                >
                  <option value="High">High (Urgent / Safety Hazard)</option>
                  <option value="Medium">Medium (Standard)</option>
                  <option value="Low">Low (Minor / Cosmetic)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPriorityModalData(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Update Priority</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
