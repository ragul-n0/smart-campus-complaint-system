import React from 'react';
import { Tag } from 'lucide-react';
import CategoryBadge from '../ui/CategoryBadge';

export default function CategoryDistributionChart({ categoryDistribution = [], loading = false }) {
  const maxCount = Math.max(...categoryDistribution.map((c) => c.count), 1);
  const total = categoryDistribution.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-card transition-all flex flex-col justify-between h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
          <Tag className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            Category Distribution
          </h3>
          <p className="text-xs text-slate-500">Distribution across ML classification categories</p>
        </div>
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : total === 0 ? (
        <div className="h-48 flex flex-col items-center justify-center bg-slate-50 rounded-lg border border-slate-200/60 p-4 text-center">
          <p className="text-xs sm:text-sm font-medium text-slate-600">No category data</p>
          <p className="text-xs text-slate-400 mt-0.5">Complaints will appear here once submitted.</p>
        </div>
      ) : (
        <div className="space-y-3 py-1">
          {categoryDistribution.map((item) => {
            const widthPct = Math.round((item.count / maxCount) * 100);

            return (
              <div key={item.category} className="group">
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-1.5">
                    <CategoryBadge category={item.category} />
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-slate-800">{item.count}</span>
                    <span className="text-[11px] text-slate-400 w-12 text-right">
                      {item.percentage}%
                    </span>
                  </div>
                </div>

                {/* Progress Track */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500 group-hover:bg-blue-700"
                    style={{ width: `${Math.max(widthPct, item.count > 0 ? 3 : 0)}%` }}
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
