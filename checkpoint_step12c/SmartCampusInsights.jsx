import React from 'react';
import {
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Clock,
  Layers,
  Building2,
  MapPin,
  CheckCircle2,
  FileText,
  AlertCircle,
} from 'lucide-react';

export default function SmartCampusInsights({
  insights = [],
  overview = {},
  loading = false,
}) {
  // Find insights by ID with fallback lookup
  const getInsight = (id) => insights.find((item) => item.id === id);

  const totalComplaints = overview?.total_complaints ?? 0;
  const openComplaints =
    (overview?.pending_complaints || 0) +
    (overview?.assigned_complaints || 0) +
    (overview?.in_progress_complaints || 0);
  const highPriority = overview?.high_priority_complaints ?? 0;
  const resolutionRate = overview?.resolution_rate ?? 0;

  const topCategoryInsight = getInsight('top_category');
  const topDeptInsight = getInsight('top_department');
  const topLocInsight = getInsight('top_location');
  const avgResInsight = getInsight('avg_resolution_time');
  const workloadInsight = getInsight('workload_highest_open');
  const trendPeakInsight = getInsight('trend_peak');

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-card mb-6 transition-all">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Smart Campus Insights
            </h3>
            <p className="text-xs text-slate-500">
              Deterministic observations and operational highlights derived from filtered database records
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Live Insights
          </span>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl" />
          ))}
        </div>
      ) : totalComplaints === 0 ? (
        /* Empty Filter State */
        <div className="py-8 text-center bg-slate-50/70 border border-slate-200/60 rounded-xl">
          <AlertCircle className="w-6 h-6 text-slate-400 mx-auto mb-2" />
          <p className="text-xs sm:text-sm font-semibold text-slate-700">
            No sufficient data for insights in the current filter selection
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Adjust your filter criteria or reset filters to generate factual campus observations.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* 1. CAMPUS OVERVIEW HIGHLIGHT CARDS */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
              Campus Overview
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Total Complaints */}
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 flex items-start gap-3 hover:border-blue-200 transition">
                <div className="w-8 h-8 rounded-lg bg-blue-100/70 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-slate-500">Total Volume</div>
                  <div className="text-lg font-bold text-slate-900 font-mono">
                    {totalComplaints}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    Matching current filters
                  </div>
                </div>
              </div>

              {/* Open Complaints */}
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 flex items-start gap-3 hover:border-amber-200 transition">
                <div className="w-8 h-8 rounded-lg bg-amber-100/70 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-slate-500">Open Complaints</div>
                  <div className="text-lg font-bold text-amber-700 font-mono">
                    {openComplaints}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {totalComplaints > 0
                      ? `${((openComplaints / totalComplaints) * 100).toFixed(1)}% active workload`
                      : '0%'}
                  </div>
                </div>
              </div>

              {/* High Priority */}
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 flex items-start gap-3 hover:border-rose-200 transition">
                <div className="w-8 h-8 rounded-lg bg-rose-100/70 text-rose-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-slate-500">High Priority</div>
                  <div className="text-lg font-bold text-rose-700 font-mono">
                    {highPriority}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {highPriority > 0
                      ? `${((highPriority / totalComplaints) * 100).toFixed(1)}% urgent attention`
                      : 'Zero critical issues'}
                  </div>
                </div>
              </div>

              {/* Resolution Rate */}
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 flex items-start gap-3 hover:border-emerald-200 transition">
                <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-slate-500">Resolution Rate</div>
                  <div className="text-lg font-bold text-emerald-700 font-mono">
                    {resolutionRate}%
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    Closure rate: {overview?.closure_rate ?? 0}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. KEY OBSERVATIONS GRID */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
              Key Observations
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Top Category */}
              <div className="bg-slate-50/60 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-slate-700">Top Complaint Category</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-2">
                  {topCategoryInsight?.description || 'No sufficient data for this insight.'}
                </p>
                {topCategoryInsight?.metric && topCategoryInsight.metric !== 'No data available' && (
                  <span className="inline-block self-start text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {topCategoryInsight.metric}
                  </span>
                )}
              </div>

              {/* Most Affected Department */}
              <div className="bg-slate-50/60 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-semibold text-slate-700">Most Affected Department</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-2">
                  {topDeptInsight?.description || 'No sufficient data for this insight.'}
                </p>
                {topDeptInsight?.metric && topDeptInsight.metric !== 'No data available' && (
                  <span className="inline-block self-start text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {topDeptInsight.metric}
                  </span>
                )}
              </div>

              {/* Most Affected Location */}
              <div className="bg-slate-50/60 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-semibold text-slate-700">Most Reported Location</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-2">
                  {topLocInsight?.description || 'No sufficient data for this insight.'}
                </p>
                {topLocInsight?.metric && topLocInsight.metric !== 'No data available' && (
                  <span className="inline-block self-start text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {topLocInsight.metric}
                  </span>
                )}
              </div>

              {/* Average Resolution Time */}
              <div className="bg-slate-50/60 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-slate-700">Average Turnaround</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-2">
                  {avgResInsight?.description || 'No sufficient data for this insight.'}
                </p>
                {avgResInsight?.metric && avgResInsight.metric !== 'N/A' && (
                  <span className="inline-block self-start text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {avgResInsight.metric} avg
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 3. WORKLOAD OBSERVATION BANNER */}
          <div className="bg-gradient-to-r from-blue-50/60 via-slate-50 to-indigo-50/60 border border-blue-200/70 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span>Workload &amp; Operational Observations</span>
                  {workloadInsight?.metric && (
                    <span className="text-[10px] font-semibold bg-white border border-blue-200 text-blue-700 px-2 py-0.5 rounded-full">
                      {workloadInsight.metric}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {workloadInsight?.description || 'No sufficient data for workload insights.'}
                  {trendPeakInsight?.description && ` ${trendPeakInsight.description}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
