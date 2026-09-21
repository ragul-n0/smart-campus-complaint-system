import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle2,
  Users,
  Building2,
  Calendar,
  RotateCw,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { fetchAdminMetrics, fetchDepartmentStats } from '../services/admin';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [deptStats, setDeptStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [m, d] = await Promise.all([
        fetchAdminMetrics(),
        fetchDepartmentStats(),
      ]);
      setMetrics(m);
      setDeptStats(d);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load administrative metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute status chart items
  const statusItems = metrics
    ? [
        { label: 'Pending', count: metrics.pending_complaints, color: 'bg-amber-500', bar: 'bg-amber-500', text: 'text-amber-400' },
        { label: 'Assigned', count: metrics.assigned_complaints, color: 'bg-blue-500', bar: 'bg-blue-500', text: 'text-blue-400' },
        { label: 'In Progress', count: metrics.in_progress_complaints, color: 'bg-purple-500', bar: 'bg-purple-500', text: 'text-purple-400' },
        { label: 'Resolved', count: metrics.resolved_complaints, color: 'bg-emerald-500', bar: 'bg-emerald-500', text: 'text-emerald-400' },
        { label: 'Closed', count: metrics.closed_complaints, color: 'bg-slate-500', bar: 'bg-slate-500', text: 'text-slate-400' },
      ]
    : [];

  const totalComplaints = metrics?.total_complaints || 0;

  // Compute priority chart items
  const priorityItems = metrics
    ? [
        { label: 'Low', count: metrics.low_priority, color: 'bg-emerald-500', text: 'text-emerald-400' },
        { label: 'Medium', count: metrics.medium_priority, color: 'bg-blue-500', text: 'text-blue-400' },
        { label: 'High', count: metrics.high_priority, color: 'bg-rose-500', text: 'text-rose-400' },
      ]
    : [];

  const maxDeptCount = Math.max(...deptStats.map((d) => d.total_complaints), 1);

  return (
    <AdminLayout
      title="Campus Administration Dashboard"
      subtitle="Comprehensive campus issue oversight, live resolution analytics, and operations control."
      action={
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      }
    >
      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={loadData} className="underline text-xs hover:text-white">
            Retry
          </button>
        </div>
      )}

      {loading && !metrics ? (
        <div className="flex flex-col items-center justify-center py-20">
          <RotateCw className="w-8 h-8 text-purple-400 animate-spin mb-3" />
          <p className="text-slate-400 text-sm">Aggregating live campus metrics...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* Total Complaints */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 shadow-sm hover:border-slate-600 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Total Issues</span>
                <FileText className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">{metrics?.total_complaints ?? 0}</div>
              <div className="text-[11px] text-slate-400 mt-1">Campus wide</div>
            </div>

            {/* Pending */}
            <div className="bg-slate-800/80 border border-amber-500/30 rounded-xl p-4 shadow-sm hover:border-amber-500/50 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-amber-300">Pending</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-400 tracking-tight">{metrics?.pending_complaints ?? 0}</div>
              <div className="text-[11px] text-slate-400 mt-1">Awaiting staff</div>
            </div>

            {/* In Progress */}
            <div className="bg-slate-800/80 border border-purple-500/30 rounded-xl p-4 shadow-sm hover:border-purple-500/50 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-purple-300">In Progress</span>
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-purple-400 tracking-tight">{metrics?.in_progress_complaints ?? 0}</div>
              <div className="text-[11px] text-slate-400 mt-1">Active resolution</div>
            </div>

            {/* Resolved */}
            <div className="bg-slate-800/80 border border-emerald-500/30 rounded-xl p-4 shadow-sm hover:border-emerald-500/50 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-emerald-300">Resolved</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 tracking-tight">{metrics?.resolved_complaints ?? 0}</div>
              <div className="text-[11px] text-slate-400 mt-1">Successfully fixed</div>
            </div>

            {/* Total Students */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 shadow-sm hover:border-slate-600 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Students</span>
                <Users className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">{metrics?.total_students ?? 0}</div>
              <div className="text-[11px] text-slate-400 mt-1">Registered users</div>
            </div>

            {/* Total Staff */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 shadow-sm hover:border-slate-600 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Staff Members</span>
                <Building2 className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">{metrics?.total_staff ?? 0}</div>
              <div className="text-[11px] text-slate-400 mt-1">{metrics?.total_departments ?? 0} departments</div>
            </div>
          </div>

          {/* Temporal Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Logged Today</div>
                <div className="text-lg font-bold text-white">{metrics?.complaints_today ?? 0} issues</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Logged This Month</div>
                <div className="text-lg font-bold text-white">{metrics?.complaints_this_month ?? 0} issues</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Resolved This Month</div>
                <div className="text-lg font-bold text-white">{metrics?.resolved_this_month ?? 0} issues</div>
              </div>
            </div>
          </div>

          {/* Visual Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Complaint Status Breakdown */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">Complaint Status Breakdown</h2>
                  <p className="text-xs text-slate-400">Distribution across lifecycle stages</p>
                </div>
                <Link to="/admin/complaints" className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                  <span>View Table</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {totalComplaints === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">No complaints logged yet.</div>
              ) : (
                <div className="space-y-3.5">
                  {statusItems.map((item) => {
                    const pct = totalComplaints > 0 ? Math.round((item.count / totalComplaints) * 100) : 0;
                    return (
                      <div key={item.label}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium text-slate-300">{item.label}</span>
                          <span className="font-mono text-slate-400">
                            {item.count} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-900/80 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`${item.bar} h-2.5 rounded-full transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Chart 2: Priority Distribution */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">Priority Distribution</h2>
                  <p className="text-xs text-slate-400">Severity and urgency breakdown</p>
                </div>
                <span className="text-xs text-slate-400 font-mono">{totalComplaints} issues</span>
              </div>

              {totalComplaints === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">No complaints logged yet.</div>
              ) : (
                <div className="space-y-4">
                  {/* Segmented Bar */}
                  <div className="w-full bg-slate-900 rounded-full h-4 overflow-hidden flex">
                    {priorityItems.map((item) => {
                      const pct = totalComplaints > 0 ? (item.count / totalComplaints) * 100 : 0;
                      return (
                        <div
                          key={item.label}
                          className={`${item.color} h-4 transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                          title={`${item.label}: ${item.count} (${Math.round(pct)}%)`}
                        />
                      );
                    })}
                  </div>

                  {/* Priority Cards */}
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    {priorityItems.map((item) => (
                      <div key={item.label} className="bg-slate-900/70 border border-slate-700/60 rounded-xl p-3 text-center">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          {item.label}
                        </div>
                        <div className={`text-xl font-bold ${item.text}`}>{item.count}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                          {totalComplaints > 0 ? Math.round((item.count / totalComplaints) * 100) : 0}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chart 3: Department Workload Breakdown */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Department Complaint Workload</h2>
                <p className="text-xs text-slate-400">Total assigned complaints and unresolved queue per department</p>
              </div>
              <Link to="/admin/departments" className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                <span>Manage Departments</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {deptStats.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">No departments found.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deptStats.map((dept) => {
                  const pct = Math.round((dept.total_complaints / maxDeptCount) * 100);
                  const activeQueue = dept.pending + dept.assigned + dept.in_progress;
                  return (
                    <div key={dept.department_id} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-white text-sm">{dept.department_name}</span>
                        <span className="text-xs font-mono text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                          {dept.total_complaints} total
                        </span>
                      </div>

                      {/* Workload Progress */}
                      <div className="w-full bg-slate-800 rounded-full h-2 mb-3">
                        <div
                          className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(pct, 2)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>
                          Active Queue: <strong className="text-amber-400">{activeQueue}</strong>
                        </span>
                        <span>
                          Resolved/Closed: <strong className="text-emerald-400">{dept.resolved + dept.closed}</strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
