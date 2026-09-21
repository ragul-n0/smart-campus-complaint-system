import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  MapPin,
  Tag,
  AlertTriangle,
  Image as ImageIcon,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Sparkles,
  Info,
} from 'lucide-react';
import { fetchLocations, createComplaint, predictComplaintCategory } from '../../services/complaints';
import CategoryBadge from '../../components/ui/CategoryBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';

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

export default function SubmitComplaint() {
  const navigate = useNavigate();

  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'IT',
    priority: 'Medium',
    location_id: '',
    image_url: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [mlPredictionInfo, setMlPredictionInfo] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    async function loadLocations() {
      try {
        setLoadingLocations(true);
        const locs = await fetchLocations();
        setLocations(locs);
        if (locs.length > 0) {
          setFormData((prev) => ({ ...prev, location_id: locs[0].id }));
        }
      } catch (_err) {
        setErrorMsg('Failed to load campus locations. Please refresh.');
      } finally {
        setLoadingLocations(false);
      }
    }
    loadLocations();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'location_id' ? parseInt(value, 10) : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, image_url: previewUrl }));
    }
  };

  const handleAutoDetectML = async () => {
    const textToAnalyze = `${formData.title} ${formData.description}`.trim();
    if (!textToAnalyze || textToAnalyze.length < 5) {
      setErrorMsg('Please enter a title or description first so AI can classify your issue.');
      return;
    }

    try {
      setIsPredicting(true);
      setErrorMsg('');
      const res = await predictComplaintCategory({
        title: formData.title.trim(),
        description: formData.description.trim(),
      });
      if (res && res.predicted_category) {
        setFormData((prev) => ({
          ...prev,
          category: res.predicted_category,
          priority: res.predicted_priority || prev.priority,
        }));
        setMlPredictionInfo(res);
      }
    } catch (_err) {
      setErrorMsg('AI classification service was unable to process the request. You can still select manually.');
    } finally {
      setIsPredicting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.title.trim()) {
      setErrorMsg('Please provide a complaint title.');
      return;
    }
    if (formData.title.trim().length < 3) {
      setErrorMsg('Title must be at least 3 characters.');
      return;
    }
    if (!formData.description.trim()) {
      setErrorMsg('Please describe the issue in detail.');
      return;
    }
    if (formData.description.trim().length < 5) {
      setErrorMsg('Description must be at least 5 characters.');
      return;
    }
    if (!formData.location_id) {
      setErrorMsg('Please select a campus location.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.priority,
        location_id: Number(formData.location_id),
        image_url: formData.image_url ? formData.image_url.trim() : null,
      };

      const result = await createComplaint(payload);
      setSuccessMsg(`Complaint #${result.id} submitted successfully!`);

      setTimeout(() => {
        navigate('/student/complaints', {
          state: { message: `Complaint #${result.id} submitted successfully!` },
        });
      }, 1200);
    } catch (err) {
      setErrorMsg(err.message || 'Submission failed. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full">
      {/* Back to Dashboard Navigation */}
      <div className="mb-4 sm:mb-6">
        <Link
          to="/student/dashboard"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Main Form Card */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-6 sm:p-8 shadow-card">
        {/* Header */}
        <div className="flex items-start gap-4 pb-6 mb-6 border-b border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Submit a Campus Complaint
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Tell us what happened and where it occurred. Our campus maintenance team will review and resolve it.
            </p>
          </div>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{successMsg}</p>
              <p className="text-xs text-emerald-700 mt-0.5">Redirecting to your complaints list...</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Complaint Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Complaint Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Wi-Fi disconnecting in computer lab or Broken fan in Classroom 204"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm shadow-sm transition"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Provide a clear, brief summary of the issue.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide specific details such as room number, floor, observable symptoms, and equipment affected..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm shadow-sm transition resize-y"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Minimum 5 characters. The more detail provided, the faster facilities can diagnose the problem.
            </p>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Campus Location <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                name="location_id"
                value={formData.location_id}
                onChange={handleChange}
                disabled={loadingLocations}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm shadow-sm transition disabled:bg-slate-100"
                required
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} {loc.description ? `— ${loc.description}` : ''}
                  </option>
                ))}
              </select>
            </div>
            {loadingLocations && (
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading campus locations...
              </p>
            )}
          </div>

          {/* Category & AI Auto-Detect Section */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Issue Category
                </label>
                <p className="text-[11px] text-slate-500">
                  Select manually or use campus AI to categorize automatically.
                </p>
              </div>

              {/* AI Auto-Detect Button */}
              <button
                type="button"
                onClick={handleAutoDetectML}
                disabled={isPredicting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold shadow-subtle transition disabled:opacity-50"
              >
                {isPredicting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                )}
                <span>{isPredicting ? 'Analyzing...' : 'Auto-Detect with AI'}</span>
              </button>
            </div>

            {/* AI Result Notice */}
            {mlPredictionInfo && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 transition-all ${
                  mlPredictionInfo.is_low_confidence
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-blue-50/70 border-blue-200 text-blue-900'
                }`}
              >
                {mlPredictionInfo.is_low_confidence ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap font-medium">
                    <span>AI detected:</span>
                    <CategoryBadge category={mlPredictionInfo.predicted_category} size="xs" />
                    <span className="text-slate-400">&bull;</span>
                    <span className="text-[11px] text-slate-600">
                      Confidence: {(mlPredictionInfo.category_confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  {mlPredictionInfo.is_low_confidence && (
                    <p className="text-[11px] text-amber-700 mt-1">
                      AI confidence is low. Please review the detected category and change if necessary.
                    </p>
                  )}
                </div>
              </div>
            )}

            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm shadow-sm transition"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Urgency Level
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm shadow-sm transition"
            >
              {PRIORITIES.map((prio) => (
                <option key={prio} value={prio}>
                  {prio} {prio === 'High' ? '(Critical / Safety Hazard)' : prio === 'Low' ? '(Minor / Cosmetic)' : '(Standard)'}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Default priority is Medium unless high urgency is selected.
            </p>
          </div>

          {/* Optional Attachment */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Photo Attachment <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
            />
            {formData.image_url && (
              <div className="mt-3 relative w-32 h-24 rounded-lg overflow-hidden border border-slate-200">
                <img
                  src={formData.image_url}
                  alt="Complaint Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <Link
              to="/student/dashboard"
              className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-xs sm:text-sm font-medium hover:bg-slate-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Complaint</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
