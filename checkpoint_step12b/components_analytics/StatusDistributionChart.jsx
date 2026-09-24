import React, { useState } from 'react';
import { PieChart as PieIcon } from 'lucide-react';

const STATUS_COLORS = {
  Pending: { hex: '#F59E0B', badge: 'bg-amber-500' },
  Assigned: { hex: '#6366F1', badge: 'bg-indigo-500' },
  'In Progress': { hex: '#3B82F6', badge: 'bg-blue-500' },
  Resolved: { hex: '#10B981', badge: 'bg-emerald-500' },
  Closed: { hex: '#64748B', badge: 'bg-slate-500' },
};

export default function StatusDistributionChart({ statusDistribution = [], loading = false }) {
  const [hovered, setHovered] = useState(null);

  const total = statusDistribution.reduce((acc, curr) => acc + curr.count, 0);

  // Donut geometry constants
  const size = 180;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;
  const segments = statusDistribution.map((item) => {
    const ratio = total > 0 ? item.count / total : 0;
    const strokeDasharray = `${ratio * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeOffset;
    cumulativeOffset += ratio * circumference;
    const color = STATUS_COLORS[item.status]?.hex || '#94A3B8';

    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
      color,
    };
  });

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-card transition-all flex flex-col justify-between h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
          <PieIcon className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            Status Breakdown
          </h3>
          <p className="text-xs text-slate-500">Lifecycle state proportions</p>
        </div>
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : total === 0 ? (
        <div className="h-48 flex flex-col items-center justify-center bg-slate-50 rounded-lg border border-slate-200/60 p-4 text-center">
          <p className="text-xs sm:text-sm font-medium text-slate-600">No status data</p>
          <p className="text-xs text-slate-400 mt-0.5">Complaints will appear here once submitted.</p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
          {/* Donut Chart SVG */}
          <div className="relative w-44 h-44 flex items-center justify-center flex-shrink-0">
            <svg width={size} height={size} className="transform -rotate-90">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="#F1F5F9"
                strokeWidth={strokeWidth}
              />
              {segments.map((seg) => (
                <circle
                  key={seg.status}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  className="transition-all duration-300 hover:opacity-85 cursor-pointer"
                  onMouseEnter={() => setHovered(seg)}
                  onMouseLeave={() => setHovered(null)}
                />
              ))}
            </svg>

            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-2xl font-bold text-slate-900 font-mono">
                {hovered ? hovered.count : total}
              </span>
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                {hovered ? hovered.status : 'Complaints'}
              </span>
            </div>
          </div>

          {/* Legend Table */}
          <div className="flex-1 w-full space-y-2">
            {segments.map((seg) => (
              <div
                key={seg.status}
                onMouseEnter={() => setHovered(seg)}
                onMouseLeave={() => setHovered(null)}
                className={`flex items-center justify-between text-xs p-1.5 rounded-lg transition-all cursor-pointer ${
                  hovered && hovered.status === seg.status
                    ? 'bg-slate-100 font-semibold'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="text-slate-700 font-medium">{seg.status}</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-slate-900 font-bold">{seg.count}</span>
                  <span className="text-slate-400 text-[11px] w-12 text-right">
                    {seg.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
