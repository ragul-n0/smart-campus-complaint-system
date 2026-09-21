import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  RotateCw,
  AlertTriangle,
  FileText,
  X,
  CheckCircle2,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import {
  fetchAdminLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from '../../services/admin';
import EmptyState from '../../components/ui/EmptyState';

export default function AdminLocations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editData, setEditData] = useState(null); // { id, name, description }
  const [deleteData, setDeleteData] = useState(null); // location to delete
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await fetchAdminLocations();
      setLocations(data);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load campus locations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setActionLoading(true);
    setErrorMsg('');
    try {
      await createLocation(formData);
      setSuccessMsg(`Location '${formData.name}' created successfully.`);
      setIsAddOpen(false);
      setFormData({ name: '', description: '' });
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create location.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editData?.name.trim()) return;
    setActionLoading(true);
    setErrorMsg('');
    try {
      await updateLocation(editData.id, {
        name: editData.name,
        description: editData.description,
      });
      setSuccessMsg(`Location '${editData.name}' updated successfully.`);
      setEditData(null);
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update location.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deleteData) return;
    setActionLoading(true);
    setErrorMsg('');
    try {
      await deleteLocation(deleteData.id);
      setSuccessMsg(`Location '${deleteData.name}' deleted.`);
      setDeleteData(null);
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete location. Verify active complaints.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout
      title="Campus Facility Locations"
      subtitle="Manage academic blocks, hostel buildings, computer laboratories, and common areas."
      action={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-subtle transition"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setFormData({ name: '', description: '' });
              setIsAddOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Location</span>
          </button>
        </div>
      }
    >
      {/* Messages */}
      {errorMsg && (
        <div className="mb-4 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            className="text-rose-700 hover:text-rose-900 font-bold ml-2"
          >
            &times;
          </button>
        </div>
      )}
      {successMsg && (
        <div className="mb-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg('')}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-2"
          >
            &times;
          </button>
        </div>
      )}

      {/* Locations Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-card overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-xs text-slate-500">Loading campus locations...</span>
          </div>
        ) : locations.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No Locations Registered"
            description="Register your first campus facility, block, or hall to allow students to pinpoint issues."
            actionLabel="Add Location"
            onAction={() => setIsAddOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">#ID</th>
                  <th className="py-3 px-4">Location Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Reported Complaints</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {locations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400 font-semibold">
                      #{loc.id}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span>{loc.name}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 max-w-sm">
                      {loc.description || <span className="text-slate-400 italic">None provided</span>}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-mono text-[11px]">
                        <FileText className="w-3 h-3 text-blue-600" />
                        <span>{loc.complaint_count} issues</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() =>
                          setEditData({
                            id: loc.id,
                            name: loc.name,
                            description: loc.description || '',
                          })
                        }
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition shadow-subtle"
                        title="Edit location"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteData(loc)}
                        className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition shadow-subtle"
                        title="Delete location"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Location Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-elevated animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Campus Location</h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Location Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Science Block, West Hostel, Library 2F..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Specific buildings, rooms, or landmarks included..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 resize-y"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !formData.name.trim()}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition"
                >
                  {actionLoading ? 'Creating...' : 'Create Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Location Modal */}
      {editData && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-elevated animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Edit Location #{editData.id}
              </h3>
              <button
                type="button"
                onClick={() => setEditData(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Location Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 resize-y"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditData(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !editData.name.trim()}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteData && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-sm w-full p-6 shadow-elevated animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Delete Location?</h3>
            <p className="text-xs text-slate-600 mb-4">
              Are you sure you want to delete <strong className="text-slate-900">{deleteData.name}</strong>?
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 text-[11px] text-slate-500 leading-normal">
              Note: Campus locations with active complaints attached cannot be deleted to prevent broken records.
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteData(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition"
              >
                {actionLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
