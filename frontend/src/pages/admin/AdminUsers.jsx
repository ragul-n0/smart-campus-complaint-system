import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  RotateCw,
  Building2,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import {
  fetchAdminUsers,
  fetchAdminDepartments,
  updateStaffDepartment,
  updateUserRole,
} from '../../services/admin';
import EmptyState from '../../components/ui/EmptyState';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [roleFilter, setRoleFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [deptModalData, setDeptModalData] = useState(null); // { user, selectedDeptId }
  const [roleModalData, setRoleModalData] = useState(null); // { user, selectedRole }
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [u, d] = await Promise.all([
        fetchAdminUsers({
          role: roleFilter,
          department_id: deptFilter,
          search: searchTerm,
        }),
        fetchAdminDepartments(),
      ]);
      setUsers(u);
      setDepartments(d);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load user directory.');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, deptFilter, searchTerm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    if (!deptModalData) return;
    setActionLoading(true);
    setErrorMsg('');
    try {
      const deptId = deptModalData.selectedDeptId ? Number(deptModalData.selectedDeptId) : null;
      await updateStaffDepartment(deptModalData.user.id, deptId);
      setSuccessMsg(`Department for @${deptModalData.user.username} updated.`);
      setDeptModalData(null);
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update department assignment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    if (!roleModalData) return;
    setActionLoading(true);
    setErrorMsg('');
    try {
      await updateUserRole(roleModalData.user.id, roleModalData.selectedRole);
      setSuccessMsg(`Role for @${roleModalData.user.username} changed to ${roleModalData.selectedRole}.`);
      setRoleModalData(null);
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update user role.');
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'staff':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <AdminLayout
      title="User Directory &amp; Role Management"
      subtitle="Manage students, departmental maintenance specialists, and system administrative accounts."
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
      {/* Messages */}
      {errorMsg && (
        <div className="mb-4 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
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
      {successMsg && (
        <div className="mb-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
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

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-card mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by name or @username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition shadow-sm"
            />
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition shadow-sm"
            >
              <option value="All">All Roles</option>
              <option value="student">Students</option>
              <option value="staff">Staff Members</option>
              <option value="admin">Administrators</option>
            </select>
          </div>

          <div>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition shadow-sm"
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
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-card overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-xs text-slate-500">Loading campus users...</span>
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            title="No Users Found"
            description="No registered campus accounts match your filter criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">#ID</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Assigned Department</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400 font-semibold">
                      #{u.id}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{u.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">@{u.username}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() =>
                          setRoleModalData({ user: u, selectedRole: u.role })
                        }
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getRoleBadge(
                          u.role
                        )} capitalize hover:opacity-80 transition`}
                        title="Click to modify role"
                      >
                        {u.role}
                      </button>
                    </td>

                    <td className="py-3.5 px-4">
                      {u.role === 'staff' ? (
                        u.department ? (
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-slate-700 font-medium">{u.department.name}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setDeptModalData({ user: u, selectedDeptId: u.department_id })
                              }
                              className="text-[10px] text-blue-600 hover:text-blue-800 underline ml-1"
                            >
                              Edit
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setDeptModalData({ user: u, selectedDeptId: '' })
                            }
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-medium hover:bg-amber-100"
                          >
                            Assign Department
                          </button>
                        )
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">N/A ({u.role})</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {u.role === 'staff' && (
                        <button
                          type="button"
                          onClick={() =>
                            setDeptModalData({ user: u, selectedDeptId: u.department_id || '' })
                          }
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-300 transition shadow-subtle"
                        >
                          Department
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setRoleModalData({ user: u, selectedRole: u.role })
                        }
                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-medium transition shadow-subtle"
                      >
                        Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Staff Department Modal */}
      {deptModalData && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-sm w-full p-6 shadow-elevated animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Assign Staff Department
              </h3>
              <button
                type="button"
                onClick={() => setDeptModalData(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Staff: <strong className="text-slate-800">{deptModalData.user.name}</strong> (@
              {deptModalData.user.username})
            </p>

            <form onSubmit={handleDeptSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Department:
                </label>
                <select
                  value={deptModalData.selectedDeptId || ''}
                  onChange={(e) =>
                    setDeptModalData((prev) => ({
                      ...prev,
                      selectedDeptId: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                >
                  <option value="">No Department Assigned</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeptModalData(null)}
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

      {/* User Role Modal */}
      {roleModalData && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-sm w-full p-6 shadow-elevated animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Change User Role
              </h3>
              <button
                type="button"
                onClick={() => setRoleModalData(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              User: <strong className="text-slate-800">{roleModalData.user.name}</strong> (@
              {roleModalData.user.username})
            </p>

            <form onSubmit={handleRoleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Role:
                </label>
                <select
                  value={roleModalData.selectedRole}
                  onChange={(e) =>
                    setRoleModalData((prev) => ({
                      ...prev,
                      selectedRole: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                >
                  <option value="student">Student</option>
                  <option value="staff">Staff (Facility Specialist)</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRoleModalData(null)}
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
                  <span>Save Role</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
