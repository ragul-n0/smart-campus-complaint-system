import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  RotateCw,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import {
  fetchAdminLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from '../../services/admin';

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

  // Handlers
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
      setSuccessMsg(`Location '${deleteData.name}' deleted successfully.`);
      setDeleteData(null);
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete location.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout
      title="Location Management"
      subtitle="Register and manage campus zones, classroom blocks, and facilities for student issue reporting."
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => {
              setFormData({ name: '', description: '' });
              setIsAddOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Location</span>
          </button>
        </div>
      }
    >
      {/* Messages */}
      {errorMsg && (
        <div className="mb-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-xs hover:text-white ml-2">
            Dismiss
          </button>
        </div>
      )}
      {successMsg && (
        <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-xs hover:text-white ml-2">
            Dismiss
          </button>
        </div>
      )}

      {/* Locations Table */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <RotateCw className="w-8 h-8 text-purple-400 animate-spin mb-3" />
            <span className="text-sm">Loading campus locations...</span>
          </div>
        ) : locations.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <MapPin className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No Locations Registered</h3>
            <p className="text-slate-400 text-xs">Register your first campus facility or block above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700/70 bg-slate-900/40 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">#ID</th>
                  <th className="py-3 px-4">Location Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Reported Complaints</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 text-xs">
                {locations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-purple-300 font-semibold">
                      #{loc.id}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white text-sm flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-400" />
                        <span>{loc.name}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300 max-w-sm">
                      {loc.description || <span className="text-slate-500 italic">None provided</span>}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 font-mono text-[11px]">
                        <FileText className="w-3 h-3" />
                        <span>{loc.complaint_count} issues</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() =>
                          setEditData({
                            id: loc.id,
                            name: loc.name,
                            description: loc.description || '',
                          })
                        }
                        className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-600 text-slate-200 transition"
                        title="Edit location"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeleteData(loc)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-3">Add New Campus Location</h3>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Location Name:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Science Block, Basketball Court..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description:
                </label>
                <textarea
                  placeholder="Details, floor, or landmarks..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !formData.name.trim()}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition"
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-3">Edit Location #{editData.id}</h3>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Location Name:
                </label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description:
                </label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditData(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !editData.name.trim()}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition"
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Delete Location?</h3>
            <p className="text-xs text-slate-300 mb-4">
              Are you sure you want to delete <strong className="text-white">{deleteData.name}</strong>?
            </p>

            <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-3 mb-4 text-[11px] text-slate-400">
              Note: Campus locations currently referenced by existing complaints cannot be deleted.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700">
              <button
                type="button"
                onClick={() => setDeleteData(null)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={actionLoading}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition"
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
