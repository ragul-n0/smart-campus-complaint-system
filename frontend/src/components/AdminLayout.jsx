import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, AlertCircle, Users, Building2, MapPin, BarChart3, ShieldCheck, TrendingUp } from 'lucide-react';
import { getUser } from '../services/auth';

export default function AdminLayout({ children, title, subtitle, action }) {
  const user = getUser();

  const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/complaints', label: 'Complaints', icon: AlertCircle },
    { to: '/admin/analytics', label: 'Analytics', icon: TrendingUp },
    { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/departments', label: 'Departments', icon: Building2 },
    { to: '/admin/locations', label: 'Locations', icon: MapPin },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 w-full">
      {/* Admin Top Header Card */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-card mb-6 transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Campus Management Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {title || 'Administrative Console'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {subtitle || `Logged in as ${user?.name || 'Administrator'} (@${user?.username})`}
            </p>
          </div>

          {action && (
            <div className="flex items-center gap-3">
              {action}
            </div>
          )}
        </div>

        {/* Subnavigation Bar */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pt-4 mt-5 border-t border-slate-100 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}
