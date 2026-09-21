import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  RotateCw,
  FolderOpen,
} from 'lucide-react';
import { getUser } from '../services/auth';
import { fetchMyComplaints } from '../services/complaints';
import StatCard from '../components/ui/StatCard';
import StatusBadge from '../components/ui/StatusBadge';
import PriorityBadge from '../components/ui/PriorityBadge';
import CategoryBadge from '../components/ui/CategoryBadge';
import EmptyState from '../components/ui/EmptyState';

export default function StudentDashboard() {
  const user = getUser();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const data = await fetchMyComplaints();
      setComplaints(data);
    } catch (_err) {
      setErrorMsg('Failed to load your complaints. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Compute live metrics strictly from actual complaint data
  const totalCount = complaints.length;
  const pendingCount = complaints.filter((c) => c.status === 'Pending').length;
  const inProgressCount = complaints.filter(
    (c) => c.status === 'Assigned' || c.status === 'In Progress'
  ).length;
  const resolvedCount = complaints.filter(
    (c) => c.status === 'Resolved' || c.status === 'Closed'
  ).length;

  const recentComplaints = complaints.slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full">
      {/* Top Welcome Header */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-7 shadow-card mb-6 sm:mb-8 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              Student Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Welcome back, {user?.name || 'Student'} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Track campus issues, view progress updates, or submit a new service request.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              to="/student/submit"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition active:scale-[0.99]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit Complaint</span>
            </Link>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={loadDashboardData}
            className="text-xs font-semibold text-rose-700 hover:text-rose-900 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* 4 Compact Statistic Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard
          icon={TrendingUp}
          label="Total Complaints"
          value={totalCount}
          loading={loading}
          variant="blue"
          subtitle="All complaints filed"
        />
        <StatCard
          icon={Clock}
          label="Pending"
          value={pendingCount}
          loading={loading}
          variant="slate"
          subtitle="Awaiting review"
        />
        <StatCard
          icon={RotateCw}
          label="In Progress"
          value={inProgressCount}
          loading={loading}
          variant="indigo"
          subtitle="Assigned & being resolved"
        />
        <StatCard
          icon={CheckCircle2}
          label="Resolved"
          value={resolvedCount}
          loading={loading}
          variant="emerald"
          subtitle="Completed issues"
        />
      </div>

      {/* Recent Complaints Section */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-card overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">
              Recent Complaints
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Your latest submitted campus facility and infrastructure issues.
            </p>
          </div>
          <Link
            to="/student/complaints"
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading your complaint records...</p>
          </div>
        ) : recentComplaints.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No complaints yet"
            description="You haven't submitted any campus complaints yet. Use the button below to report any facility issues."
            actionLabel="Submit Complaint"
            actionTo="/student/submit"
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {recentComplaints.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-xs font-mono font-semibold text-slate-400">
                      #{item.id}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-900 truncate">
                      {item.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs text-slate-500">
                    <CategoryBadge category={item.category} size="xs" />
                    <PriorityBadge priority={item.priority} size="xs" />
                    <span className="text-slate-300 hidden sm:inline">&bull;</span>
                    <span className="text-slate-600 font-medium">
                      {item.location?.name || 'Campus'}
                    </span>
                    <span className="text-slate-300 hidden sm:inline">&bull;</span>
                    <span className="text-slate-400">
                      {new Date(item.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <StatusBadge status={item.status} size="sm" />
                  <Link
                    to={`/student/complaints/${item.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 hover:text-blue-600 transition shadow-subtle"
                  >
                    <span>View Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
