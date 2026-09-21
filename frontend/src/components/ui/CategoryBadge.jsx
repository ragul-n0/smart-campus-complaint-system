import React from 'react';
import {
  Laptop,
  Zap,
  Wrench,
  Sparkles,
  Shield,
  Droplet,
  Armchair,
  HelpCircle,
} from 'lucide-react';

const CATEGORY_CONFIG = {
  IT: {
    icon: Laptop,
    style: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  Electrical: {
    icon: Zap,
    style: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  Maintenance: {
    icon: Wrench,
    style: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  Housekeeping: {
    icon: Sparkles,
    style: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  Security: {
    icon: Shield,
    style: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  Plumbing: {
    icon: Droplet,
    style: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  },
  Furniture: {
    icon: Armchair,
    style: 'bg-stone-100 text-stone-700 border-stone-200',
  },
  Other: {
    icon: HelpCircle,
    style: 'bg-slate-100 text-slate-700 border-slate-200',
  },
};

export default function CategoryBadge({ category, showIcon = true, size = 'sm' }) {
  const norm = category || 'Other';
  const config = CATEGORY_CONFIG[norm] || CATEGORY_CONFIG.Other;
  const Icon = config.icon;

  const sizeClass = size === 'xs'
    ? 'text-[11px] px-2 py-0.5'
    : size === 'md'
    ? 'text-xs px-3 py-1'
    : 'text-xs px-2.5 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${config.style} ${sizeClass} transition-colors`}
    >
      {showIcon && <Icon className="w-3 h-3 flex-shrink-0" />}
      <span>{norm}</span>
    </span>
  );
}
