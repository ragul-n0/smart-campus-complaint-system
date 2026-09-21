import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Search,
  PlusCircle,
  Clock,
  MapPin,
  ChevronRight,
  Loader2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';
import { fetchMyComplaints, deleteComplaint } from '../../services/complaints';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import CategoryBadge from '../../components/ui/CategoryBadge';
import EmptyState from '../../components/ui/EmptyState';

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

  // Delete state
  const [deletingId, setDeletingId] = useState(null);

  const loadComplaints = useCallback(async () => {
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
  }, [selectedStatus, selectedCategory]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete complaint #${id}?`)) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteComplaint(id);
      setNotification(`Complaint #${id} deleted successfully.`);
      setComplaints((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete complaint.');
    } finally {
      setDeletingId(null);
    }
  };

  // Client-side search filtering by title & description
  const filteredComplaints = complaints.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.title.toLowerCase().includes(term) ||
      (c.description && c.description.toLowerCase().includes(term))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full">
      {/* Top Header */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-card mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              My Complaints
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Track, review status updates, and manage your reported campus issues.
            </p>
          </div>
          <Link
            to="/student/submit"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition active:scale-[0.99]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Complaint</span>
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification('')}
            className="text-emerald-700 hover:text-emerald-900 text-sm font-semibold ml-4"
          >
            &times;
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center space-x-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 mb-6 shadow-card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search complaints by title or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition shadow-sm"
            />
          </div>

          {/* Filter Status */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition shadow-sm bg-white"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status === 'All' ? 'All Statuses' : `Status: ${status}`}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Category */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition shadow-sm bg-white"
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category === 'All' ? 'All Categories' : `Category: ${category}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-800">{filteredComplaints.length}</strong> of{' '}
            <strong className="text-slate-800">{complaints.length}</strong> complaints
          </span>
          {(searchTerm || selectedStatus !== 'All' || selectedCategory !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedStatus('All');
                setSelectedCategory('All');
              }}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Complaint List */}
      {loading ? (
        <div className="py-16 text-center bg-white rounded-xl border border-slate-200 shadow-card">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs sm:text-sm text-slate-500">Loading your complaints...</p>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No complaints found"
          description={
            searchTerm || selectedStatus !== 'All' || selectedCategory !== 'All'
              ? 'No complaints match your active search or filter criteria. Try adjusting your filters.'
              : "You haven't submitted any complaints yet. Report an issue to get started."
          }
          actionLabel="Submit Complaint"
          actionTo="/student/submit"
        />
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredComplaints.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl p-4 sm:p-5 shadow-card hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-xs font-mono font-bold text-slate-400">
                    #{item.id}
                  </span>
                  <Link
                    to={`/student/complaints/${item.id}`}
                    className="text-sm sm:text-base font-semibold text-slate-900 hover:text-blue-600 transition"
                  >
                    {item.title}
                  </Link>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                  {item.description}
                </p>

                <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs text-slate-500">
                  <CategoryBadge category={item.category} size="xs" />
                  <PriorityBadge priority={item.priority} size="xs" />
                  <span className="text-slate-300 hidden sm:inline">&bull;</span>
                  <span className="inline-flex items-center gap-1 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.location?.name || 'Campus'}</span>
                  </span>
                  <span className="text-slate-300 hidden sm:inline">&bull;</span>
                  <span className="inline-flex items-center gap-1 text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 flex-shrink-0">
                <StatusBadge status={item.status} size="sm" />

                <div className="flex items-center gap-2">
                  <Link
                    to={`/student/complaints/${item.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 hover:text-blue-600 transition shadow-subtle"
                  >
                    <span>Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>

                  {/* Allow deleting pending complaints */}
                  {item.status === 'Pending' && (
                    <button
                      type="button"
                      disabled={deletingId === item.id}
                      onClick={(e) => handleDelete(item.id, e)}
                      title="Delete pending complaint"
                      className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition disabled:opacity-50"
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
