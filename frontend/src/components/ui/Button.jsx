import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  type = 'button',
  className = '',
  onClick,
  ...props
}) {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white border-transparent shadow-sm',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-transparent',
    outline: 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-sm',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 border-transparent',
    danger: 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200',
    'danger-solid': 'bg-rose-600 hover:bg-rose-700 text-white border-transparent shadow-sm',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-sm',
  };

  const sizes = {
    xs: 'px-2.5 py-1 text-xs rounded-md font-medium',
    sm: 'px-3 py-1.5 text-xs rounded-lg font-medium',
    md: 'px-4 py-2 text-sm rounded-lg font-medium',
    lg: 'px-5 py-2.5 text-base rounded-lg font-semibold',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 border font-sans transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 ${
        variants[variant] || variants.primary
      } ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current flex-shrink-0" />
      ) : Icon ? (
        <Icon className="w-4 h-4 flex-shrink-0" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
