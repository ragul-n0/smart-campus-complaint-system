import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, AlertCircle, Loader2 } from 'lucide-react';
import { loginUser } from '../services/auth';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errs = {};
    if (!formData.username.trim()) {
      errs.username = 'Username is required.';
    }
    if (!formData.password) {
      errs.password = 'Password is required.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) {
      setServerError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError('');

    try {
      const response = await loginUser({
        username: formData.username.trim(),
        password: formData.password,
      });

      const role = response?.user?.role;
      if (role === 'student') {
        navigate('/student/dashboard');
      } else if (role === 'staff') {
        navigate('/staff/dashboard');
      } else if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      setServerError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl p-7 sm:p-9 shadow-card">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 mb-3 shadow-xs border border-blue-100">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign In to CampusFlow</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Access your student, staff, or admin portal
          </p>
        </div>

        {serverError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start space-x-2.5 shadow-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Username
            </label>
            <input
              type="text"
              name="username"
              id="login-username"
              value={formData.username}
              onChange={handleChange}
              placeholder="e.g. teststudent"
              className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border ${
                errors.username ? 'border-rose-300 focus:border-rose-500' : 'border-slate-300 focus:border-blue-500'
              } text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition`}
              autoComplete="username"
            />
            {errors.username && <p className="text-xs text-rose-600 mt-1">{errors.username}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              name="password"
              id="login-password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border ${
                errors.password ? 'border-rose-300 focus:border-rose-500' : 'border-slate-300 focus:border-blue-500'
              } text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition`}
              autoComplete="current-password"
            />
            {errors.password && <p className="text-xs text-rose-600 mt-1">{errors.password}</p>}
          </div>

          <button
            type="submit"
            id="login-submit-btn"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-150 shadow-sm active:scale-[0.99] flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold underline-offset-4 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
