import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  LayoutDashboard,
  PlusCircle,
  ListFilter,
  Building2,
  Users,
  BarChart3,
  TrendingUp,
  LogOut,
  Menu,
  X,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import { getUser, isAuthenticated, logout } from '../services/auth';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const authed = isAuthenticated();
  const user = getUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navLinkClasses = (path) =>
    `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
      isActive(path)
        ? 'bg-blue-50 text-blue-700 font-semibold shadow-subtle'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  const mobileLinkClasses = (path) =>
    `flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
      isActive(path)
        ? 'bg-blue-50 text-blue-700 font-semibold'
        : 'text-slate-700 hover:bg-slate-100'
    }`;

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-subtle transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" onClick={closeMobileMenu} className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-700 transition-all">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-900 tracking-tight leading-none group-hover:text-blue-600 transition-colors">
              CampusFlow
            </div>
            <div className="text-[10px] text-slate-500 font-medium tracking-wider uppercase mt-0.5">
              Issue Management
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {authed && user ? (
            <div className="flex items-center space-x-1 lg:space-x-2">
              {/* Student Nav */}
              {user.role === 'student' && (
                <>
                  <Link to="/student/dashboard" className={navLinkClasses('/student/dashboard')}>
                    <LayoutDashboard className="w-4 h-4 text-slate-500" />
                    <span>Dashboard</span>
                  </Link>
                  <Link to="/student/submit" className={navLinkClasses('/student/submit')}>
                    <PlusCircle className="w-4 h-4 text-blue-600" />
                    <span>Submit Complaint</span>
                  </Link>
                  <Link to="/student/complaints" className={navLinkClasses('/student/complaints')}>
                    <ListFilter className="w-4 h-4 text-slate-500" />
                    <span>My Complaints</span>
                  </Link>
                </>
              )}

              {/* Staff Nav */}
              {user.role === 'staff' && (
                <>
                  <Link to="/staff/dashboard" className={navLinkClasses('/staff/dashboard')}>
                    <LayoutDashboard className="w-4 h-4 text-slate-500" />
                    <span>Department Queue</span>
                  </Link>
                  {user.department && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      {user.department.name}
                    </span>
                  )}
                </>
              )}

              {/* Admin Nav */}
              {user.role === 'admin' && (
                <>
                  <Link to="/admin/dashboard" className={navLinkClasses('/admin/dashboard')}>
                    <LayoutDashboard className="w-4 h-4 text-slate-500" />
                    <span>Dashboard</span>
                  </Link>
                  <Link to="/admin/complaints" className={navLinkClasses('/admin/complaints')}>
                    <AlertCircle className="w-4 h-4 text-slate-500" />
                    <span>Complaints</span>
                  </Link>
                  <Link to="/admin/users" className={navLinkClasses('/admin/users')}>
                    <Users className="w-4 h-4 text-slate-500" />
                    <span>Users</span>
                  </Link>
                  <Link to="/admin/departments" className={navLinkClasses('/admin/departments')}>
                    <Building2 className="w-4 h-4 text-slate-500" />
                    <span>Departments</span>
                  </Link>
                  <Link to="/admin/locations" className={navLinkClasses('/admin/locations')}>
                    <MapPin className="w-4 h-4 text-slate-500" />
                    <span>Locations</span>
                  </Link>
                  <Link to="/admin/analytics" className={navLinkClasses('/admin/analytics')}>
                    <TrendingUp className="w-4 h-4 text-slate-500" />
                    <span>Analytics</span>
                  </Link>
                  <Link to="/admin/reports" className={navLinkClasses('/admin/reports')}>
                    <BarChart3 className="w-4 h-4 text-slate-500" />
                    <span>Reports</span>
                  </Link>
                </>
              )}

              {/* User Profile Badge */}
              <div className="pl-3 pr-2 py-0.5 border-l border-slate-200 text-right">
                <div className="text-xs font-semibold text-slate-800 leading-tight">
                  {user.name}
                </div>
                <div className="text-[10px] text-slate-500 capitalize font-medium">
                  {user.role} &bull; <span className="font-mono text-slate-400">@{user.username}</span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-medium transition-colors"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-sm font-medium transition"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition"
              >
                Register
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-200">
          {authed && user ? (
            <>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg mb-3">
                <div className="text-sm font-semibold text-slate-900">{user.name}</div>
                <div className="text-xs text-slate-500">
                  <span className="capitalize font-medium text-blue-600">{user.role}</span> &bull; @{user.username}
                </div>
              </div>

              {user.role === 'student' && (
                <div className="space-y-1">
                  <Link
                    to="/student/dashboard"
                    onClick={closeMobileMenu}
                    className={mobileLinkClasses('/student/dashboard')}
                  >
                    <LayoutDashboard className="w-4 h-4 text-slate-500" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/student/submit"
                    onClick={closeMobileMenu}
                    className={mobileLinkClasses('/student/submit')}
                  >
                    <PlusCircle className="w-4 h-4 text-blue-600" />
                    <span>Submit Complaint</span>
                  </Link>
                  <Link
                    to="/student/complaints"
                    onClick={closeMobileMenu}
                    className={mobileLinkClasses('/student/complaints')}
                  >
                    <ListFilter className="w-4 h-4 text-slate-500" />
                    <span>My Complaints</span>
                  </Link>
                </div>
              )}

              {user.role === 'staff' && (
                <div className="space-y-1">
                  <Link
                    to="/staff/dashboard"
                    onClick={closeMobileMenu}
                    className={mobileLinkClasses('/staff/dashboard')}
                  >
                    <LayoutDashboard className="w-4 h-4 text-slate-500" />
                    <span>Department Queue</span>
                  </Link>
                </div>
              )}

              {user.role === 'admin' && (
                <div className="space-y-1">
                  <Link
                    to="/admin/dashboard"
                    onClick={closeMobileMenu}
                    className={mobileLinkClasses('/admin/dashboard')}
                  >
                    <LayoutDashboard className="w-4 h-4 text-slate-500" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/admin/complaints"
                    onClick={closeMobileMenu}
                    className={mobileLinkClasses('/admin/complaints')}
                  >
                    <AlertCircle className="w-4 h-4 text-slate-500" />
                    <span>Complaints</span>
                  </Link>
                  <Link
                    to="/admin/users"
                    onClick={closeMobileMenu}
                    className={mobileLinkClasses('/admin/users')}
                  >
                    <Users className="w-4 h-4 text-slate-500" />
                    <span>Users</span>
                  </Link>
                  <Link
                    to="/admin/departments"
                    onClick={closeMobileMenu}
                    className={mobileLinkClasses('/admin/departments')}
                  >
                    <Building2 className="w-4 h-4 text-slate-500" />
                    <span>Departments</span>
                  </Link>
                  <Link
                    to="/admin/locations"
                    onClick={closeMobileMenu}
                    className={mobileLinkClasses('/admin/locations')}
                  >
                    <MapPin className="w-4 h-4 text-slate-500" />
                    <span>Locations</span>
                  </Link>
                  <Link
                    to="/admin/analytics"
                    onClick={closeMobileMenu}
                    className={mobileLinkClasses('/admin/analytics')}
                  >
                    <TrendingUp className="w-4 h-4 text-slate-500" />
                    <span>Analytics</span>
                  </Link>
                  <Link
                    to="/admin/reports"
                    onClick={closeMobileMenu}
                    className={mobileLinkClasses('/admin/reports')}
                  >
                    <BarChart3 className="w-4 h-4 text-slate-500" />
                    <span>Reports</span>
                  </Link>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-sm font-medium transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2 pt-1">
              <Link
                to="/login"
                onClick={closeMobileMenu}
                className="w-full flex items-center justify-center px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={closeMobileMenu}
                className="w-full flex items-center justify-center px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-sm transition"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
