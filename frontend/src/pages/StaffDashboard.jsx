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
  ChevronRight,
  Inbox,
  Loader2,
  AlertTriangle,
  User,
  LogOut,
  Building2,
} from 'lucide-react';
import { getUser, logout } from '../services/auth';
import { fetchStaffComplaints, fetchStaffMetrics } from '../services/staff';
import StatusBadge from '../components/ui/StatusBadge';
import PriorityBadge from '../components/ui/PriorityBadge';
import CategoryBadge from '../components/ui/CategoryBadge';
import StatCard from '../components/ui/StatCard';
import EmptyState from '../components/ui/EmptyState';

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-card mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 mb-2.5">
              <Wrench className="w-3.5 h-3.5 text-blue-600" />
              <span>Staff Operations Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Department Operations Dashboard
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-1 flex flex-wrap items-center gap-2">
              <span>Technician: <strong className="text-slate-900">{user?.name}</strong></span>
              <span>&bull;</span>
              <span className="inline-flex items-center space-x-1 font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/50">
                <Building2 className="w-3 h-3 text-blue-600" />
                <span>{user?.department?.name || 'Department Staff'}</span>
              </span>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-semibold border border-slate-200 hover:border-rose-200 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center space-x-2.5 shadow-sm">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Real-time Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard
          icon={TrendingUp}
          label="Dept Total"
          value={metrics.total}
          subtitle="All logged tickets"
          color="slate"
        />
        <StatCard
          icon={Clock}
          label="Pending Review"
          value={metrics.pending}
          subtitle="Awaiting dispatch"
          color="amber"
        />
        <StatCard
          icon={UserCheck}
          label="Assigned"
          value={metrics.assigned}
          subtitle="Dispatched to staff"
          color="blue"
        />
        <StatCard
          icon={ListFilter}
          label="In Progress"
          value={metrics.in_progress}
          subtitle="Active on-site work"
          color="indigo"
        />
        <StatCard
          icon={CheckCircle2}
          label="Resolved"
          value={metrics.resolved}
          subtitle="Completed tickets"
          color="emerald"
        />
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 mb-6 shadow-card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search title, student, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block flex-shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
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
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
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
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            >
              {PRIORITIES.map((pri) => (
                <option key={pri} value={pri}>
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
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading department assignments...</p>
        </div>
      ) : complaints.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No department complaints found"
          description={
            searchTerm || statusFilter !== 'All' || categoryFilter !== 'All' || priorityFilter !== 'All'
              ? 'No tickets match the active search or filter criteria.'
              : 'There are currently no tickets logged under your department queue.'
          }
        />
      ) : (
        <div className="space-y-3.5">
          {complaints.map((item) => (
            <div
              key={item.id}
              className="bg-white hover:border-blue-300 border border-slate-200/80 rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all group"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Top Badges Row */}
                  <div className="flex flex-wrap items-center gap-2 mb-2.5">
                    <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      #{item.id}
                    </span>
                    <StatusBadge status={item.status} size="sm" />
                    <PriorityBadge priority={item.priority} size="sm" />
                    <CategoryBadge category={item.category} size="sm" />
                    {item.location?.name && (
                      <span className="inline-flex items-center space-x-1 text-xs text-slate-600 bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{item.location.name}</span>
                      </span>
                    )}
                  </div>

                  {/* Title & Preview */}
                  <Link
                    to={`/staff/complaints/${item.id}`}
                    className="block group-hover:text-blue-600 transition-colors"
                  >
                    <h2 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
                      {item.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </Link>

                  {/* Footer metadata: student + assigned staff + date */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center space-x-1.5 text-slate-700">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Student: <strong>{item.student?.name || 'Student'}</strong></span>
                    </div>

                    <div className="flex items-center space-x-1.5 text-slate-600">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Technician: <strong className={item.assigned_staff?.name ? 'text-slate-800' : 'text-amber-600'}>
                          {item.assigned_staff?.name ? item.assigned_staff.name : 'Unassigned'}
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center space-x-1 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Right CTA */}
                <div className="flex items-center justify-end">
                  <Link
                    to={`/staff/complaints/${item.id}`}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
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
