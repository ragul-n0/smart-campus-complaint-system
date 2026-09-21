import React from 'react';

export default function StatusBadge({ status, size = 'sm' }) {
  const norm = (status || 'pending').toLowerCase();

  let style = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';
  let label = status || 'Pending';

  if (norm === 'pending') {
    style = 'bg-slate-100 text-slate-700 border-slate-200';
    dotColor = 'bg-slate-500';
    label = 'Pending';
  } else if (norm === 'assigned') {
    style = 'bg-blue-50 text-blue-700 border-blue-200';
    dotColor = 'bg-blue-500';
    label = 'Assigned';
  } else if (norm === 'in progress' || norm === 'in_progress') {
    style = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    dotColor = 'bg-indigo-500';
    label = 'In Progress';
  } else if (norm === 'resolved') {
    style = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dotColor = 'bg-emerald-500';
    label = 'Resolved';
  } else if (norm === 'closed') {
    style = 'bg-teal-50 text-teal-700 border-teal-200';
    dotColor = 'bg-teal-500';
    label = 'Closed';
  } else if (norm === 'rejected') {
    style = 'bg-rose-50 text-rose-700 border-rose-200';
    dotColor = 'bg-rose-500';
    label = 'Rejected';
  }

  const sizeClass = size === 'xs' 
    ? 'text-[11px] px-2 py-0.5' 
    : size === 'md'
    ? 'text-xs px-3 py-1'
    : 'text-xs px-2.5 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${style} ${sizeClass} transition-colors`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{label}</span>
    </span>
  );
}
