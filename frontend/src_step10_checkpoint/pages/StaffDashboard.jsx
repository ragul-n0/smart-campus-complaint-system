import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wrench,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  ListFilter,
  TrendingUp,
  UserCheck,
  MapPin,
  Tag,
  ChevronRight,
  Inbox,
  Loader2,
  AlertTriangle,
  User,
  LogOut,
} from 'lucide-react';
import { getUser, logout } from '../services/auth';
import { fetchStaffComplaints, fetchStaffMetrics } from '../services/staff';

const STATUSES = ['All', 'Pending', 'Assigned', 'In Progress', 'Resolved', 'Closed'];

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

const PRIORITIES = ['All', 'Low', 'Medium', 'High'];

export default function StaffDashboard() {
  const navigate = useNavigate();
  const user = getUser();

  const [metrics, setMetrics] = useState({
    total: 0,
    pending: 0,
    assigned: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  });
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const [metricsData, complaintsData] = await Promise.all([
        fetchStaffMetrics().catch(() => null),
        fetchStaffComplaints({
          status: statusFilter,
          category: categoryFilter,
          priority: priorityFilter,
          search: searchTerm,
        }),
      ]);

      if (metricsData) {
        setMetrics(metricsData);
      }
      setComplaints(complaintsData);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load department complaints.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, priorityFilter, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleLogout = () => {
    logout();
    navigate('/login');
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
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'Medium':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'Low':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Header Card */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-md mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-2">
              <Wrench className="w-3.5 h-3.5 text-indigo-400" />
              <span>Staff Operations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Staff Dashboard
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Logged in as <span className="text-white font-medium">{user?.name}</span> &bull; Assigned to{' '}
              <span className="text-indigo-300 font-semibold px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                {user?.department?.name || 'Department'}
              </span>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs sm:text-sm flex items-center space-x-2.5">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Real-time Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-8">
        {/* Total */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Department Total</span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white">{metrics.total}</div>
          <div className="text-[11px] text-slate-500 mt-1">All department issues</div>
        </div>

        {/* Pending */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between text-amber-400 text-xs font-medium mb-1.5">
            <span>Pending Review</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white">{metrics.pending}</div>
          <div className="text-[11px] text-slate-500 mt-1">Unassigned issues</div>
        </div>

        {/* Assigned */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between text-blue-400 text-xs font-medium mb-1.5">
            <span>Assigned</span>
            <UserCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white">{metrics.assigned}</div>
          <div className="text-[11px] text-slate-500 mt-1">Accepted by technician</div>
        </div>

        {/* In Progress */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between text-purple-400 text-xs font-medium mb-1.5">
            <span>In Progress</span>
            <ListFilter className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white">{metrics.in_progress}</div>
          <div className="text-[11px] text-slate-500 mt-1">Under active repair</div>
        </div>

        {/* Resolved */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-medium mb-1.5">
            <span>Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white">{metrics.resolved}</div>
          <div className="text-[11px] text-slate-500 mt-1">Completed repairs</div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 sm:p-5 mb-6 backdrop-blur-md shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search title, student, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-indigo-400 hidden sm:block flex-shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status} className="bg-slate-800 text-white">
                  Status: {status}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-slate-800 text-white">
                  Category: {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              {PRIORITIES.map((pri) => (
                <option key={pri} value={pri} className="bg-slate-800 text-white">
                  Priority: {pri}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Complaint List */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading department complaints...</p>
        </div>
      ) : complaints.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto mb-4">
            <Inbox className="w-7 h-7" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white mb-2">No complaints found</h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'All' || categoryFilter !== 'All' || priorityFilter !== 'All'
              ? 'No complaints match the specified search or filter criteria.'
              : 'There are currently no complaints logged for your department.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {complaints.map((item) => (
            <div
              key={item.id}
              className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/40 rounded-2xl p-5 shadow-lg transition-all group"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Top Badges Row */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-mono font-semibold text-slate-400">
                      #{item.id}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>

                    {/* Priority Badge */}
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getPriorityBadge(
                        item.priority
                      )}`}
                    >
                      {item.priority} Priority
                    </span>

                    {/* Category */}
                    <span className="inline-flex items-center space-x-1 text-[11px] text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded-md border border-slate-700/60">
                      <Tag className="w-3 h-3 text-indigo-400" />
                      <span>{item.category}</span>
                    </span>

                    {/* Location */}
                    <span className="inline-flex items-center space-x-1 text-[11px] text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded-md border border-slate-700/60">
                      <MapPin className="w-3 h-3 text-indigo-400" />
                      <span>{item.location?.name || 'Campus'}</span>
                    </span>
                  </div>

                  {/* Title & Preview */}
                  <Link
                    to={`/staff/complaints/${item.id}`}
                    className="block group-hover:text-indigo-300 transition-colors"
                  >
                    <h2 className="text-base sm:text-lg font-bold text-white truncate">
                      {item.title}
                    </h2>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </Link>

                  {/* Footer metadata: student + assigned staff + date */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-700/50">
                    <div className="flex items-center space-x-1.5 text-slate-300">
                      <User className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Student: {item.student?.name || 'Student'}</span>
                    </div>

                    <div className="flex items-center space-x-1.5 text-slate-400">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Assigned: {item.assigned_staff?.name ? item.assigned_staff.name : 'Unassigned'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1 text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Right CTA */}
                <div className="flex items-center justify-end">
                  <Link
                    to={`/staff/complaints/${item.id}`}
                    className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold shadow-sm transition"
                  >
                    <span>Manage</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
