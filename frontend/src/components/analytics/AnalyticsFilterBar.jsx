import React, { useState } from 'react';
import { Filter, RotateCcw, ChevronDown } from 'lucide-react';

const CATEGORIES = [
  'All',
  'IT',
  'Electrical',
  'Maintenance',
  'Housekeeping',
  'Security',
  'Plumbing',
  'Furniture',
  'Other',
];

const PRIORITIES = ['All', 'High', 'Medium', 'Low'];

const STATUSES = ['All', 'Pending', 'Assigned', 'In Progress', 'Resolved', 'Closed'];

export default function AnalyticsFilterBar({
  filters,
  onChange,
  onReset,
  departments = [],
  locations = [],
  loading = false,
}) {
  const [datePreset, setDatePreset] = useState('all');
  const [dateError, setDateError] = useState('');

  const formatDate = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    setDateError('');
    const today = new Date();

    if (preset === 'all') {
      onChange({ start_date: '', end_date: '' });
    } else if (preset === 'today') {
      const todayStr = formatDate(today);
      onChange({ start_date: todayStr, end_date: todayStr });
    } else if (preset === '7days') {
      const past = new Date(today);
      past.setDate(past.getDate() - 7);
      onChange({ start_date: formatDate(past), end_date: formatDate(today) });
    } else if (preset === '30days') {
      const past = new Date(today);
      past.setDate(past.getDate() - 30);
      onChange({ start_date: formatDate(past), end_date: formatDate(today) });
    } else if (preset === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      onChange({ start_date: formatDate(firstDay), end_date: formatDate(today) });
    }
  };

  const handleCustomDateChange = (field, val) => {
    setDatePreset('custom');
    setDateError('');

    const newStart = field === 'start_date' ? val : filters.start_date;
    const newEnd = field === 'end_date' ? val : filters.end_date;

    if (newStart && newEnd && newStart > newEnd) {
      setDateError('From date cannot be after To date');
      return;
    }

    onChange({ [field]: val });
  };

  const handleSelectChange = (key, value) => {
    onChange({ [key]: value });
  };

  const handleResetClick = () => {
    setDatePreset('all');
    setDateError('');
    onReset();
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-card mb-6 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Analytics Filter Controls</span>
        </div>
        <button
          type="button"
          onClick={handleResetClick}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 transition self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear All Filters</span>
        </button>
      </div>

      {dateError && (
        <div className="mb-3 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {dateError}
        </div>
      )}

      {/* Filter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Date Preset */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Time Range Preset
          </label>
          <div className="relative">
            <select
              value={datePreset}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none pr-8 cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="thisMonth">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Date From */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            From Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={filters.start_date || ''}
              onChange={(e) => handleCustomDateChange('start_date', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Date To */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            To Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={filters.end_date || ''}
              onChange={(e) => handleCustomDateChange('end_date', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Department Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Department
          </label>
          <div className="relative">
            <select
              value={filters.department_id || 'All'}
              onChange={(e) => handleSelectChange('department_id', e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none pr-8 cursor-pointer"
            >
              <option value="All">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Category
          </label>
          <div className="relative">
            <select
              value={filters.category || 'All'}
              onChange={(e) => handleSelectChange('category', e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none pr-8 cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Categories' : c}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Priority
          </label>
          <div className="relative">
            <select
              value={filters.priority || 'All'}
              onChange={(e) => handleSelectChange('priority', e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none pr-8 cursor-pointer"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p === 'All' ? 'All Priorities' : p}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Status
          </label>
          <div className="relative">
            <select
              value={filters.status || 'All'}
              onChange={(e) => handleSelectChange('status', e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none pr-8 cursor-pointer"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === 'All' ? 'All Statuses' : s}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Location Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Campus Location
          </label>
          <div className="relative">
            <select
              value={filters.location_id || 'All'}
              onChange={(e) => handleSelectChange('location_id', e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none pr-8 cursor-pointer"
            >
              <option value="All">All Locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
