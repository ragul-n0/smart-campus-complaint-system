import React from 'react';
import { Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No items found',
  description = 'There are no records to display at this time.',
  actionLabel,
  actionTo,
  onAction,
}) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-8 sm:p-12 text-center shadow-card flex flex-col items-center justify-center max-w-lg mx-auto my-6">
      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition"
        >
          {actionLabel}
        </Link>
      )}

      {actionLabel && onAction && !actionTo && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
