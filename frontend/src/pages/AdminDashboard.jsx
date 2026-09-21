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
  TrendingUp,
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { fetchAdminMetrics, fetchDepartmentStats } from '../services/admin';
import StatCard from '../components/ui/StatCard';

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

  const totalComplaints = metrics?.total_complaints || 0;

  // Status breakdown configuration
  const statusItems = metrics
    ? [
        { label: 'Pending', count: metrics.pending_complaints, bar: 'bg-slate-500', text: 'text-slate-700' },
        { label: 'Assigned', count: metrics.assigned_complaints, bar: 'bg-blue-600', text: 'text-blue-700' },
        { label: 'In Progress', count: metrics.in_progress_complaints, bar: 'bg-indigo-600', text: 'text-indigo-700' },
        { label: 'Resolved', count: metrics.resolved_complaints, bar: 'bg-emerald-600', text: 'text-emerald-700' },
        { label: 'Closed', count: metrics.closed_complaints, bar: 'bg-teal-600', text: 'text-teal-700' },
      ]
    : [];

  // Priority breakdown configuration
  const priorityItems = metrics
    ? [
        { label: 'Low', count: metrics.low_priority, color: 'bg-slate-400', text: 'text-slate-700' },
        { label: 'Medium', count: metrics.medium_priority, color: 'bg-amber-500', text: 'text-amber-700' },
        { label: 'High', count: metrics.high_priority, color: 'bg-rose-500', text: 'text-rose-700' },
      ]
    : [];

  const maxDeptCount = Math.max(...deptStats.map((d) => d.total_complaints), 1);

  return (
    <AdminLayout
      title="Campus Administration Dashboard"
      subtitle="Comprehensive campus issue oversight, live resolution analytics, and operations control."
      action={
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-subtle transition"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      }
    >
      {errorMsg && (
        <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={loadData}
            className="underline text-xs font-semibold hover:text-rose-900"
          >
            Retry
          </button>
        </div>
      )}

      {loading && !metrics ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200 shadow-card">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-slate-500 text-sm font-medium">Aggregating live campus metrics...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Metric Cards (6 Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <StatCard
              icon={FileText}
              label="Total Issues"
              value={metrics?.total_complaints ?? 0}
              variant="blue"
              subtitle="All campus logs"
            />
            <StatCard
              icon={Clock}
              label="Pending"
              value={metrics?.pending_complaints ?? 0}
              variant="slate"
              subtitle="Awaiting staff"
            />
            <StatCard
              icon={TrendingUp}
              label="In Progress"
              value={metrics?.in_progress_complaints ?? 0}
              variant="indigo"
              subtitle="Being resolved"
            />
            <StatCard
              icon={CheckCircle2}
              label="Resolved"
              value={metrics?.resolved_complaints ?? 0}
              variant="emerald"
              subtitle="Completed"
            />
            <StatCard
              icon={Users}
              label="Students"
              value={metrics?.total_students ?? 0}
              variant="blue"
              subtitle="Registered accounts"
            />
            <StatCard
              icon={Building2}
              label="Staff & Depts"
              value={`${metrics?.total_staff ?? 0} / ${metrics?.total_departments ?? 0}`}
              variant="slate"
              subtitle="Active units"
            />
          </div>

          {/* Temporal Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white border border-slate-200/90 rounded-xl p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Logged Today</div>
                <div className="text-base sm:text-lg font-bold text-slate-900">
                  {metrics?.complaints_today ?? 0} issues
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Logged This Month</div>
                <div className="text-base sm:text-lg font-bold text-slate-900">
                  {metrics?.complaints_this_month ?? 0} issues
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Resolved This Month</div>
                <div className="text-base sm:text-lg font-bold text-slate-900">
                  {metrics?.resolved_this_month ?? 0} issues
                </div>
              </div>
            </div>
          </div>

          {/* Visual Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Complaint Status Breakdown */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-card">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Complaint Status Lifecycle
                  </h2>
                  <p className="text-xs text-slate-500">Distribution across active resolution states</p>
                </div>
                <Link
                  to="/admin/complaints"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {totalComplaints === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">No complaints logged yet.</div>
              ) : (
                <div className="space-y-3.5">
                  {statusItems.map((item) => {
                    const pct = totalComplaints > 0 ? Math.round((item.count / totalComplaints) * 100) : 0;
                    return (
                      <div key={item.label}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium text-slate-700">{item.label}</span>
                          <span className="font-mono text-slate-500">
                            {item.count} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
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
            <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-card">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Priority Distribution
                  </h2>
                  <p className="text-xs text-slate-500">Severity and urgency breakdown across complaints</p>
                </div>
                <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2.5 py-0.5 rounded-full">
                  {totalComplaints} total
                </span>
              </div>

              {totalComplaints === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">No complaints logged yet.</div>
              ) : (
                <div className="space-y-5">
                  {/* Segmented Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden flex shadow-inner">
                    {priorityItems.map((item) => {
                      const pct = totalComplaints > 0 ? (item.count / totalComplaints) * 100 : 0;
                      return (
                        <div
                          key={item.label}
                          className={`${item.color} h-3.5 transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                          title={`${item.label}: ${item.count} (${Math.round(pct)}%)`}
                        />
                      );
                    })}
                  </div>

                  {/* Priority Cards */}
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    {priorityItems.map((item) => (
                      <div
                        key={item.label}
                        className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center"
                      >
                        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          {item.label}
                        </div>
                        <div className={`text-xl font-bold ${item.text}`}>{item.count}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          {totalComplaints > 0 ? Math.round((item.count / totalComplaints) * 100) : 0}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Department Complaint Workload Breakdown */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-card">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Department Complaint Workload
                </h2>
                <p className="text-xs text-slate-500">
                  Total assigned complaints and unresolved queues per facility department
                </p>
              </div>
              <Link
                to="/admin/departments"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>Manage Departments</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {deptStats.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">No departments found.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deptStats.map((dept) => {
                  const pct = Math.round((dept.total_complaints / maxDeptCount) * 100);
                  const activeQueue = dept.pending + dept.assigned + dept.in_progress;
                  return (
                    <div
                      key={dept.department_id}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-4 transition hover:bg-slate-100/70"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-slate-800 text-sm">
                          {dept.department_name}
                        </span>
                        <span className="text-xs font-mono font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                          {dept.total_complaints} issues
                        </span>
                      </div>

                      {/* Workload Progress */}
                      <div className="w-full bg-slate-200 rounded-full h-2 mb-3">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(pct, 2)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>
                          Active Queue: <strong className="text-amber-600 font-semibold">{activeQueue}</strong>
                        </span>
                        <span>
                          Resolved/Closed:{' '}
                          <strong className="text-emerald-600 font-semibold">
                            {dept.resolved + dept.closed}
                          </strong>
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
