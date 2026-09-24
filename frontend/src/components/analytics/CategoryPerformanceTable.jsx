import React from 'react';
import { Tag } from 'lucide-react';
import CategoryBadge from '../ui/CategoryBadge';

export default function CategoryPerformanceTable({ categoryPerformance = [], loading = false }) {
  const formatHours = (val) => {
    if (val === null || val === undefined || val === 0) return '0.0 hrs';
    return `${val} hrs`;
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-card mb-6 transition-all">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
          <Tag className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            Category Resolution Performance
          </h3>
          <p className="text-xs text-slate-500">
            Lifecycle throughput and turnaround speed grouped by issue domain
          </p>
        </div>
      </div>

      {loading ? (
        <div className="h-44 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : categoryPerformance.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-slate-200/60">
          No category performance records available.
        </div>
      ) : (
        <div className="overflow-x-auto -mx-5 sm:mx-0">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-3 text-center">Total</th>
                <th className="py-3 px-3 text-center text-amber-600">Open</th>
                <th className="py-3 px-3 text-center text-emerald-600">Resolved</th>
                <th className="py-3 px-3 text-center text-slate-600">Closed</th>
                <th className="py-3 px-4 text-center">Resolution Rate</th>
                <th className="py-3 px-4 text-right">Avg Resolution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categoryPerformance.map((cat) => (
                <tr
                  key={cat.category}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <CategoryBadge category={cat.category} />
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                    {cat.total_complaints}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-amber-600 font-medium">
                    {cat.open_complaints}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-emerald-600 font-medium">
                    {cat.resolved_complaints}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-slate-600 font-medium">
                    {cat.closed_complaints}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full"
                          style={{ width: `${Math.min(cat.resolution_rate, 100)}%` }}
                        />
                      </div>
                      <span className="font-mono font-semibold text-slate-800 w-11 text-right">
                        {cat.resolution_rate}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-slate-700">
                    {formatHours(cat.average_resolution_hours)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
