import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ArrowRight,
  Database,
  Layers,
  Sparkles,
  Server,
  FileCheck2,
} from 'lucide-react';
import { checkBackendHealth } from '../services/api';
import { getUser, isAuthenticated } from '../services/auth';

export default function Home() {
  const [backendStatus, setBackendStatus] = useState({
    checked: false,
    online: false,
    data: null,
    error: null,
  });
  const [, setLoading] = useState(false);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 flex-1 flex flex-col justify-center">
      {/* Hero Section */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-14 shadow-card text-center sm:text-left relative overflow-hidden mb-12">
        {/* Subtle decorative background accent */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-96 h-96 rounded-full bg-blue-50/50 pointer-events-none -z-0"></div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>CampusFlow SaaS &bull; AI Grievance Intelligence Active</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-5">
            Smart Campus Grievance Redressal Platform
          </h1>

          <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-8">
            An institutional-grade issue resolution ecosystem powered by machine learning. Facilitating seamless complaint lodging, automatic department categorization, real-time status telemetry, and responsive campus management.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3.5 mb-10">
            {authed && user ? (
              <Link
                to={getDashboardPath()}
                className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition active:scale-[0.99]"
              >
                <span>Go to Dashboard ({user.role})</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition active:scale-[0.99]"
                >
                  <span>Student &amp; Staff Login</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm transition active:scale-[0.99] border border-slate-200"
                >
                  <span>Register Account</span>
                </Link>
              </>
            )}

            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-2 px-5 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition border border-slate-300"
            >
              <span>API Swagger Docs</span>
            </a>
          </div>

          {/* Value Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-100">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">AI Auto-Classification</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">TF-IDF &amp; SGDClassifier multi-class routing</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">End-to-End Tracking</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Stepwise audit trail from lodging to resolution</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Role Segregation</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Protected boundaries for Students, Staff, Admins</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live System Diagnostics & Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5 animate-pulse"></span>
              Operational
            </span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Modern Frontend Suite</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              React 19, Vite, and Tailwind CSS design tokens built to the CampusFlow university SaaS design guidelines.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            {backendStatus.online ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5"></span>
                API Connected
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mr-1.5"></span>
                {backendStatus.checked ? 'Offline' : 'Testing...'}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">FastAPI Asynchronous Backend</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              JWT bearer authentication, SQLAlchemy ORM, role guard middleware, and high-performance endpoints.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              {backendStatus.data?.database?.type || 'SQLite'}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Relational Persistence Engine</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Thread-safe ACID database with complaint lifecycle records, location definitions, and staff workload indexes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
