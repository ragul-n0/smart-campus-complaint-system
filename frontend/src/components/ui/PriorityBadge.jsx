import React from 'react';
import { ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';

export default function PriorityBadge({ priority, size = 'sm', showIcon = false }) {
  const norm = (priority || 'medium').toLowerCase();

  let style = 'bg-amber-50 text-amber-700 border-amber-200';
  let Icon = ArrowRight;
  let label = priority || 'Medium';

  if (norm === 'high') {
    style = 'bg-rose-50 text-rose-700 border-rose-200';
    Icon = ArrowUp;
    label = 'High';
  } else if (norm === 'low') {
    style = 'bg-slate-100 text-slate-700 border-slate-200';
    Icon = ArrowDown;
    label = 'Low';
  } else {
    style = 'bg-amber-50 text-amber-700 border-amber-200';
    Icon = ArrowRight;
    label = 'Medium';
  }

  const sizeClass = size === 'xs' 
    ? 'text-[11px] px-2 py-0.5' 
    : size === 'md'
    ? 'text-xs px-3 py-1'
    : 'text-xs px-2.5 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full border ${style} ${sizeClass} transition-colors`}
    >
      {showIcon && <Icon className="w-3 h-3" />}
      <span>{label}</span>
    </span>
  );
}
