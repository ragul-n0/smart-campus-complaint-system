import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Search,
  Filter,
  PlusCircle,
  Clock,
  MapPin,
  Tag,
  AlertTriangle,
  ChevronRight,
  Inbox,
  Loader2,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { fetchMyComplaints, deleteComplaint } from '../../services/complaints';

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

export default function MyComplaints() {
  const routeLocation = useLocation();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [notification, setNotification] = useState(routeLocation.state?.message || '');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Delete modal state
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const data = await fetchMyComplaints({
        status: selectedStatus,
        category: selectedCategory,
      });
      setComplaints(data);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load your complaints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [selectedStatus, selectedCategory]);

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete complaint #${id}?`)) {
      return;
    }

    try {
      setIsDeleting(true);
      setDeletingId(id);
      await deleteComplaint(id);
      setNotification(`Complaint #${id} deleted successfully.`);
      // Refresh list
      setComplaints((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete complaint.');
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  // Client-side search filtering by title
  const filteredComplaints = complaints.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            My Complaints
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Track, review status updates, and manage your reported campus issues.
          </p>
        </div>
        <Link
          to="/student/submit"
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs sm:text-sm font-semibold shadow-md transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Complaint</span>
        </Link>
      </div>

      {/* Notifications */}
      {notification && (
        <div className="mb-6 p-4 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            onClick={() => setNotification('')}
            className="text-teal-400 hover:text-white text-xs font-semibold ml-4"
          >
            &times;
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs sm:text-sm flex items-center space-x-2.5">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 sm:p-5 mb-6 backdrop-blur-md shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
            />
          </div>

          {/* Filter Status */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-teal-400 hidden sm:block flex-shrink-0" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status} className="bg-slate-800 text-white">
                  Status: {status}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Category */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-slate-800 text-white">
                  Category: {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Complaint List */}
      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-400 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading your complaints...</p>
        </div>
      ) : filteredComplaints.length === 0 ? (
        /* Empty State */
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 sm:p-14 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto mb-4">
            <Inbox className="w-7 h-7" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white mb-2">No complaints yet</h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-sm mx-auto mb-6">
            Submit your first campus complaint to track issues, view status milestones, and stay informed.
          </p>
          <Link
            to="/student/submit"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs sm:text-sm font-semibold transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit Complaint</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComplaints.map((complaint) => (
            <div
              key={complaint.id}
              className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 rounded-2xl p-5 shadow-lg transition-all group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-slate-400 font-semibold">
                      #{complaint.id}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(
                        complaint.status
                      )}`}
                    >
                      {complaint.status}
                    </span>

                    {/* Priority Badge */}
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getPriorityBadge(
                        complaint.priority
                      )}`}
                    >
                      {complaint.priority} Priority
                    </span>

                    {/* Category */}
                    <span className="inline-flex items-center space-x-1 text-[11px] text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded-md border border-slate-700/60">
                      <Tag className="w-3 h-3 text-teal-400" />
                      <span>{complaint.category}</span>
                    </span>

                    {/* Location */}
                    <span className="inline-flex items-center space-x-1 text-[11px] text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded-md border border-slate-700/60">
                      <MapPin className="w-3 h-3 text-teal-400" />
                      <span>{complaint.location?.name || 'Campus'}</span>
                    </span>
                  </div>

                  {/* Title & Description Preview */}
                  <Link
                    to={`/student/complaints/${complaint.id}`}
                    className="block group-hover:text-teal-300 transition-colors"
                  >
                    <h2 className="text-base sm:text-lg font-bold text-white truncate">
                      {complaint.title}
                    </h2>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {complaint.description}
                    </p>
                  </Link>

                  {/* Submission Date */}
                  <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 mt-3">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      Submitted on {new Date(complaint.created_at).toLocaleDateString()} at{' '}
                      {new Date(complaint.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center space-x-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-700/60 justify-end">
                  {/* Delete button (only allowed while Pending) */}
                  {complaint.status === 'Pending' && (
                    <button
                      onClick={(e) => handleDelete(complaint.id, e)}
                      disabled={isDeleting && deletingId === complaint.id}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-xs transition"
                      title="Delete pending complaint"
                    >
                      {isDeleting && deletingId === complaint.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}

                  <Link
                    to={`/student/complaints/${complaint.id}`}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-slate-700/60 hover:bg-teal-600 text-slate-200 hover:text-white text-xs font-medium border border-slate-600/60 hover:border-teal-500 transition"
                  >
                    <span>Details</span>
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
