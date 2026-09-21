import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  RotateCw,
  Users,
  Building2,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import {
  fetchAdminUsers,
  fetchAdminDepartments,
  updateStaffDepartment,
  updateUserRole,
} from '../../services/admin';

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

  // Handlers
  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    if (!deptModalData?.selectedDeptId) return;
    setActionLoading(true);
    setErrorMsg('');
    try {
      await updateStaffDepartment(deptModalData.user.id, deptModalData.selectedDeptId);
      setSuccessMsg(`Staff member ${deptModalData.user.name} assigned to department.`);
      setDeptModalData(null);
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update department.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    if (!roleModalData?.selectedRole || roleModalData.selectedRole === roleModalData.user.role) return;
    setActionLoading(true);
    setErrorMsg('');
    try {
      await updateUserRole(roleModalData.user.id, roleModalData.selectedRole);
      setSuccessMsg(`Role for ${roleModalData.user.name} changed to ${roleModalData.selectedRole}.`);
      setRoleModalData(null);
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update role.');
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'staff':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'student':
        return 'bg-teal-500/10 text-teal-400 border-teal-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <AdminLayout
      title="User Management &amp; Access Control"
      subtitle="Supervise campus user roles, staff department allocations, and account privileges."
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
      {/* Messages */}
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

      {/* Filter Bar */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-sm mb-6 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
          <Filter className="w-3.5 h-3.5" />
          <span>User Filters &amp; Search</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or @username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 transition"
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

      {/* Users Table */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <RotateCw className="w-8 h-8 text-purple-400 animate-spin mb-3" />
            <span className="text-sm">Loading campus users...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <Users className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No Users Found</h3>
            <p className="text-slate-400 text-xs">No registered accounts match your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700/70 bg-slate-900/40 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">#ID</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Assigned Department</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 text-xs">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-purple-300 font-semibold">
                      #{u.id}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{u.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">@{u.username}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <button
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
                            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-slate-200 font-medium">{u.department.name}</span>
                            <button
                              onClick={() =>
                                setDeptModalData({ user: u, selectedDeptId: u.department_id })
                              }
                              className="text-[10px] text-purple-400 hover:text-purple-300 underline ml-1"
                            >
                              Edit
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              setDeptModalData({ user: u, selectedDeptId: '' })
                            }
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-medium hover:bg-amber-500/20"
                          >
                            Assign Department
                          </button>
                        )
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">N/A ({u.role})</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      {u.role === 'staff' && (
                        <button
                          onClick={() =>
                            setDeptModalData({ user: u, selectedDeptId: u.department_id || '' })
                          }
                          className="px-2.5 py-1 rounded-lg bg-slate-700/60 hover:bg-slate-600 text-slate-200 text-xs font-medium border border-slate-600 transition"
                        >
                          Department
                        </button>
                      )}
                      <button
                        onClick={() =>
                          setRoleModalData({ user: u, selectedRole: u.role })
                        }
                        className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-medium transition"
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-1">
              Assign Staff Department
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Staff: <strong className="text-white">{deptModalData.user.name}</strong> (@{deptModalData.user.username})
            </p>

            <form onSubmit={handleDeptSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Select Department:
                </label>
                <select
                  value={deptModalData.selectedDeptId || ''}
                  onChange={(e) =>
                    setDeptModalData({
                      ...deptModalData,
                      selectedDeptId: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  required
                >
                  <option value="">-- Choose Department --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setDeptModalData(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !deptModalData.selectedDeptId}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition"
                >
                  {actionLoading ? 'Saving...' : 'Save Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change User Role Modal */}
      {roleModalData && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-1">
              Modify User Role &bull; {roleModalData.user.name}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Current Role: <span className="font-semibold text-white capitalize">{roleModalData.user.role}</span>
            </p>

            <form onSubmit={handleRoleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Select New Privilege Level:
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'student', label: 'Student', desc: 'Submit and manage campus issues' },
                    { id: 'staff', label: 'Staff Member', desc: 'Resolve department queue issues' },
                    { id: 'admin', label: 'Administrator', desc: 'System-wide oversight & config' },
                  ].map((r) => (
                    <label
                      key={r.id}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                        roleModalData.selectedRole === r.id
                          ? 'bg-purple-600/10 border-purple-500 text-white'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="roleSelect"
                        value={r.id}
                        checked={roleModalData.selectedRole === r.id}
                        onChange={(e) =>
                          setRoleModalData({
                            ...roleModalData,
                            selectedRole: e.target.value,
                          })
                        }
                        className="mt-0.5 text-purple-600 focus:ring-0"
                      />
                      <div>
                        <div className="text-xs font-bold text-white">{r.label}</div>
                        <div className="text-[11px] text-slate-400">{r.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="text-[10px] text-slate-400 leading-tight">
                Safety Note: The system will automatically prevent demoting the only remaining administrator account.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setRoleModalData(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || roleModalData.selectedRole === roleModalData.user.role}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition"
                >
                  {actionLoading ? 'Updating...' : 'Confirm Role Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
