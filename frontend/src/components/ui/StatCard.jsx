import React from 'react';
import { Loader2 } from 'lucide-react';

export default function StatCard({
  icon: Icon,
  label,
  value,
  loading = false,
  variant = 'blue',
  subtitle,
  onClick,
}) {
  const variantStyles = {
    blue: {
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
    },
    indigo: {
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    },
    emerald: {
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    slate: {
      iconBg: 'bg-slate-100 text-slate-600 border-slate-200',
    },
    rose: {
      iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
    },
  };

  const currentVariant = variantStyles[variant] || variantStyles.blue;

  const cardContent = (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-card hover:shadow-md hover:border-slate-300 transition-all group flex flex-col justify-between h-full">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        {Icon && (
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center border ${currentVariant.iconBg} transition-transform group-hover:scale-105`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div>
        <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          ) : (
            value ?? 0
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>
        )}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="text-left w-full h-full block">
        {cardContent}
      </button>
    );
  }

  return cardContent;
}
