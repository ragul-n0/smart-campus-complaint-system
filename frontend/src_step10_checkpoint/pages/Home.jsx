import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { checkBackendHealth } from '../services/api';
import { getUser, isAuthenticated } from '../services/auth';

export default function Home() {
  const [backendStatus, setBackendStatus] = useState({
    checked: false,
    online: false,
    data: null,
    error: null,
  });
  const [loading, setLoading] = useState(false);
  const authed = isAuthenticated();
  const user = getUser();

  const verifyBackend = async () => {
    setLoading(true);
    try {
      const result = await checkBackendHealth();
      if (result && result.status === 'online') {
        setBackendStatus({
          checked: true,
          online: true,
          data: result,
          error: null,
        });
      } else {
        setBackendStatus({
          checked: true,
          online: false,
          data: null,
          error: result?.error || 'Backend service unreachable',
        });
      }
    } catch (err) {
      setBackendStatus({
        checked: true,
        online: false,
        data: null,
        error: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyBackend();
  }, []);

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'student') return '/student/dashboard';
    if (user.role === 'staff') return '/staff/dashboard';
    if (user.role === 'admin') return '/admin/dashboard';
    return '/login';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col justify-center">
      <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 sm:p-10 border border-slate-700/80 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-teal-500/10 text-teal-300 border border-teal-500/20">
            Phase 2: Database &amp; Authentication Active
          </div>
          <span className="text-xs text-slate-400">
            Academic Project &bull; B.E. Computer Science
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-4 leading-snug">
          Smart Campus Complaint &amp; Issue Management System
        </h1>

        <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
          A centralized, zero-cost platform designed for transparent campus grievance redressal. The system features secure JWT-based authentication, role segregation (Student, Staff, Admin), and an SQLite/PostgreSQL flexible database architecture.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          {authed && user ? (
            <Link
              to={getDashboardPath()}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition shadow-lg shadow-teal-700/20 active:scale-[0.98]"
            >
              Go to Your Dashboard ({user.role}) &rarr;
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition shadow-lg shadow-teal-700/20 active:scale-[0.98]"
              >
                Sign In &rarr;
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-sm transition border border-slate-600 active:scale-[0.98]"
              >
                Register New Account
              </Link>
            </>
          )}

          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition border border-slate-700"
          >
            Swagger API Docs &rarr;
          </a>
        </div>

        {/* Live System Diagnostics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/70 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Frontend Client</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                Active
              </span>
            </div>
            <div>
              <p className="text-slate-200 font-medium text-sm">React 19 + Tailwind CSS + Router</p>
              <p className="text-slate-400 text-xs mt-1">Responsive Desktop, Tablet &amp; Mobile</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/70 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">FastAPI Backend</span>
              {backendStatus.online ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></span>
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5"></span>
                  {backendStatus.checked ? 'Offline' : 'Checking...'}
                </span>
              )}
            </div>
            <div>
              <p className="text-slate-200 font-medium text-sm">
                JWT Auth + SQLAlchemy ORM
              </p>
              <p className="text-slate-400 text-xs mt-1">
                Database: {backendStatus.data?.database?.type || 'SQLite'} ({backendStatus.data?.database?.status || 'Active'})
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
