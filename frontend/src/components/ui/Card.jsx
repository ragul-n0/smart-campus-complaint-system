import React from 'react';

export default function Card({ children, className = '', hover = false, onClick }) {
  const hoverClasses = hover
    ? 'hover:shadow-md hover:border-slate-300 cursor-pointer'
    : '';

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200/90 rounded-xl shadow-card p-5 sm:p-6 transition-all ${hoverClasses} ${className}`}
    >
      {children}
    </div>
  );
}
