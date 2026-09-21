import React from 'react';

export default function PageHeader({
  badge,
  badgeIcon: BadgeIcon,
  title,
  subtitle,
  children,
  action,
}) {
  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-card mb-6 sm:mb-8 transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {badge && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
              {BadgeIcon && <BadgeIcon className="w-3.5 h-3.5 text-blue-600" />}
              <span>{badge}</span>
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-normal">
              {subtitle}
            </p>
          )}
        </div>

        {(action || children) && (
          <div className="flex items-center gap-3 flex-wrap">
            {action}
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
