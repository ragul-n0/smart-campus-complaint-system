import React, { useState, useEffect } from 'react';
import {
  RotateCw,
  Clock,
  Building2,
  Zap,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import {
  fetchAdminMetrics,
  fetchDepartmentStats,
  fetchResolutionStats,
} from '../../services/admin';

export default function AdminReports() {
  const [metrics, setMetrics] = useState(null);
  const [deptStats, setDeptStats] = useState([]);
  const [resolutionStats, setResolutionStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [m, d, r] = await Promise.all([
        fetchAdminMetrics(),
        fetchDepartmentStats(),
        fetchResolutionStats(),
      ]);
      setMetrics(m);
      setDeptStats(d);
      setResolutionStats(r);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load report analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AdminLayout
      title="System Reports &amp; Resolution Analytics"
      subtitle="Calculated turnaround performance, department queue distribution, and campus service efficiency."
      action={
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Reports</span>
        </button>
      }
    >
      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={loadData} className="underline text-xs hover:text-white">
            Retry
          </button>
        </div>
      )}

      {loading && !metrics ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <RotateCw className="w-8 h-8 text-purple-400 animate-spin mb-3" />
          <span className="text-sm">Calculating campus operational reports...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Resolution Performance Section */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider mb-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <span>Turnaround &amp; Resolution Efficiency</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight mb-4">
              Real-Time Issue Resolution Performance
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Average Time */}
              <div className="bg-slate-900/70 border border-slate-700/60 rounded-xl p-4">
                <div className="text-xs font-medium text-slate-400 mb-1">Average Resolution Time</div>
                <div className="text-2xl sm:text-3xl font-bold text-purple-400 font-mono">
                  {resolutionStats?.avg_resolution_hours ?? 0}
                  <span className="text-sm font-normal text-slate-400 ml-1">hrs</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">From creation to resolved state</div>
              </div>

              {/* Fastest Turnaround */}
              <div className="bg-slate-900/70 border border-emerald-500/20 rounded-xl p-4">
                <div className="text-xs font-medium text-emerald-300 mb-1 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Fastest Resolution</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono">
                  {resolutionStats?.fastest_resolution_hours !== null && resolutionStats?.fastest_resolution_hours !== undefined
                    ? resolutionStats.fastest_resolution_hours
                    : '--'}
                  <span className="text-sm font-normal text-slate-400 ml-1">hrs</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Best campus turnaround</div>
              </div>

              {/* Slowest Turnaround */}
              <div className="bg-slate-900/70 border border-slate-700/60 rounded-xl p-4">
                <div className="text-xs font-medium text-slate-400 mb-1">Slowest Resolution</div>
                <div className="text-2xl sm:text-3xl font-bold text-amber-400 font-mono">
                  {resolutionStats?.slowest_resolution_hours !== null && resolutionStats?.slowest_resolution_hours !== undefined
                    ? resolutionStats.slowest_resolution_hours
                    : '--'}
                  <span className="text-sm font-normal text-slate-400 ml-1">hrs</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Peak turnaround duration</div>
              </div>

              {/* Total Resolved & Closed */}
              <div className="bg-slate-900/70 border border-slate-700/60 rounded-xl p-4">
                <div className="text-xs font-medium text-slate-400 mb-1">Total Completed Issues</div>
                <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
                  {(resolutionStats?.total_resolved ?? 0) + (resolutionStats?.total_closed ?? 0)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {resolutionStats?.total_resolved ?? 0} Resolved &bull; {resolutionStats?.total_closed ?? 0} Closed
                </div>
              </div>
            </div>
          </div>

          {/* Department Performance Table */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-700/70 bg-slate-900/30 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Department Workload &amp; Resolution Analysis</h3>
                <p className="text-xs text-slate-400">Detailed queue comparison across departments</p>
              </div>
              <span className="text-xs text-purple-300 font-semibold bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full">
                {deptStats.length} Departments
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700/70 bg-slate-900/40 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Total Logged</th>
                    <th className="py-3 px-4">Pending</th>
                    <th className="py-3 px-4">Assigned</th>
                    <th className="py-3 px-4">In Progress</th>
                    <th className="py-3 px-4">Resolved</th>
                    <th className="py-3 px-4">Closed</th>
                    <th className="py-3 px-4 text-right">Completion Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50 text-xs">
                  {deptStats.map((dept) => {
                    const completed = dept.resolved + dept.closed;
                    const completionPct = dept.total_complaints > 0 ? Math.round((completed / dept.total_complaints) * 100) : 0;
                    return (
                      <tr key={dept.department_id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-purple-400" />
                          <span>{dept.department_name}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                          {dept.total_complaints}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-amber-400 font-medium">
                          {dept.pending}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-blue-400 font-medium">
                          {dept.assigned}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-purple-400 font-medium">
                          {dept.in_progress}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-emerald-400 font-semibold">
                          {dept.resolved}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-400">
                          {dept.closed}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold">
                            <span className={completionPct >= 70 ? 'text-emerald-400' : completionPct >= 40 ? 'text-amber-400' : 'text-slate-400'}>
                              {completionPct}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Issue Lifecycle Metrics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Status Breakdown */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-white mb-3">Lifecycle Queue State</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-700/50">
                  <span className="text-slate-400">Pending Assignment:</span>
                  <span className="font-mono font-bold text-amber-400">{metrics?.pending_complaints ?? 0}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-700/50">
                  <span className="text-slate-400">Assigned to Staff:</span>
                  <span className="font-mono font-bold text-blue-400">{metrics?.assigned_complaints ?? 0}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-700/50">
                  <span className="text-slate-400">Actively In Progress:</span>
                  <span className="font-mono font-bold text-purple-400">{metrics?.in_progress_complaints ?? 0}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-700/50">
                  <span className="text-slate-400">Resolved:</span>
                  <span className="font-mono font-bold text-emerald-400">{metrics?.resolved_complaints ?? 0}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Closed:</span>
                  <span className="font-mono font-bold text-slate-400">{metrics?.closed_complaints ?? 0}</span>
                </div>
              </div>
            </div>

            {/* Severity Distribution */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-white mb-3">Severity Breakdown</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-700/50">
                  <span className="text-slate-400">Low Priority:</span>
                  <span className="font-mono font-bold text-emerald-400">{metrics?.low_priority ?? 0}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-700/50">
                  <span className="text-slate-400">Medium Priority:</span>
                  <span className="font-mono font-bold text-blue-400">{metrics?.medium_priority ?? 0}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">High Priority (Urgent):</span>
                  <span className="font-mono font-bold text-rose-400">{metrics?.high_priority ?? 0}</span>
                </div>
              </div>
            </div>

            {/* User Community Distribution */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-white mb-3">Campus Accounts</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-700/50">
                  <span className="text-slate-400">Registered Students:</span>
                  <span className="font-mono font-bold text-teal-400">{metrics?.total_students ?? 0}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-700/50">
                  <span className="text-slate-400">Staff Specialists:</span>
                  <span className="font-mono font-bold text-indigo-400">{metrics?.total_staff ?? 0}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">System Administrators:</span>
                  <span className="font-mono font-bold text-purple-400">{metrics?.total_admins ?? 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
