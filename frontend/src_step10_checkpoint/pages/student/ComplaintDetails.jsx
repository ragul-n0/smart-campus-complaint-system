import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Tag,
  Building,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit3,
  Loader2,
  Check,
} from 'lucide-react';
import {
  fetchComplaintDetails,
  fetchComplaintHistory,
  updateComplaint,
  deleteComplaint,
  fetchLocations,
} from '../../services/complaints';

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

  const loadData = async () => {
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
  };

  useEffect(() => {
    loadData();
  }, [id]);

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
        <Loader2 className="w-8 h-8 animate-spin text-teal-400 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">Loading complaint details...</p>
      </div>
    );
  }

  if (errorMsg && !complaint) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white mb-2">Error Loading Complaint</h2>
          <p className="text-sm mb-6">{errorMsg}</p>
          <Link
            to="/student/complaints"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to My Complaints</span>
          </Link>
        </div>
      </div>
    );
  }

  // Calculate timeline milestone index
  const currentStepIndex = STATUS_STEPS.indexOf(complaint.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          to="/student/complaints"
          className="inline-flex items-center space-x-2 text-xs font-medium text-slate-400 hover:text-teal-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Complaints</span>
        </Link>

        {/* Action Controls for Pending complaints */}
        {complaint.status === 'Pending' && !isEditing && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              <Edit3 className="w-3.5 h-3.5 text-teal-400" />
              <span>Edit</span>
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20 transition"
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

      {/* Alerts */}
      {actionSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs sm:text-sm flex items-center space-x-2.5">
          <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs sm:text-sm flex items-center space-x-2.5">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Details Card */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md mb-8">
        {isEditing ? (
          /* Inline Edit Form */
          <form onSubmit={handleEditSubmit} className="space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-700">
              <h2 className="text-lg font-bold text-white">Edit Pending Complaint</h2>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-white text-xs font-medium"
              >
                Cancel
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Title</label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-slate-800">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm((p) => ({ ...p, priority: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                >
                  {PRIORITIES.map((pr) => (
                    <option key={pr} value={pr} className="bg-slate-800">
                      {pr} Priority
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Location</label>
              <select
                value={editForm.location_id}
                onChange={(e) => setEditForm((p) => ({ ...p, location_id: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id} className="bg-slate-800">
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-700">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl text-slate-300 hover:text-white text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center space-x-2"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        ) : (
          /* View Details */
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs font-mono text-slate-400 font-bold bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-700/60">
                Complaint #{complaint.id}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/20">
                Status: {complaint.status}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Priority: {complaint.priority}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-4">
              {complaint.title}
            </h1>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 mb-6 text-xs">
              <div>
                <div className="text-slate-500 flex items-center space-x-1 mb-1">
                  <Tag className="w-3.5 h-3.5 text-teal-400" />
                  <span>Category</span>
                </div>
                <div className="font-semibold text-slate-200">{complaint.category}</div>
              </div>

              <div>
                <div className="text-slate-500 flex items-center space-x-1 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-400" />
                  <span>Location</span>
                </div>
                <div className="font-semibold text-slate-200">{complaint.location?.name || 'Campus'}</div>
              </div>

              <div>
                <div className="text-slate-500 flex items-center space-x-1 mb-1">
                  <Building className="w-3.5 h-3.5 text-teal-400" />
                  <span>Department</span>
                </div>
                <div className="font-semibold text-slate-200">
                  {complaint.department?.name ? `${complaint.department.name} Dept` : 'Unassigned'}
                </div>
              </div>

              <div>
                <div className="text-slate-500 flex items-center space-x-1 mb-1">
                  <Clock className="w-3.5 h-3.5 text-teal-400" />
                  <span>Submitted</span>
                </div>
                <div className="font-semibold text-slate-200">
                  {new Date(complaint.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Detailed Description
              </h3>
              <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap bg-slate-900/40 p-4 rounded-xl border border-slate-700/50">
                {complaint.description}
              </p>
            </div>

            {/* Attached Photo */}
            {complaint.image_url && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Attached Photo / Evidence
                </h3>
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-700/60 inline-block">
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
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-md mb-8">
        <h2 className="text-base sm:text-lg font-bold text-white mb-6">Status Progression</h2>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-2">
          {STATUS_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={step}
                className={`relative p-3.5 rounded-xl border text-center transition-all ${
                  isCurrent
                    ? 'bg-teal-500/20 border-teal-500 text-white shadow-lg shadow-teal-500/10'
                    : isCompleted
                    ? 'bg-slate-900/60 border-teal-500/40 text-teal-300'
                    : 'bg-slate-900/30 border-slate-700/60 text-slate-500'
                }`}
              >
                <div
                  className={`w-7 h-7 mx-auto mb-2 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCurrent
                      ? 'bg-teal-500 text-slate-900'
                      : isCompleted
                      ? 'bg-teal-500/30 text-teal-300'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                <div className="text-xs font-bold">{step}</div>
                {isCurrent && (
                  <div className="text-[10px] text-teal-400 font-medium mt-1">Current State</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Audit History Log */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-md">
        <h2 className="text-base sm:text-lg font-bold text-white mb-4">Activity &amp; Audit Log</h2>

        {history.length === 0 ? (
          <p className="text-xs text-slate-400">No status updates recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex items-start space-x-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/60 text-xs"
              >
                <div className="w-2 h-2 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-200">
                      {item.comment || `Status updated to ${item.new_status}`}
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Transition: {item.old_status ? `${item.old_status} → ` : ''}
                    <span className="text-teal-400 font-medium">{item.new_status}</span>
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
