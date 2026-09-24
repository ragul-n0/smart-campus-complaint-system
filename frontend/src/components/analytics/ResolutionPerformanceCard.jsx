import React from 'react';
import { Clock, Zap, Timer, CheckCircle, AlertCircle } from 'lucide-react';

export default function ResolutionPerformanceCard({ resolution = {}, loading = false }) {
  const {
    average_resolution_hours = 0,
    resolved_complaints = 0,
    fastest_resolution_hours = null,
    slowest_resolution_hours = null,
  } = resolution;

  const formatHours = (val) => {
    if (val === null || val === undefined) return 'N/A';
    if (val === 0) return '0 hrs';
    if (val < 1) return `${Math.round(val * 60)} mins`;
    return `${val} hrs`;
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-card mb-6 transition-all">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Resolution Turnaround &amp; Speed Metrics
            </h3>
            <p className="text-xs text-slate-500">
              Computed from live issue submission to resolution timestamps (resolved_at - created_at)
            </p>
          </div>
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
          Timestamp Audit
        </span>
      </div>

      {resolved_complaints === 0 ? (
        <div className="py-6 text-center bg-slate-50 border border-slate-200/60 rounded-xl">
          <AlertCircle className="w-6 h-6 text-slate-400 mx-auto mb-2" />
          <p className="text-xs sm:text-sm font-semibold text-slate-700">
            No resolved complaints yet
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Turnaround statistics will populate once staff resolve incoming complaints.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Average Resolution Time */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Average Turnaround</span>
              <Timer className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-600 font-mono">
              {formatHours(average_resolution_hours)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Mean duration to fix issues</p>
          </div>

          {/* Fastest Resolution */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Fastest Turnaround</span>
              <Zap className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 font-mono">
              {formatHours(fastest_resolution_hours)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Shortest time to resolve</p>
          </div>

          {/* Slowest Resolution */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Slowest Turnaround</span>
              <Clock className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-600 font-mono">
              {formatHours(slowest_resolution_hours)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Max turnaround duration</p>
          </div>

          {/* Resolved Count */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Resolved Sample Size</span>
              <CheckCircle className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-indigo-600 font-mono">
              {resolved_complaints}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Verified complaints solved</p>
          </div>
        </div>
      )}
    </div>
  );
}
