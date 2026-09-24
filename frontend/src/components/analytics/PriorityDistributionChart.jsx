import React from 'react';
import { AlertTriangle } from 'lucide-react';
import PriorityBadge from '../ui/PriorityBadge';

const PRIORITY_STYLES = {
  High: {
    bg: 'bg-rose-500',
    lightBg: 'bg-rose-50 border-rose-200 text-rose-800',
    bar: 'bg-rose-500',
  },
  Medium: {
    bg: 'bg-amber-500',
    lightBg: 'bg-amber-50 border-amber-200 text-amber-800',
    bar: 'bg-amber-500',
  },
  Low: {
    bg: 'bg-emerald-500',
    lightBg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    bar: 'bg-emerald-500',
  },
};

export default function PriorityDistributionChart({ priorityDistribution = [], loading = false }) {
  const maxCount = Math.max(...priorityDistribution.map((p) => p.count), 1);
  const total = priorityDistribution.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-card transition-all flex flex-col justify-between h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            Priority Distribution
          </h3>
          <p className="text-xs text-slate-500">Urgency classification of issues</p>
        </div>
      </div>

      {loading ? (
        <div className="h-44 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : total === 0 ? (
        <div className="h-44 flex flex-col items-center justify-center bg-slate-50 rounded-lg border border-slate-200/60 p-4 text-center">
          <p className="text-xs sm:text-sm font-medium text-slate-600">No priority data</p>
          <p className="text-xs text-slate-400 mt-0.5">Complaints will appear here once submitted.</p>
        </div>
      ) : (
        <div className="space-y-4 py-2">
          {priorityDistribution.map((item) => {
            const widthPct = Math.round((item.count / maxCount) * 100);
            const style = PRIORITY_STYLES[item.priority] || {
              bar: 'bg-blue-600',
              lightBg: 'bg-slate-100 text-slate-800',
            };

            return (
              <div key={item.priority} className="group">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={item.priority} />
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-slate-900">{item.count}</span>
                    <span className="text-[11px] text-slate-400 w-12 text-right">
                      {item.percentage}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`${style.bar} h-2.5 rounded-full transition-all duration-500 group-hover:opacity-90`}
                    style={{ width: `${Math.max(widthPct, item.count > 0 ? 4 : 0)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
