import React, { useState } from 'react';
import { TrendingUp, BarChart2 } from 'lucide-react';

export default function ComplaintTrendChart({
  trend = [],
  interval = 'daily',
  onIntervalChange,
  loading = false,
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const maxCount = Math.max(...trend.map((d) => d.count), 5);
  const chartHeight = 220;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;
  const totalWidth = 600;
  const plotWidth = totalWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  const yTicks = [0, Math.ceil(maxCount / 2), maxCount];

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-card transition-all flex flex-col justify-between h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Complaint Submission Trends
              </h3>
              <p className="text-xs text-slate-500">
                Volume of incoming issues reported across time
              </p>
            </div>
          </div>
        </div>

        {/* Interval Selector Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto">
          {['daily', 'weekly', 'monthly'].map((intVal) => (
            <button
              key={intVal}
              type="button"
              onClick={() => onIntervalChange && onIntervalChange(intVal)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all capitalize ${
                interval === intVal
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {intVal}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-56 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : trend.length === 0 ? (
        <div className="h-56 flex flex-col items-center justify-center bg-slate-50 rounded-lg border border-slate-200/60 p-4 text-center">
          <BarChart2 className="w-8 h-8 text-slate-400 mb-2" />
          <p className="text-xs sm:text-sm font-medium text-slate-600">
            No complaint activity recorded
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Try adjusting your date range or filter criteria.
          </p>
        </div>
      ) : (
        <div className="relative w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${totalWidth} ${chartHeight}`}
            className="w-full h-auto overflow-visible select-none"
          >
            {/* Horizontal Gridlines */}
            {yTicks.map((tickVal) => {
              const y = paddingTop + plotHeight - (tickVal / maxCount) * plotHeight;
              return (
                <g key={tickVal}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={totalWidth - paddingRight}
                    y2={y}
                    stroke="#E2E8F0"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="text-[10px] fill-slate-400 font-mono font-medium"
                  >
                    {tickVal}
                  </text>
                </g>
              );
            })}

            {/* Bars */}
            {trend.map((d, index) => {
              const slotWidth = plotWidth / trend.length;
              const barWidth = Math.min(Math.max(slotWidth * 0.65, 8), 32);
              const barHeight = (d.count / maxCount) * plotHeight;
              const x = paddingLeft + index * slotWidth + (slotWidth - barWidth) / 2;
              const y = paddingTop + plotHeight - barHeight;
              const isHovered = hoveredPoint && hoveredPoint.period === d.period;

              return (
                <g
                  key={d.period}
                  onMouseEnter={() => setHoveredPoint(d)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  className="cursor-pointer transition-opacity"
                >
                  {/* Invisible Hitbox */}
                  <rect
                    x={paddingLeft + index * slotWidth}
                    y={paddingTop}
                    width={slotWidth}
                    height={plotHeight}
                    fill="transparent"
                  />
                  {/* Bar */}
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={Math.max(barHeight, 2)}
                    rx={3}
                    className={`transition-all ${
                      isHovered
                        ? 'fill-blue-600'
                        : 'fill-blue-500 hover:fill-blue-600 opacity-90'
                    }`}
                  />
                  {/* Period Label (every Nth label if too crowded) */}
                  {(trend.length <= 10 || index % Math.ceil(trend.length / 8) === 0) && (
                    <text
                      x={x + barWidth / 2}
                      y={chartHeight - 12}
                      textAnchor="middle"
                      className="text-[10px] fill-slate-500 font-medium"
                    >
                      {d.period.length > 7 ? d.period.slice(5) : d.period}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Interactive Floating Tooltip */}
          {hoveredPoint && (
            <div className="absolute top-2 right-4 bg-slate-900 text-white px-3 py-1.5 rounded-lg shadow-lg text-xs pointer-events-none transition-all">
              <span className="font-semibold">{hoveredPoint.period}:</span>{' '}
              <span className="text-blue-300 font-mono font-bold">
                {hoveredPoint.count}
              </span>{' '}
              complaint{hoveredPoint.count === 1 ? '' : 's'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
