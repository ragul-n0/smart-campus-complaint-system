import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  ListFilter,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { getUser } from '../services/auth';
import { fetchMyComplaints } from '../services/complaints';

export default function StudentDashboard() {
  const user = getUser();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const data = await fetchMyComplaints();
        setComplaints(data);
      } catch (_err) {
        setErrorMsg('Failed to load complaint statistics.');
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  // Compute live metrics from actual complaint API data
  const totalCount = complaints.length;
  const pendingCount = complaints.filter((c) => c.status === 'Pending').length;
  const inProgressCount = complaints.filter(
    (c) => c.status === 'Assigned' || c.status === 'In Progress'
  ).length;
  const resolvedCount = complaints.filter(
    (c) => c.status === 'Resolved' || c.status === 'Closed'
  ).length;

  const recentComplaints = complaints.slice(0, 4);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Welcome Banner */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-md mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/20 mb-2">
              Student Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Welcome back, {user?.name || 'Student'}!
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Username: <span className="font-mono text-slate-300">@{user?.username}</span> &bull; Role:{' '}
              <span className="capitalize text-teal-400 font-medium">{user?.role}</span>
            </p>
          </div>

          {/* Quick Submit CTA */}
          <div className="flex items-center space-x-3">
            <Link
              to="/student/submit"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs sm:text-sm font-semibold shadow-lg transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit Complaint</span>
            </Link>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs sm:text-sm flex items-center space-x-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Real-time Status Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total */}
        <Link
          to="/student/complaints"
          className="bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 rounded-2xl p-5 shadow-lg transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Total Complaints</span>
            <TrendingUp className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-teal-400" /> : totalCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">All campus issues submitted</div>
        </Link>

        {/* Pending */}
        <Link
          to="/student/complaints"
          className="bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/40 rounded-2xl p-5 shadow-lg transition-all group"
        >
          <div className="flex items-center justify-between text-amber-400 text-xs font-medium mb-2">
            <span>Pending Review</span>
            <Clock className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-amber-400" /> : pendingCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Awaiting staff assignment</div>
        </Link>

        {/* In Progress */}
        <Link
          to="/student/complaints"
          className="bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 hover:border-purple-500/40 rounded-2xl p-5 shadow-lg transition-all group"
        >
          <div className="flex items-center justify-between text-purple-400 text-xs font-medium mb-2">
            <span>In Progress</span>
            <ListFilter className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-purple-400" /> : inProgressCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Assigned / being resolved</div>
        </Link>

        {/* Resolved */}
        <Link
          to="/student/complaints"
          className="bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/40 rounded-2xl p-5 shadow-lg transition-all group"
        >
          <div className="flex items-center justify-between text-emerald-400 text-xs font-medium mb-2">
            <span>Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-emerald-400" /> : resolvedCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Completed &amp; closed issues</div>
        </Link>
      </div>

      {/* Recent Complaints Section */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 sm:p-7 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/70 mb-5">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Recent Submissions</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Quick overview of your latest reported issues.
            </p>
          </div>
          <Link
            to="/student/complaints"
            className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center space-x-1"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-teal-400 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading recent complaints...</p>
          </div>
        ) : recentComplaints.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-xs sm:text-sm text-slate-400 mb-4">
              You haven't filed any complaints yet.
            </p>
            <Link
              to="/student/submit"
              className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit First Complaint</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {recentComplaints.map((item) => (
              <div
                key={item.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-700/20 px-2 rounded-xl transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-slate-400 font-semibold">
                      #{item.id}
                    </span>
                    <span className="text-xs font-semibold text-white truncate max-w-md">
                      {item.title}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-1">
                    <span>{item.category}</span>
                    <span>&bull;</span>
                    <span>{item.location?.name || 'Campus'}</span>
                    <span>&bull;</span>
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                      item.status === 'Pending'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : item.status === 'In Progress' || item.status === 'Assigned'
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {item.status}
                  </span>
                  <Link
                    to={`/student/complaints/${item.id}`}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
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
