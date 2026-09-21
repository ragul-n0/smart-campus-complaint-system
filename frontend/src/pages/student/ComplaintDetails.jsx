import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Building,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit3,
  Loader2,
  Check,
  User,
} from 'lucide-react';
import {
  fetchComplaintDetails,
  fetchComplaintHistory,
  updateComplaint,
  deleteComplaint,
  fetchLocations,
} from '../../services/complaints';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import CategoryBadge from '../../components/ui/CategoryBadge';

const STATUS_STEPS = ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Closed'];

const CATEGORIES = [
  'IT',
  'Electrical',
  'Maintenance',
  'Housekeeping',
  'Security',
  'Plumbing',
  'Furniture',
  'Other',
];

const PRIORITIES = ['Low', 'Medium', 'High'];

export default function ComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [history, setHistory] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: '',
    priority: '',
    location_id: '',
    image_url: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const [compData, histData, locsData] = await Promise.all([
        fetchComplaintDetails(id),
        fetchComplaintHistory(id),
        fetchLocations().catch(() => []),
      ]);
      setComplaint(compData);
      setHistory(histData);
      setLocations(locsData);

      setEditForm({
        title: compData.title,
        description: compData.description,
        category: compData.category,
        priority: compData.priority,
        location_id: compData.location_id,
        image_url: compData.image_url || '',
      });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load complaint details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!complaint || complaint.status !== 'Pending') {
      setErrorMsg('Complaints can only be modified while status is Pending.');
      return;
    }

    try {
      setIsUpdating(true);
      setErrorMsg('');
      const updated = await updateComplaint(id, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        category: editForm.category,
        priority: editForm.priority,
        location_id: Number(editForm.location_id),
        image_url: editForm.image_url ? editForm.image_url.trim() : null,
      });

      setComplaint(updated);
      setIsEditing(false);
      setActionSuccess('Complaint updated successfully.');
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update complaint.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this complaint? This cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteComplaint(id);
      navigate('/student/complaints', {
        state: { message: `Complaint #${id} was deleted successfully.` },
      });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete complaint.');
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Loading complaint details...</p>
      </div>
    );
  }

  if (errorMsg && !complaint) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="p-8 rounded-xl bg-white border border-rose-200 shadow-card">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">Error Loading Complaint</h2>
          <p className="text-sm text-slate-600 mb-6">{errorMsg}</p>
          <Link
            to="/student/complaints"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to My Complaints</span>
          </Link>
        </div>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.indexOf(complaint?.status || 'Pending');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <Link
          to="/student/complaints"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Complaints</span>
        </Link>

        {/* Action Controls for Pending complaints */}
        {complaint.status === 'Pending' && !isEditing && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-subtle transition"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
              <span>Edit Issue</span>
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center space-x-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center space-x-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Details Card */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-6 sm:p-8 shadow-card mb-6">
        {isEditing ? (
          /* Inline Edit Form */
          <form onSubmit={handleEditSubmit} className="space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Edit Pending Complaint
              </h2>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-slate-500 hover:text-slate-700 text-xs font-medium"
              >
                Cancel
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Priority
                </label>
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm((p) => ({ ...p, priority: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                >
                  {PRIORITIES.map((pr) => (
                    <option key={pr} value={pr}>
                      {pr} Priority
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Location
              </label>
              <select
                value={editForm.location_id}
                onChange={(e) => setEditForm((p) => ({ ...p, location_id: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Description
              </label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                rows={4}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 resize-y"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition"
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        ) : (
          /* View Details */
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs font-mono text-slate-500 font-bold bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                #{complaint.id}
              </span>
              <StatusBadge status={complaint.status} size="sm" />
              <PriorityBadge priority={complaint.priority} size="sm" showIcon />
              <CategoryBadge category={complaint.category} size="sm" />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-4">
              {complaint.title}
            </h1>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6 text-xs">
              <div>
                <div className="text-slate-500 flex items-center gap-1 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>Location</span>
                </div>
                <div className="font-semibold text-slate-800">
                  {complaint.location?.name || 'Campus'}
                </div>
              </div>

              <div>
                <div className="text-slate-500 flex items-center gap-1 mb-1">
                  <Building className="w-3.5 h-3.5 text-blue-600" />
                  <span>Department</span>
                </div>
                <div className="font-semibold text-slate-800">
                  {complaint.department?.name ? `${complaint.department.name} Dept` : 'Unassigned'}
                </div>
              </div>

              <div>
                <div className="text-slate-500 flex items-center gap-1 mb-1">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Assigned Staff</span>
                </div>
                <div className="font-semibold text-slate-800">
                  {complaint.assigned_staff?.name || 'Not assigned yet'}
                </div>
              </div>

              <div>
                <div className="text-slate-500 flex items-center gap-1 mb-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Submitted</span>
                </div>
                <div className="font-semibold text-slate-800">
                  {new Date(complaint.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Detailed Description
              </h3>
              <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap bg-white p-4 rounded-xl border border-slate-200">
                {complaint.description}
              </p>
            </div>

            {/* Attached Photo */}
            {complaint.image_url && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Attached Photo / Evidence
                </h3>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 inline-block">
                  <img
                    src={complaint.image_url}
                    alt="Complaint evidence"
                    className="max-h-72 max-w-full rounded-lg object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Progress Timeline */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-card mb-6">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-5">
          Status Progression
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {STATUS_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={step}
                className={`relative p-3.5 rounded-xl border text-center transition-all ${
                  isCurrent
                    ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-sm'
                    : isCompleted
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-800'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div
                  className={`w-7 h-7 mx-auto mb-2 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCurrent
                      ? 'bg-blue-600 text-white'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                <div className="text-xs font-bold">{step}</div>
                {isCurrent && (
                  <div className="text-[10px] text-blue-700 font-semibold mt-1">Current State</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity & Audit History */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-card">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4">
          Activity &amp; Audit Log
        </h2>

        {history.length === 0 ? (
          <p className="text-xs text-slate-500">No status updates recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              >
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800">
                      {item.comment || `Status updated to ${item.new_status}`}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1.5">
                    <span>Transition:</span>
                    {item.old_status && (
                      <>
                        <StatusBadge status={item.old_status} size="xs" />
                        <span>&rarr;</span>
                      </>
                    )}
                    <StatusBadge status={item.new_status} size="xs" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
