import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getUser, isAuthenticated, logout } from '../services/auth';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const authed = isAuthenticated();
  const user = getUser();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'student') return '/student/dashboard';
    if (user.role === 'staff') return '/staff/dashboard';
    if (user.role === 'admin') return '/admin/dashboard';
    return '/';
  };

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 font-bold text-lg shadow-sm group-hover:bg-teal-500/30 transition-all">
            SC
          </div>
          <div>
            <div className="text-sm sm:text-base font-bold text-white tracking-tight leading-none group-hover:text-teal-300 transition-colors">
              Smart Campus
            </div>
            <div className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-0.5">
              Issue Management
            </div>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center space-x-2 sm:space-x-3">
          {authed && user ? (
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Student specific navigation links */}
              {user.role === 'student' && (
                <div className="flex items-center space-x-1 sm:space-x-2 mr-1">
                  <Link
                    to="/student/dashboard"
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      location.pathname === '/student/dashboard'
                        ? 'bg-slate-800 text-teal-300 border border-teal-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/student/submit"
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      location.pathname === '/student/submit'
                        ? 'bg-slate-800 text-teal-300 border border-teal-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    Submit Complaint
                  </Link>
                  <Link
                    to="/student/complaints"
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      location.pathname.startsWith('/student/complaints')
                        ? 'bg-slate-800 text-teal-300 border border-teal-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    My Complaints
                  </Link>
                </div>
              )}

              {/* Staff navigation links */}
              {user.role === 'staff' && (
                <div className="flex items-center space-x-1 sm:space-x-2 mr-1">
                  <Link
                    to="/staff/dashboard"
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      location.pathname.startsWith('/staff')
                        ? 'bg-slate-800 text-teal-300 border border-teal-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    Department Queue
                  </Link>
                  {user.department && (
                    <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {user.department.name}
                    </span>
                  )}
                </div>
              )}

              {/* Admin navigation links */}
              {user.role === 'admin' && (
                <div className="flex items-center space-x-1 sm:space-x-2 mr-1">
                  <Link
                    to="/admin/dashboard"
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      location.pathname === '/admin/dashboard'
                        ? 'bg-slate-800 text-purple-300 border border-purple-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/admin/complaints"
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      location.pathname.startsWith('/admin/complaints')
                        ? 'bg-slate-800 text-purple-300 border border-purple-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    Complaints
                  </Link>
                  <Link
                    to="/admin/users"
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      location.pathname.startsWith('/admin/users')
                        ? 'bg-slate-800 text-purple-300 border border-purple-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    Users
                  </Link>
                  <Link
                    to="/admin/reports"
                    className={`hidden sm:inline-flex px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      location.pathname.startsWith('/admin/reports')
                        ? 'bg-slate-800 text-purple-300 border border-purple-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    Reports
                  </Link>
                  <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Admin
                  </span>
                </div>
              )}

              {/* User badge */}
              <div className="text-right hidden md:block pl-2 border-l border-slate-700">
                <div className="text-xs font-medium text-slate-200 leading-tight">{user.name}</div>
                <div className="text-[10px] text-slate-400 font-mono leading-tight">
                  @{user.username}
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold transition"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 text-xs sm:text-sm font-medium transition"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs sm:text-sm font-semibold shadow-sm transition"
              >
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
